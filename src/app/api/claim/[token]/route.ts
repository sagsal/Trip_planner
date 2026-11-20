import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

/**
 * A trip the site owner typed up for someone:
 *   GET  → a short preview (title, cities, days, places), no personal data
 *   POST → signed in: the trip becomes the member's own draft import to check and publish (once only)
 */
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' };
const ok = (t: string) => /^[A-Za-z0-9_-]{16,64}$/.test(t);

function preview(data: string) {
  try {
    const t = JSON.parse(data);
    const cities = Array.isArray(t?.cities) ? t.cities : [];
    const places = cities.reduce((n: number, c: any) =>
      n + (c?.hotels?.length || 0) + (Array.isArray(c?.days) ? c.days.reduce((m: number, d: any) => m + (d?.restaurants?.length || 0) + (d?.activities?.length || 0), 0) : 0), 0);
    return {
      title: String(t?.title || 'Your trip').slice(0, 200),
      cities: cities.map((c: any) => ({ name: String(c?.name || ''), country: String(c?.country || ''), days: Number(c?.numberOfDays) || 1 })).filter((c: any) => c.name).slice(0, 12),
      places,
    };
  } catch {
    return { title: 'Your trip', cities: [], places: 0 };
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = ok(token) ? await prisma.claimDraft.findUnique({ where: { token } }) : null;
  if (!d) return NextResponse.json({ error: 'This link isn’t valid.' }, { status: 404, headers: NO_STORE });
  return NextResponse.json({ ...preview(d.data), claimed: !!d.claimedAt }, { headers: NO_STORE });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const auth = requireUser(request);
  if ('error' in auth) return auth.error;
  const { token } = await params;
  const d = ok(token) ? await prisma.claimDraft.findUnique({ where: { token } }) : null;
  if (!d) return NextResponse.json({ error: 'This link isn’t valid.' }, { status: 404, headers: NO_STORE });
  if (d.claimedAt && d.claimedById !== auth.userId) return NextResponse.json({ error: 'This trip has already been claimed.' }, { status: 410, headers: NO_STORE });

  // Claim it once (a second click by the same member just opens a fresh copy to check)
  const won = d.claimedAt
    ? 1
    : (await prisma.claimDraft.updateMany({ where: { id: d.id, claimedAt: null }, data: { claimedAt: new Date(), claimedById: auth.userId } })).count;
  if (!won) return NextResponse.json({ error: 'This trip has already been claimed.' }, { status: 410, headers: NO_STORE });
  const p = await prisma.pendingImport.create({ data: { userId: auth.userId, data: d.data } });
  return NextResponse.json({ pendingId: p.id }, { headers: NO_STORE });
}
