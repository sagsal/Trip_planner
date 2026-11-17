import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { cleanTripFields } from '@/lib/sandbox';

/**
 * PATCH  /api/sandbox/trips/ID { userId, title?, region?, tripType?, startDate?, endDate?, notes? }
 * DELETE /api/sandbox/trips/ID?userId=…[&withPlaces=1]  (otherwise its places move to Unsorted)
 */
export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: any = {};
  try { body = await request.json(); } catch {}
  const auth = requireUser(request, body.userId);
  if ('error' in auth) return auth.error;
  const result = await prisma.sandboxTrip.updateMany({ where: { id, userId: auth.userId }, data: cleanTripFields(body) });
  if (result.count === 0) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const trip = await prisma.sandboxTrip.findUnique({ where: { id } });
  return NextResponse.json({ trip });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sp = new URL(request.url).searchParams;
  const auth = requireUser(request, sp.get('userId'));
  if ('error' in auth) return auth.error;
  const userId = auth.userId;
  const trip = await prisma.sandboxTrip.findFirst({ where: { id, userId }, select: { id: true } });
  if (!trip) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  if (sp.get('withPlaces')) {
    await prisma.savedPlace.deleteMany({ where: { sandboxTripId: id, userId } });
  } else {
    await prisma.savedPlace.updateMany({ where: { sandboxTripId: id, userId }, data: { sandboxTripId: null, dayNumber: null } });
  }
  await prisma.sandboxTrip.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
