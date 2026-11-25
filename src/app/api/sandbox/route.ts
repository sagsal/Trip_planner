import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { cleanTripFields } from '@/lib/sandbox';

/**
 * My plans
 * GET  /api/sandbox?userId=…           → { trips, places } for that user (or { count } with &countOnly=1)
 * POST /api/sandbox { userId, title, region?, tripType?, startDate?, endDate?, notes? } → new planned trip
 */
export const dynamic = 'force-dynamic';

async function userExists(userId: unknown): Promise<string | null> {
  if (typeof userId !== 'string' || !userId) return null;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  return u ? u.id : null;
}

export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams;
  const auth = requireUser(request, sp.get('userId'));
  if ('error' in auth) return auth.error;
  const userId = await userExists(auth.userId);
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  if (sp.get('countOnly')) {
    const count = await prisma.savedPlace.count({ where: { userId } });
    return NextResponse.json({ count });
  }
  const [trips, places, comments] = await Promise.all([
    prisma.sandboxTrip.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.savedPlace.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 3000 }),
    // Members' feedback on these trips, for the "💬 3 new" badges
    prisma.tripComment.findMany({
      where: { sandboxTrip: { userId }, NOT: { userId } },
      select: { sandboxTripId: true, targetType: true, targetKey: true, status: true },
      take: 5000,
    }),
  ]);
  const feedback: Record<string, { open: number; total: number; byPlace: Record<string, number> }> = {};
  for (const c of comments) {
    const f = (feedback[c.sandboxTripId] ||= { open: 0, total: 0, byPlace: {} });
    f.total++;
    if (c.status === 'open') f.open++;
    if (c.targetType === 'place' && c.targetKey) f.byPlace[c.targetKey] = (f.byPlace[c.targetKey] || 0) + 1;
  }
  return NextResponse.json({ trips, places, feedback });
}

export async function POST(request: NextRequest) {
  let body: any = {};
  try { body = await request.json(); } catch {}
  const auth = requireUser(request, body.userId);
  if ('error' in auth) return auth.error;
  const userId = await userExists(auth.userId);
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  const count = await prisma.sandboxTrip.count({ where: { userId } });
  if (count >= 200) return NextResponse.json({ error: 'You have a lot of planned trips! Remove one first.' }, { status: 400 });

  const fields = cleanTripFields({ title: body.title ?? '', ...body });
  const trip = await prisma.sandboxTrip.create({
    data: { userId, title: fields.title || 'My next trip', region: fields.region ?? null, tripType: fields.tripType ?? null, startDate: fields.startDate ?? null, endDate: fields.endDate ?? null, notes: fields.notes ?? null },
  });
  return NextResponse.json({ trip });
}
