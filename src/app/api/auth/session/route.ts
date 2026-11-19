import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sessionUserId } from '@/lib/session';
import { isAdminRequest } from '@/lib/admin';

/** GET → { user } for the signed-in person (from the session cookie), or { user: null } */
// Never cached anywhere: the answer is different for every visitor
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie' };

export async function GET(request: NextRequest) {
  const uid = sessionUserId(request);
  if (!uid) return NextResponse.json({ user: null }, { headers: NO_STORE });
  const user = await prisma.user.findUnique({ where: { id: uid }, select: { id: true, name: true, email: true, lastSeenAt: true } });
  // "Members returning each month": note the visit, at most once an hour
  if (user && (!user.lastSeenAt || Date.now() - user.lastSeenAt.getTime() > 3600_000)) {
    prisma.user.update({ where: { id: uid }, data: { lastSeenAt: new Date() } }).catch(() => {});
  }
  if (user) delete (user as { lastSeenAt?: Date | null }).lastSeenAt;
  return NextResponse.json({ user: user || null, isAdmin: user ? await isAdminRequest(request) : false }, { headers: NO_STORE });
}
