import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { cleanCredit, foundingRanks, FOUNDING_LIMIT } from '@/lib/credit';

export const dynamic = 'force-dynamic';

/** GET → my credit settings + founding rank · POST { showName, creditName, creditUrl } → save */
export async function GET(request: NextRequest) {
  const auth = requireUser(request);
  if ('error' in auth) return auth.error;
  const [u, ranks] = await Promise.all([
    prisma.user.findUnique({ where: { id: auth.userId }, select: { showName: true, creditName: true, creditUrl: true, name: true } }),
    foundingRanks(),
  ]);
  return NextResponse.json(
    { showName: !!u?.showName, creditName: u?.creditName || '', creditUrl: u?.creditUrl || '', defaultName: (u?.name || '').trim().split(/\s+/)[0] || '', founding: ranks.get(auth.userId) || null, foundingLimit: FOUNDING_LIMIT, foundingTaken: ranks.size },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request: NextRequest) {
  const auth = requireUser(request);
  if ('error' in auth) return auth.error;
  let body: any = {};
  try { body = await request.json(); } catch {}
  const c = cleanCredit(body);
  await prisma.user.update({ where: { id: auth.userId }, data: c });
  return NextResponse.json({ ok: true, ...c });
}
