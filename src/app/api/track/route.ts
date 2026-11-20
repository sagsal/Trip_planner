import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { channelFrom, SOURCE_COOKIE } from '@/lib/channel';

export const dynamic = 'force-dynamic';

/**
 * POST /api/track { utm, ref } → counts one visit for its channel today (one per browser session,
 * the page makes sure of that) and remembers the first channel in a cookie for 90 days.
 * Counts only: nothing about the person is stored.
 */
export async function POST(request: NextRequest) {
  let body: any = {};
  try { body = await request.json(); } catch {}
  const source = channelFrom(body?.utm, body?.ref);
  const day = new Date().toISOString().slice(0, 10);
  try {
    await prisma.channelVisit.upsert({
      where: { day_source: { day, source } },
      create: { day, source, count: 1 },
      update: { count: { increment: 1 } },
    });
  } catch (e) {
    console.error('track failed', e instanceof Error ? e.message : e);
  }
  const res = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  if (source !== 'direct' && !request.cookies.get(SOURCE_COOKIE)?.value) {
    res.cookies.set(SOURCE_COOKIE, source, { maxAge: 90 * 86400, path: '/', sameSite: 'lax', httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  }
  return res;
}
