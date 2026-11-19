import { prisma } from '@/lib/prisma';

/* Optional author credit (off by default) and the "Founding contributor" mark (first 50 members to share a trip) */

export const FOUNDING_LIMIT = 50;

let cache: { at: number; ranks: Map<string, number> } | null = null;

/** Members in the order they first shared a public trip; the first 50 are founding contributors */
export async function foundingRanks(): Promise<Map<string, number>> {
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) return cache.ranks;
  const firsts = await prisma.trip.groupBy({
    by: ['userId'],
    where: { isPublic: true, isDraft: false, NOT: [{ title: { contains: 'TEMPLATE' } }, { title: { contains: 'DATABASE:' } }] },
    _min: { createdAt: true },
  });
  const order = firsts
    .filter((f) => f._min.createdAt)
    .sort((a, b) => a._min.createdAt!.getTime() - b._min.createdAt!.getTime())
    .slice(0, FOUNDING_LIMIT);
  const ranks = new Map(order.map((f, i) => [f.userId, i + 1]));
  cache = { at: Date.now(), ranks };
  return ranks;
}

/** Clean what a member typed: a short display name, and an https link only */
export function cleanCredit(body: any) {
  const name = typeof body?.creditName === 'string' ? body.creditName.replace(/\s+/g, ' ').trim().slice(0, 40) : '';
  let url = typeof body?.creditUrl === 'string' ? body.creditUrl.trim().slice(0, 300) : '';
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const u = new URL(url);
    url = u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : '';
  } catch {
    url = '';
  }
  return { showName: body?.showName === true, creditName: name || null, creditUrl: url || null };
}

/** What a trip page shows about its author: nothing, unless they turned credit on */
export async function creditFor(userId: string) {
  const [u, ranks] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { showName: true, creditName: true, creditUrl: true, name: true } }),
    foundingRanks(),
  ]);
  if (!u?.showName) return null;
  return {
    name: u.creditName || (u.name || '').trim().split(/\s+/)[0] || 'A member',
    url: u.creditUrl || null,
    founding: ranks.get(userId) || null,
  };
}
