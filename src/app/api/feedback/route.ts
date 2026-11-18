import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

/**
 * GET /api/feedback → planned trips open for advice ("Help me plan"). Members only.
 */
export async function GET(request: NextRequest) {
  const auth = requireUser(request);
  if ('error' in auth) return auth.error;

  const trips = await prisma.sandboxTrip.findMany({
    where: { feedbackOpen: true, user: { blockedAt: null } },
    orderBy: { feedbackOpenedAt: 'desc' },
    take: 100,
    select: {
      id: true, userId: true, title: true, region: true, tripType: true, startDate: true, endDate: true,
      feedbackAsk: true, feedbackOpenedAt: true,
      places: { select: { city: true, country: true, imageUrl: true }, take: 300 },
      _count: { select: { comments: true, places: true } },
    },
  });

  return NextResponse.json({
    trips: trips.map((t) => {
      const cities = Array.from(new Set(t.places.map((p) => p.city).filter(Boolean) as string[]));
      const countries = Array.from(new Set(t.places.map((p) => p.country).filter(Boolean) as string[]));
      return {
        id: t.id,
        title: t.title,
        region: t.region,
        tripType: t.tripType,
        startDate: t.startDate,
        endDate: t.endDate,
        ask: t.feedbackAsk,
        openedAt: t.feedbackOpenedAt,
        cities,
        countries,
        photo: t.places.find((p) => p.imageUrl)?.imageUrl || null,
        placeCount: t._count.places,
        commentCount: t._count.comments,
        mine: t.userId === auth.userId,
      };
    }),
  });
}
