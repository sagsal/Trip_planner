import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PATCH  /api/sandbox/places/ID { userId, note?, dayNumber?, sandboxTripId? }
 * DELETE /api/sandbox/places/ID?userId=…
 */
export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: any = {};
  try { body = await request.json(); } catch {}
  const userId = typeof body.userId === 'string' ? body.userId : '';
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  const data: Record<string, unknown> = {};
  if (body.note !== undefined) data.note = typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 4000) : null;
  if (body.dayNumber !== undefined) {
    const d = Math.round(Number(body.dayNumber));
    data.dayNumber = d >= 1 && d <= 90 ? d : null;
  }
  if (body.sandboxTripId !== undefined) {
    if (body.sandboxTripId) {
      const t = await prisma.sandboxTrip.findFirst({ where: { id: String(body.sandboxTripId), userId }, select: { id: true } });
      if (!t) return NextResponse.json({ error: 'That planned trip wasn’t found.' }, { status: 404 });
      data.sandboxTripId = t.id;
    } else {
      data.sandboxTripId = null;
    }
    data.dayNumber = null; // a different trip means a different schedule
  }
  const result = await prisma.savedPlace.updateMany({ where: { id, userId }, data });
  if (result.count === 0) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const place = await prisma.savedPlace.findUnique({ where: { id } });
  return NextResponse.json({ place });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = new URL(request.url).searchParams.get('userId') || '';
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  const result = await prisma.savedPlace.deleteMany({ where: { id, userId } });
  if (result.count === 0) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const count = await prisma.savedPlace.count({ where: { userId } });
  return NextResponse.json({ ok: true, count });
}
