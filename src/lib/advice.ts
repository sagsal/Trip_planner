import { prisma } from '@/lib/prisma';
import { sendEmail, emailConfigured } from '@/lib/email';
import { firstName, reactionLabel } from '@/lib/feedback';

/* "Ask someone who's been there": match planned trips asking for advice to members who've shared trips to the same countries */

const SITE = 'https://tripshare.org';
export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const parseList = (v: unknown): string[] => {
  try {
    let x: any = v;
    for (let i = 0; i < 2 && typeof x === 'string'; i++) x = JSON.parse(x);
    return Array.isArray(x) ? x.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
};

/** Countries a member has been to, from the trips they've added (drafts included), keyed by normalised name → display name */
export async function countriesBeen(userId: string): Promise<Map<string, string>> {
  const trips = await prisma.trip.findMany({
    where: { userId },
    select: { countries: true, cities: { select: { country: true } } },
    take: 500,
  });
  const out = new Map<string, string>();
  for (const t of trips) {
    for (const c of [...parseList(t.countries), ...t.cities.map((x) => x.country)]) if (c) out.set(norm(c), c);
  }
  return out;
}

/** Planned trips currently asking for advice, with their countries and cities */
export async function openRequests(opts: { notUserId?: string; since?: Date; take?: number } = {}) {
  const rows = await prisma.sandboxTrip.findMany({
    where: {
      feedbackOpen: true,
      user: { blockedAt: null },
      ...(opts.notUserId ? { NOT: { userId: opts.notUserId } } : {}),
      ...(opts.since ? { feedbackOpenedAt: { gte: opts.since } } : {}),
    },
    orderBy: { feedbackOpenedAt: 'desc' },
    take: opts.take ?? 100,
    select: {
      id: true, userId: true, title: true, region: true, feedbackAsk: true, feedbackOpenedAt: true, startDate: true, endDate: true,
      places: { select: { city: true, country: true }, take: 300 },
      _count: { select: { comments: true } },
    },
  });
  return rows.map((t) => ({
    id: t.id,
    userId: t.userId,
    title: t.title,
    region: t.region,
    ask: t.feedbackAsk,
    openedAt: t.feedbackOpenedAt,
    startDate: t.startDate,
    endDate: t.endDate,
    countries: Array.from(new Set(t.places.map((p) => p.country).filter(Boolean) as string[])),
    cities: Array.from(new Set(t.places.map((p) => p.city).filter(Boolean) as string[])),
    commentCount: t._count.comments,
  }));
}
export type OpenRequest = Awaited<ReturnType<typeof openRequests>>[number];

/** Which of the request's countries the member has been to (display names), or [] */
export const matchCountries = (r: { countries: string[] }, been: Map<string, string>) =>
  r.countries.filter((c) => been.has(norm(c)));

/* ---------- emails that close the loop (best effort; never block the request) ---------- */

// Don't flood anyone: at most one email per key per hour (one server process, so memory is enough)
const lastSent = new Map<string, number>();
const throttled = (key: string, ms = 60 * 60 * 1000) => {
  const now = Date.now();
  if ((lastSent.get(key) || 0) > now - ms) return true;
  lastSent.set(key, now);
  if (lastSent.size > 5000) lastSent.clear();
  return false;
};

async function recipient(userId: string) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, emailOptOut: true, blockedAt: true } });
  return u && !u.emailOptOut && !u.blockedAt && u.email ? u : null;
}

/** A member left advice on someone's planned trip → tell the planner */
export async function emailPlannerAboutAdvice(commentId: string) {
  if (!emailConfigured()) return;
  try {
    const c = await prisma.tripComment.findUnique({
      where: { id: commentId },
      select: { userId: true, targetType: true, reaction: true, text: true, targetLabel: true, user: { select: { name: true } }, sandboxTrip: { select: { id: true, title: true, userId: true } } },
    });
    if (!c || c.userId === c.sandboxTrip.userId) return;
    if (throttled(`advice:${c.sandboxTrip.id}`)) return;
    const to = await recipient(c.sandboxTrip.userId);
    if (!to) return;
    const who = firstName(c.user?.name);
    const what = reactionLabel(c.targetType as any, c.reaction);
    await sendEmail(
      to.email,
      {
        subject: `${who} has advice on “${c.sandboxTrip.title}”`,
        body: `Hi {name},\n\n${who} left advice on your planned trip “${c.sandboxTrip.title}”: ${what}${c.targetLabel && c.targetType !== 'trip' ? ` (about ${c.targetLabel})` : ''}.${c.text ? `\n\n“${c.text.slice(0, 400)}”` : ''}\n\nYou can accept a suggestion with one tap, and it goes straight into your plan.`,
        linkUrl: `${SITE}/sandbox?trip=${c.sandboxTrip.id}&tab=feedback`,
        linkLabel: 'Read the advice',
      },
      to.name || '',
      to.id
    );
  } catch {}
}

/** The planner accepted someone's suggestion → tell the member who gave it */
export async function emailAdviserAccepted(commentId: string) {
  if (!emailConfigured()) return;
  try {
    const c = await prisma.tripComment.findUnique({
      where: { id: commentId },
      select: { userId: true, suggestion: true, reaction: true, targetType: true, sandboxTrip: { select: { id: true, title: true, user: { select: { name: true } }, userId: true } } },
    });
    if (!c || c.userId === c.sandboxTrip.userId) return;
    if (throttled(`accepted:${c.userId}`)) return;
    const to = await recipient(c.userId);
    if (!to) return;
    const planner = firstName(c.sandboxTrip.user?.name);
    let place = '';
    try { place = c.suggestion ? JSON.parse(c.suggestion)?.name || '' : ''; } catch {}
    await sendEmail(
      to.email,
      {
        subject: `${planner} used your advice`,
        body: `Hi {name},\n\n${planner} accepted your advice on “${c.sandboxTrip.title}”${place ? `, and ${place} is now in their plan` : ''}. Thank you for helping.\n\nOther members are planning trips too, and some of them are going places you’ve been.`,
        linkUrl: `${SITE}/feedback`,
        linkLabel: 'See who else is asking',
      },
      to.name || '',
      to.id
    );
  } catch {}
}
