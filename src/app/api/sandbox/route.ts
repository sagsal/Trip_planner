import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cleanTripFields } from '@/lib/sandbox';

/**
 * My Travel Sandbox
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
  const userId = await userExists(sp.get('userId'));
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  if (sp.get('countOnly')) {
    const count = await prisma.savedPlace.count({ where: { userId } });
    return NextResponse.json({ count });
  }
  const [trips, places] = await Promise.all([
    prisma.sandboxTrip.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.savedPlace.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 3000 }),
  ]);
  return NextResponse.json({ trips, places });
}

export async function POST(request: NextRequest) {
  let body: any = {};
  try { body = await request.json(); } catch {}
  const userId = await userExists(body.userId);
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  const count = await prisma.sandboxTrip.count({ where: { userId } });
  if (count >= 200) return NextResponse.json({ error: 'You have a lot of planned trips! Remove one first.' }, { status: 400 });

  const fields = cleanTripFields({ title: body.title ?? '', ...body });
  const trip = await prisma.sandboxTrip.create({
    data: { userId, title: fields.title || 'My next trip', region: fields.region ?? null, tripType: fields.tripType ?? null, startDate: fields.startDate ?? null, endDate: fields.endDate ?? null, notes: fields.notes ?? null },
  });
  return NextResponse.json({ trip });
}
