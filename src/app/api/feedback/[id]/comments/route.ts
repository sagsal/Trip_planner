import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { LIMITS, REACTIONS, Target, cleanSuggestion, needsPlace } from '@/lib/feedback';

/**
 * POST /api/feedback/ID/comments { targetType, targetKey?, reaction, text?, suggestion? }
 * Members only, within daily limits.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json().catch(() => ({}));
  const auth = requireUser(request, body.userId);
  if ('error' in auth) return auth.error;
  const { id } = await params;

  const trip = await prisma.sandboxTrip.findUnique({ where: { id }, select: { id: true, userId: true, feedbackOpen: true } });
  if (!trip || !trip.feedbackOpen) return NextResponse.json({ error: 'This trip isn’t open for feedback.' }, { status: 404 });

  const targetType = (['trip', 'city', 'place'] as const).includes(body.targetType) ? (body.targetType as Target) : null;
  if (!targetType) return NextResponse.json({ error: 'What is the comment about?' }, { status: 400 });
  const reaction = typeof body.reaction === 'string' && REACTIONS[targetType].some((r) => r.key === body.reaction) ? body.reaction : null;
  if (!reaction) return NextResponse.json({ error: 'Pick a reaction.' }, { status: 400 });

  let targetKey: string | null = null;
  let targetLabel: string | null = null;
  if (targetType === 'place') {
    const place = await prisma.savedPlace.findFirst({ where: { id: String(body.targetKey || ''), sandboxTripId: id }, select: { id: true, name: true } });
    if (!place) return NextResponse.json({ error: 'That place isn’t in this trip any more.' }, { status: 400 });
    targetKey = place.id;
    targetLabel = place.name;
  } else if (targetType === 'city') {
    targetKey = typeof body.targetKey === 'string' ? body.targetKey.trim().slice(0, 100) : '';
    if (!targetKey) return NextResponse.json({ error: 'Which city?' }, { status: 400 });
    targetLabel = targetKey;
  }

  const text = typeof body.text === 'string' ? body.text.trim().slice(0, LIMITS.textMax) : '';
  const suggestion = needsPlace(targetType, reaction) ? cleanSuggestion(body.suggestion) : null;
  if (needsPlace(targetType, reaction) && !suggestion) return NextResponse.json({ error: 'Choose the place you’d suggest.' }, { status: 400 });
  if (reaction === 'note' && !text) return NextResponse.json({ error: 'Write your comment.' }, { status: 400 });

  // Daily limits
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const [today, todayHere] = await Promise.all([
    prisma.tripComment.count({ where: { userId: auth.userId, createdAt: { gte: since } } }),
    prisma.tripComment.count({ where: { userId: auth.userId, sandboxTripId: id, createdAt: { gte: since } } }),
  ]);
  if (today >= LIMITS.commentsPerDay || todayHere >= LIMITS.commentsPerTripPerDay) {
    return NextResponse.json({ error: 'You’ve reached today’s limit for comments. Thanks for all the help — try again tomorrow.' }, { status: 429 });
  }

  const c = await prisma.tripComment.create({
    data: {
      sandboxTripId: id,
      userId: auth.userId,
      targetType,
      targetKey,
      targetLabel,
      reaction,
      text: text || null,
      suggestion: suggestion ? JSON.stringify(suggestion) : null,
    },
  });
  return NextResponse.json({ ok: true, id: c.id });
}
