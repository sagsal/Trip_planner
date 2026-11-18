import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/admin';
import { sessionUserId } from '@/lib/session';
import { emailConfigured, sendEmail, EMAIL_FROM, type Message } from '@/lib/email';

/**
 * Owner's emails to members (owner only).
 * GET  → { configured, from, history }
 * POST { action: "count" | "test" | "send", audience, subject, body, linkUrl?, linkLabel? }
 *   audience: { joinedFrom?: "YYYY-MM-DD", joinedTo?: "YYYY-MM-DD", region?, country? }
 * Never sent to blocked members, people who unsubscribed, or test accounts. Up to 100 a send.
 */
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'private, no-store' };
const MAX_PER_SEND = 100;

function whereFor(a: any) {
  const where: any = { blockedAt: null, emailOptOut: false, NOT: { email: { endsWith: '@example.invalid' } } };
  const from = typeof a?.joinedFrom === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.joinedFrom) ? new Date(`${a.joinedFrom}T00:00:00Z`) : null;
  const to = typeof a?.joinedTo === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.joinedTo) ? new Date(`${a.joinedTo}T23:59:59Z`) : null;
  if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
  if (typeof a?.region === 'string' && a.region) where.homeRegion = a.region;
  if (typeof a?.country === 'string' && a.country) where.homeCountry = a.country;
  return where;
}

function cleanMessage(b: any): Message | null {
  const subject = typeof b?.subject === 'string' ? b.subject.trim().slice(0, 150) : '';
  const body = typeof b?.body === 'string' ? b.body.trim().slice(0, 8000) : '';
  if (!subject || !body) return null;
  const linkUrl = typeof b?.linkUrl === 'string' && /^https:\/\//.test(b.linkUrl.trim()) ? b.linkUrl.trim().slice(0, 500) : null;
  const linkLabel = typeof b?.linkLabel === 'string' ? b.linkLabel.trim().slice(0, 60) || null : null;
  return { subject, body, linkUrl, linkLabel };
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });
  const history = await prisma.emailCampaign.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
  return NextResponse.json({ configured: emailConfigured(), from: EMAIL_FROM, history }, { headers: NO_STORE });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });
  const b = await request.json().catch(() => ({}));
  const where = whereFor(b.audience);

  if (b.action === 'count') {
    const [count, unsubscribed] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { ...where, emailOptOut: true } }),
    ]);
    return NextResponse.json({ count, unsubscribed }, { headers: NO_STORE });
  }

  const m = cleanMessage(b);
  if (!m) return NextResponse.json({ error: 'Add a subject and a message.' }, { status: 400, headers: NO_STORE });

  if (b.action === 'test') {
    const me = await prisma.user.findUnique({ where: { id: sessionUserId(request)! }, select: { id: true, email: true, name: true } });
    if (!me) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });
    const r = await sendEmail(me.email, { ...m, subject: `[Test] ${m.subject}` }, me.name, me.id);
    return NextResponse.json(r.ok ? { ok: true, to: me.email } : { error: r.error }, { status: r.ok ? 200 : 502, headers: NO_STORE });
  }

  if (b.action === 'send') {
    const people = await prisma.user.findMany({ where, select: { id: true, email: true, name: true }, take: MAX_PER_SEND + 1 });
    if (people.length === 0) return NextResponse.json({ error: 'No one matches that audience.' }, { status: 400, headers: NO_STORE });
    if (people.length > MAX_PER_SEND) return NextResponse.json({ error: `That’s more than ${MAX_PER_SEND} people. Narrow the dates and send in batches.` }, { status: 400, headers: NO_STORE });
    let sent = 0, failed = 0;
    let lastError = '';
    for (const p of people) {
      const r = await sendEmail(p.email, m, p.name, p.id);
      if (r.ok) sent++; else { failed++; lastError = r.error || ''; }
      await new Promise((res) => setTimeout(res, 600)); // stay under the sending service's rate limit
    }
    await prisma.emailCampaign.create({ data: { subject: m.subject, body: m.body, audience: JSON.stringify(b.audience || {}), sentCount: sent, failed } });
    return NextResponse.json({ ok: sent > 0, sent, failed, error: failed ? lastError : undefined }, { headers: NO_STORE });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400, headers: NO_STORE });
}
