import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, emailConfigured } from '@/lib/email';
import { cronAllowed } from '@/lib/cronKey';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/daily — run once a day by the server's own cron (key-protected).
 * 1. "Welcome back": planned trips that ended 2–9 days ago → ask the planner to share how it went (once per trip).
 * 2. Monthly thanks to authors: "N people saved places from your trips" (at most once every 28 days, only when there's news).
 * `?dry=1` only counts. Responds with counts only.
 */
const SITE = 'https://tripshare.org';
const DAY = 864e5;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ymd = (d: Date) => d.toISOString().slice(0, 10);

export async function POST(request: NextRequest) {
  if (!cronAllowed(request.headers.get('x-cron-key'), 'daily-jobs')) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const dry = new URL(request.url).searchParams.get('dry') === '1';
  const canSend = emailConfigured() && !dry;
  const out = { backDue: 0, backSent: 0, thanksDue: 0, thanksSent: 0, failed: 0, dry };

  // 1. Back from a planned trip
  const now = Date.now();
  const back = await prisma.sandboxTrip.findMany({
    where: { backAskedAt: null, endDate: { gte: ymd(new Date(now - 9 * DAY)), lte: ymd(new Date(now - 2 * DAY)) }, user: { blockedAt: null, emailOptOut: false } },
    select: { id: true, title: true, user: { select: { id: true, email: true, name: true } }, _count: { select: { places: true } } },
    take: 200,
  });
  for (const t of back.filter((t) => t._count.places > 0)) {
    out.backDue++;
    if (!canSend) continue;
    const r = await sendEmail(t.user.email, {
      subject: `Welcome back! How was “${t.title}”?`,
      body: `Hi {name},\n\nWelcome back from “${t.title}”. While it's fresh: your planned trip can become a trip to share in a few minutes. Your places are already filled in, so just add what you loved and what you'd skip.\n\nThe next person planning the same trip will thank you.`,
      linkUrl: `${SITE}/sandbox?trip=${t.id}`,
      linkLabel: 'Share how it went',
    }, t.user.name, t.user.id);
    if (r.ok) { out.backSent++; await prisma.sandboxTrip.update({ where: { id: t.id }, data: { backAskedAt: new Date() } }); } else out.failed++;
    await sleep(600);
  }

  // 2. Monthly thanks to authors whose trips people used
  const since = new Date(now - 30 * DAY);
  const saves = await prisma.savedPlace.findMany({
    where: { createdAt: { gte: since }, sourceTripId: { not: null } },
    select: { userId: true, sourceTripId: true },
    take: 50000,
  });
  if (saves.length) {
    const trips = await prisma.trip.findMany({
      where: { id: { in: Array.from(new Set(saves.map((s) => s.sourceTripId!))) }, isPublic: true, isDraft: false },
      select: { id: true, title: true, userId: true },
    });
    const tripById = new Map(trips.map((t) => [t.id, t]));
    const byAuthor = new Map<string, { savers: Set<string>; places: number; titles: Map<string, number> }>();
    for (const s of saves) {
      const t = tripById.get(s.sourceTripId!);
      if (!t || t.userId === s.userId) continue;
      const a = byAuthor.get(t.userId) || { savers: new Set<string>(), places: 0, titles: new Map<string, number>() };
      a.savers.add(s.userId);
      a.places++;
      a.titles.set(t.title, (a.titles.get(t.title) || 0) + 1);
      byAuthor.set(t.userId, a);
    }
    const authors = await prisma.user.findMany({
      where: { id: { in: Array.from(byAuthor.keys()) }, blockedAt: null, emailOptOut: false, OR: [{ authorThanksAt: null }, { authorThanksAt: { lt: new Date(now - 28 * DAY) } }] },
      select: { id: true, email: true, name: true },
    });
    for (const u of authors) {
      const a = byAuthor.get(u.id)!;
      out.thanksDue++;
      if (!canSend) continue;
      const top = Array.from(a.titles.entries()).sort((x, y) => y[1] - x[1])[0]?.[0] || 'your trip';
      const people = a.savers.size;
      const r = await sendEmail(u.email, {
        subject: `${people} ${people === 1 ? 'person' : 'people'} used your trips this month`,
        body: `Hi {name},\n\nThis month ${people} ${people === 1 ? 'member' : 'members'} saved ${a.places} ${a.places === 1 ? 'place' : 'places'} from your trips to plan their own, most of all from “${top}”.\n\nThank you. Trips like yours are why the site works. Been anywhere else lately? Sharing one takes about 5 minutes.`,
        linkUrl: `${SITE}/trips/import`,
        linkLabel: 'Share another trip',
      }, u.name, u.id);
      if (r.ok) { out.thanksSent++; await prisma.user.update({ where: { id: u.id }, data: { authorThanksAt: new Date() } }); } else out.failed++;
      await sleep(600);
    }
  }

  return NextResponse.json(out);
}
