import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailAdviserAccepted } from '@/lib/advice';
import { requireUser } from '@/lib/session';
import { LIMITS, cleanSuggestion } from '@/lib/feedback';

/**
 * POST /api/feedback/comments/CID { action }
 *   "agree"            any member (toggles)
 *   "accept"|"dismiss"|"reopen"   the trip's owner. Accepting a "go here instead" / "you should add" /
 *                      "I'd skip it" suggestion changes the planned trip for them.
 *   "delete"           the comment's author or the trip's owner
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ cid: string }> }) {
  const body = await request.json().catch(() => ({}));
  const auth = requireUser(request, body.userId);
  if ('error' in auth) return auth.error;
  const { cid } = await params;

  const c = await prisma.tripComment.findUnique({ where: { id: cid }, include: { sandboxTrip: { select: { id: true, userId: true, feedbackOpen: true } } } });
  if (!c) return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
  const isOwner = c.sandboxTrip.userId === auth.userId;
  if (!c.sandboxTrip.feedbackOpen && !isOwner) return NextResponse.json({ error: 'This trip isn’t open for feedback.' }, { status: 404 });

  if (body.action === 'agree') {
    const existing = await prisma.tripCommentAgree.findUnique({ where: { commentId_userId: { commentId: cid, userId: auth.userId } } });
    if (existing) {
      await prisma.tripCommentAgree.delete({ where: { id: existing.id } });
    } else {
      const today = await prisma.tripCommentAgree.count({ where: { userId: auth.userId, createdAt: { gte: new Date(Date.now() - 86400000) } } });
      if (today >= LIMITS.agreesPerDay) return NextResponse.json({ error: 'That’s enough agreeing for today!' }, { status: 429 });
      await prisma.tripCommentAgree.create({ data: { commentId: cid, userId: auth.userId } });
    }
    const n = await prisma.tripCommentAgree.count({ where: { commentId: cid } });
    return NextResponse.json({ ok: true, agrees: n, agreedByMe: !existing });
  }

  if (body.action === 'delete') {
    if (!isOwner && c.userId !== auth.userId) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
    await prisma.tripComment.delete({ where: { id: cid } });
    return NextResponse.json({ ok: true });
  }

  if (!isOwner) return NextResponse.json({ error: 'Only the trip’s planner can do that.' }, { status: 403 });
  const owner = c.sandboxTrip.userId;
  const tripId = c.sandboxTrip.id;

  if (body.action === 'dismiss' || body.action === 'reopen') {
    await prisma.tripComment.update({ where: { id: cid }, data: { status: body.action === 'dismiss' ? 'dismissed' : 'open' } });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'accept') {
    let changed = '';
    const target = c.targetType === 'place' && c.targetKey
      ? await prisma.savedPlace.findFirst({ where: { id: c.targetKey, sandboxTripId: tripId, userId: owner } })
      : null;
    const s = c.suggestion ? cleanSuggestion(JSON.parse(c.suggestion)) : null;

    if ((c.reaction === 'swap' || c.reaction === 'add_place') && s) {
      await prisma.savedPlace.create({
        data: {
          userId: owner,
          sandboxTripId: tripId,
          kind: s.kind,
          name: s.name,
          location: s.location || null,
          city: s.city || target?.city || (c.targetType === 'city' ? c.targetKey : null),
          country: s.country || target?.country || null,
          imageUrl: s.imageUrl || null,
          webUrl: s.webUrl || null,
          dayNumber: target?.dayNumber ?? null,
          sourceTripTitle: 'Suggested in Help me plan',
        },
      });
      changed = c.reaction === 'swap' ? 'swapped' : 'added';
      if (c.reaction === 'swap' && target) await prisma.savedPlace.delete({ where: { id: target.id } });
    } else if (c.reaction === 'skip' && target) {
      await prisma.savedPlace.delete({ where: { id: target.id } });
      changed = 'removed';
    }
    await prisma.tripComment.update({ where: { id: cid }, data: { status: 'accepted' } });
    emailAdviserAccepted(cid); // best effort, not awaited
    return NextResponse.json({ ok: true, changed });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
