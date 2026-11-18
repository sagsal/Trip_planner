import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { LIMITS, firstName } from '@/lib/feedback';

/**
 * GET  /api/feedback/ID → the planned trip, its places and members' comments (members only)
 * POST /api/feedback/ID { action: "open", ask? } | { action: "close" }  (the trip's owner)
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireUser(request);
  if ('error' in auth) return auth.error;
  const { id } = await params;

  const trip = await prisma.sandboxTrip.findUnique({
    where: { id },
    include: {
      places: { orderBy: [{ city: 'asc' }, { dayNumber: 'asc' }, { createdAt: 'asc' }] },
      comments: {
        orderBy: { createdAt: 'asc' },
        where: { user: { blockedAt: null } }, // comments from blocked members are hidden
        include: { user: { select: { id: true, name: true } }, agrees: { select: { userId: true } } },
      },
    },
  });
  const isOwner = !!trip && trip.userId === auth.userId;
  if (!trip || (!trip.feedbackOpen && !isOwner)) return NextResponse.json({ error: 'This trip isn’t open for feedback.' }, { status: 404 });

  return NextResponse.json({
    isOwner,
    trip: {
      id: trip.id,
      title: trip.title,
      region: trip.region,
      tripType: trip.tripType,
      startDate: trip.startDate,
      endDate: trip.endDate,
      notes: trip.notes,
      ask: trip.feedbackAsk,
      open: trip.feedbackOpen,
    },
    places: trip.places.map((p) => ({
      id: p.id, kind: p.kind, name: p.name, location: p.location, city: p.city, country: p.country,
      imageUrl: p.imageUrl, webUrl: p.webUrl, stayType: p.stayType, note: p.note, dayNumber: p.dayNumber,
    })),
    comments: trip.comments.map((c) => ({
      id: c.id,
      targetType: c.targetType,
      targetKey: c.targetKey,
      targetLabel: c.targetLabel,
      reaction: c.reaction,
      text: c.text,
      suggestion: c.suggestion ? JSON.parse(c.suggestion) : null,
      status: c.status,
      createdAt: c.createdAt,
      author: c.user.id === trip.userId ? 'Trip planner' : firstName(c.user.name),
      byOwner: c.user.id === trip.userId,
      mine: c.user.id === auth.userId,
      agrees: c.agrees.length,
      agreedByMe: c.agrees.some((a) => a.userId === auth.userId),
    })),
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json().catch(() => ({}));
  const auth = requireUser(request, body.userId);
  if ('error' in auth) return auth.error;
  const { id } = await params;

  const trip = await prisma.sandboxTrip.findFirst({ where: { id, userId: auth.userId } });
  if (!trip) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });

  if (body.action === 'open') {
    if (!trip.feedbackOpen) {
      const open = await prisma.sandboxTrip.count({ where: { userId: auth.userId, feedbackOpen: true } });
      if (open >= LIMITS.openTripsPerMember) {
        return NextResponse.json({ error: `You can ask for feedback on up to ${LIMITS.openTripsPerMember} trips at a time. Close one first.` }, { status: 429 });
      }
    }
    const ask = typeof body.ask === 'string' ? body.ask.trim().slice(0, LIMITS.textMax) : trip.feedbackAsk;
    const updated = await prisma.sandboxTrip.update({
      where: { id },
      data: { feedbackOpen: true, feedbackAsk: ask || null, feedbackOpenedAt: trip.feedbackOpen ? trip.feedbackOpenedAt : new Date() },
    });
    return NextResponse.json({ ok: true, open: updated.feedbackOpen, ask: updated.feedbackAsk });
  }
  if (body.action === 'close') {
    await prisma.sandboxTrip.update({ where: { id }, data: { feedbackOpen: false } });
    return NextResponse.json({ ok: true, open: false });
  }
  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
