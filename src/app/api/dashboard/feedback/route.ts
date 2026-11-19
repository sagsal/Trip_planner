import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { reactionLabel, firstName } from '@/lib/feedback';

export const dynamic = 'force-dynamic';

/** GET /api/dashboard/feedback → the newest open feedback other members left on the signed-in member's planned trips */
export async function GET(request: NextRequest) {
  const auth = requireUser(request, new URL(request.url).searchParams.get('userId'));
  if ('error' in auth) return auth.error;

  const where = { sandboxTrip: { userId: auth.userId }, NOT: { userId: auth.userId }, status: 'open', user: { blockedAt: null } };
  const [open, rows] = await Promise.all([
    prisma.tripComment.count({ where }),
    prisma.tripComment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, targetType: true, targetLabel: true, reaction: true, text: true, suggestion: true, createdAt: true,
        user: { select: { name: true } },
        sandboxTrip: { select: { id: true, title: true } },
      },
    }),
  ]);

  return NextResponse.json(
    {
      open,
      items: rows.map((c) => {
        let suggested: string | null = null;
        try { suggested = c.suggestion ? JSON.parse(c.suggestion)?.name || null : null; } catch {}
        return {
          id: c.id,
          from: firstName(c.user?.name),
          label: reactionLabel(c.targetType as any, c.reaction),
          about: c.targetType === 'trip' ? null : c.targetLabel,
          text: c.text,
          suggested,
          tripId: c.sandboxTrip.id,
          tripTitle: c.sandboxTrip.title,
          createdAt: c.createdAt,
        };
      }),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
