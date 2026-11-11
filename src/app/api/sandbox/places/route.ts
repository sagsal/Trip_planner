import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cleanPlace } from '@/lib/sandbox';

/**
 * POST /api/sandbox/places { userId, sandboxTripId (or null = Unsorted), places: [...] }
 * Saves one or many places (a single place, a whole day or a whole city).
 * Skips places already saved to the same planned trip (same kind, name and city).
 */
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: any = {};
  try { body = await request.json(); } catch {}
  const userId = typeof body.userId === 'string' ? body.userId : '';
  const user = userId ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true } }) : null;
  if (!user) return NextResponse.json({ error: 'Please sign in to save places.' }, { status: 401 });

  let sandboxTripId: string | null = typeof body.sandboxTripId === 'string' && body.sandboxTripId ? body.sandboxTripId : null;
  if (sandboxTripId) {
    const t = await prisma.sandboxTrip.findFirst({ where: { id: sandboxTripId, userId }, select: { id: true } });
    if (!t) sandboxTripId = null;
  }

  const incoming = (Array.isArray(body.places) ? body.places : [body.place]).map(cleanPlace).filter(Boolean).slice(0, 200) as any[];
  if (incoming.length === 0) return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 });

  const total = await prisma.savedPlace.count({ where: { userId } });
  if (total + incoming.length > 3000) return NextResponse.json({ error: 'Your sandbox is full (3,000 places). Remove some first.' }, { status: 400 });

  const existing = await prisma.savedPlace.findMany({
    where: { userId, sandboxTripId },
    select: { kind: true, name: true, city: true },
  });
  const key = (p: { kind: string; name: string; city?: string | null }) => `${p.kind}|${p.name.toLowerCase()}|${(p.city || '').toLowerCase()}`;
  const seen = new Set(existing.map(key));
  const toCreate = incoming.filter((p) => {
    const k = key(p);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  if (toCreate.length) {
    await prisma.savedPlace.createMany({ data: toCreate.map((p) => ({ ...p, userId, sandboxTripId })) });
  }
  const count = await prisma.savedPlace.count({ where: { userId } });
  return NextResponse.json({ saved: toCreate.length, alreadyThere: incoming.length - toCreate.length, count });
}
