import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/admin';
import { sessionUserId, setBlocked } from '@/lib/session';

/** GET /api/admin/members → every account, for the site owner only (anyone else: "Not found") */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Not found' }, { status: 404, headers });

  const users = await prisma.user.findMany({
    where: { NOT: { email: { endsWith: '@example.invalid' } } }, // automatic test accounts
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, name: true, email: true, createdAt: true, homeRegion: true, homeCountry: true, ageBracket: true, blockedAt: true,
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
        blocked: !!u.blockedAt,
        isYou: u.id === sessionUserId(request),
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

/**
 * POST /api/admin/members { id, action: "block" | "unblock" | "delete" }  (site owner only)
 *   block:   can't sign in; signed-in sessions stop; their trips and comments are hidden. Reversible.
 *   delete:  removes the account and everything it made (trips, Sandbox, comments). Not reversible.
 */
export async function POST(request: NextRequest) {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Not found' }, { status: 404, headers });
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : '';
  const me = sessionUserId(request);
  if (!id) return NextResponse.json({ error: 'Which account?' }, { status: 400, headers });
  if (id === me) return NextResponse.json({ error: 'You can’t block or delete your own account here.' }, { status: 400, headers });
  const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!target) return NextResponse.json({ error: 'Account not found.' }, { status: 404, headers });

  if (body.action === 'block' || body.action === 'unblock') {
    const on = body.action === 'block';
    await prisma.user.update({ where: { id }, data: { blockedAt: on ? new Date() : null } });
    setBlocked(id, on);
    return NextResponse.json({ ok: true, blocked: on }, { headers });
  }
  if (body.action === 'delete') {
    await prisma.user.delete({ where: { id } });
    setBlocked(id, false);
    return NextResponse.json({ ok: true, deleted: true }, { headers });
  }
  return NextResponse.json({ error: 'Unknown action.' }, { status: 400, headers });
}
