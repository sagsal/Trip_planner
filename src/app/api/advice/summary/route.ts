import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sessionUserId } from '@/lib/session';
import { countriesBeen, openRequests, matchCountries, norm } from '@/lib/advice';

export const dynamic = 'force-dynamic';

/**
 * GET /api/advice/summary[?country=Belize] (members only)
 * → newAdvice: unread advice on my planned trips
 *   wanted:    requests in countries I've been to ("your tips are wanted")
 *   latest:    the newest requests from other members
 *   inCountry: requests about ?country=
 */
export async function GET(request: NextRequest) {
  const userId = sessionUserId(request);
  const headers = { 'Cache-Control': 'no-store', Vary: 'Cookie' };
  if (!userId) return NextResponse.json({ signedIn: false }, { headers });

  const country = new URL(request.url).searchParams.get('country');
  const [newAdvice, been, requests] = await Promise.all([
    prisma.tripComment.count({ where: { sandboxTrip: { userId }, NOT: { userId }, status: 'open', user: { blockedAt: null } } }),
    countriesBeen(userId),
    openRequests({ notUserId: userId, take: 100 }),
  ]);
  const card = (r: (typeof requests)[number], matched: string[] = []) => ({
    id: r.id, title: r.title, ask: r.ask, countries: r.countries, cities: r.cities.slice(0, 5), commentCount: r.commentCount, matched,
  });
  const wanted = requests.map((r) => ({ r, m: matchCountries(r, been) })).filter((x) => x.m.length > 0).map((x) => card(x.r, x.m));
  const inCountry = country ? requests.filter((r) => r.countries.some((c) => norm(c) === norm(country))).map((r) => card(r)) : [];

  return NextResponse.json(
    {
      signedIn: true,
      newAdvice,
      wanted: wanted.slice(0, 5),
      wantedCount: wanted.length,
      latest: requests.slice(0, 3).map((r) => card(r, matchCountries(r, been))),
      openCount: requests.length,
      inCountry: inCountry.slice(0, 3),
      inCountryCount: inCountry.length,
    },
    { headers }
  );
}
