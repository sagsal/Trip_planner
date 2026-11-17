import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/admin';

/** GET /api/admin/members → every account, for the site owner only (anyone else: "Not found") */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Not found' }, { status: 404, headers });

  const users = await prisma.user.findMany({
    where: { NOT: { email: { endsWith: '@example.invalid' } } }, // automatic test accounts
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, name: true, email: true, createdAt: true, homeRegion: true, homeCountry: true, ageBracket: true,
      trips: { select: { isPublic: true, isDraft: true } },
      _count: { select: { sandboxTrips: true, savedPlaces: true, tripComments: true } },
    },
  });

  return NextResponse.json(
    {
      members: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        joined: u.createdAt,
        from: [u.homeCountry, u.homeRegion].filter(Boolean).join(', ') || null,
        age: u.ageBracket,
        shared: u.trips.filter((t) => t.isPublic && !t.isDraft).length,
        drafts: u.trips.filter((t) => t.isDraft).length,
        private: u.trips.filter((t) => !t.isPublic && !t.isDraft).length,
        planned: u._count.sandboxTrips,
        saved: u._count.savedPlaces,
        comments: u._count.tripComments,
      })),
    },
    { headers }
  );
}
