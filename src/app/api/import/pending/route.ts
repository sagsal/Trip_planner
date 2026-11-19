import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** GET /api/import/pending?id=… → a trip read from the member's own email, for them to check (only theirs) */
export async function GET(request: NextRequest) {
  const auth = requireUser(request);
  if ('error' in auth) return auth.error;
  const id = new URL(request.url).searchParams.get('id') || '';
  const p = id ? await prisma.pendingImport.findUnique({ where: { id } }) : null;
  if (!p || p.userId !== auth.userId) return NextResponse.json({ error: 'This draft wasn’t found. It may have been used already.' }, { status: 404 });
  let trip: unknown = null;
  try { trip = JSON.parse(p.data); } catch {}
  return NextResponse.json({ trip }, { headers: { 'Cache-Control': 'no-store' } });
}
