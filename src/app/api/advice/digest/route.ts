import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, emailConfigured } from '@/lib/email';
import { openRequests, norm } from '@/lib/advice';

export const dynamic = 'force-dynamic';

/**
 * POST /api/advice/digest — the weekly "your tips are wanted" email. Run by the server's own cron, with a key only the
 * server knows. Each member gets at most one email listing up to 3 new requests in countries they've been to.
 */
const SITE = 'https://tripshare.org';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function cronKey() {
  const s = process.env.SESSION_SECRET || '';
  return s ? crypto.createHmac('sha256', s).update('advice-digest').digest('hex') : '';
}

export async function POST(request: NextRequest) {
  const key = cronKey();
  const got = request.headers.get('x-cron-key') || '';
  if (!key || got.length !== key.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(key))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const dryRun = new URL(request.url).searchParams.get('dry') === '1';
  if (!emailConfigured() && !dryRun) return NextResponse.json({ sent: 0, note: 'email not configured' });

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const requests = (await openRequests({ since, take: 200 })).filter((r) => r.countries.length);
  if (!requests.length) return NextResponse.json({ requests: 0, sent: 0 });

  // Members who've been to any of those countries
  const wanted = new Set(requests.flatMap((r) => r.countries.map(norm)));
  const trips = await prisma.trip.findMany({
    where: { user: { emailOptOut: false, blockedAt: null } },
    select: { userId: true, countries: true, cities_data: { select: { country: true } } },
    take: 20000,
  });
  const been = new Map<string, Set<string>>();
  for (const t of trips) {
    let list: string[] = [];
    try { let x: any = t.countries; for (let i = 0; i < 2 && typeof x === 'string'; i++) x = JSON.parse(x); if (Array.isArray(x)) list = x.map(String); } catch {}
    for (const c of [...list, ...t.cities_data.map((c) => c.country)]) {
      if (c && wanted.has(norm(c))) (been.get(t.userId) || been.set(t.userId, new Set()).get(t.userId)!).add(c);
    }
  }

  let sent = 0, failed = 0, members = 0;
  for (const [userId, countries] of Array.from(been.entries())) {
    const mine = requests.filter((r) => r.userId !== userId && r.countries.some((c) => Array.from(countries).some((b) => norm(b) === norm(c)))).slice(0, 3);
    if (!mine.length) continue;
    members++;
    if (dryRun) continue;
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, emailOptOut: true, blockedAt: true } });
    if (!u?.email || u.emailOptOut || u.blockedAt) continue;
    const place = mine[0].countries.find((c) => Array.from(countries).some((b) => norm(b) === norm(c))) || mine[0].countries[0];
    const lines = mine.map((r) => `• ${r.title}${r.cities.length ? ` (${r.cities.slice(0, 3).join(', ')})` : ''}${r.ask ? `: “${r.ask.slice(0, 140)}”` : ''}`).join('\n');
    const res = await sendEmail(
      u.email,
      {
        subject: mine.length > 1 ? `Members planning trips to places you’ve been want your tips` : `Someone is planning ${place}. You’ve been there`,
        body: `Hi {name},\n\nMembers are planning trips to places you’ve shared, and they’re asking for advice:\n\n${lines}\n\nA quick “too many days” or “stay here instead” makes a real difference.`,
        linkUrl: mine.length === 1 ? `${SITE}/feedback/${mine[0].id}` : `${SITE}/feedback`,
        linkLabel: 'Give advice',
      },
      u.name || '',
      userId
    );
    res.ok ? sent++ : failed++;
    await sleep(600);
  }
  return NextResponse.json({ requests: requests.length, members, sent, failed, dryRun });
}
