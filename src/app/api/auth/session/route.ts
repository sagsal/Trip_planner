import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sessionUserId } from '@/lib/session';

/** GET → { user } for the signed-in person (from the session cookie), or { user: null } */
// Never cached anywhere: the answer is different for every visitor
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie' };

export async function GET(request: NextRequest) {
  const uid = sessionUserId(request);
  if (!uid) return NextResponse.json({ user: null }, { headers: NO_STORE });
  const user = await prisma.user.findUnique({ where: { id: uid }, select: { id: true, name: true, email: true } });
  return NextResponse.json({ user: user || null }, { headers: NO_STORE });
}
