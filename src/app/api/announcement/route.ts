import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** The current site banner, if the owner has posted one (public) */
export const dynamic = 'force-dynamic';

export async function GET() {
  const a = await prisma.announcement.findFirst({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, body: true, linkUrl: true, linkLabel: true },
  });
  return NextResponse.json({ announcement: a || null }, { headers: { 'Cache-Control': 'no-store' } });
}
