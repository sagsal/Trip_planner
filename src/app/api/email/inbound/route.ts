import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runImport, ANTHROPIC_API_KEY } from '@/lib/importAi';
import { sendEmail } from '@/lib/email';

/**
 * Mail sent to hello@tripshare.org arrives at Resend, which calls this webhook (event "email.received").
 * We check the webhook is genuinely from Resend, fetch the message, and forward it to the owner's
 * private address (ADMIN_EMAILS). Hitting "Reply" in Gmail answers the original sender.
 */
export const dynamic = 'force-dynamic';

const owner = () => (process.env.ADMIN_EMAILS || '').split(/[,\s]+/).filter(Boolean)[0];
const FROM = 'Share and Plan inbox <hello@tripshare.org>';

function verify(raw: string, h: Headers): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const id = h.get('svix-id'), ts = h.get('svix-timestamp'), sigs = h.get('svix-signature');
  if (!secret || !id || !ts || !sigs) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false; // replayed or stale
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = crypto.createHmac('sha256', key).update(`${id}.${ts}.${raw}`).digest();
  return sigs.split(' ').some((part) => {
    const sig = Buffer.from(part.split(',')[1] || '', 'base64');
    return sig.length === expected.length && crypto.timingSafeEqual(sig, expected);
  });
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const list = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : v ? [String(v)] : []);

export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verify(raw, request.headers)) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });

  let event: any;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Bad body' }, { status: 400 }); }
  if (event?.type !== 'email.received') return NextResponse.json({ ok: true, ignored: true });

  const key = process.env.RESEND_API_KEY, to = owner(), emailId = event?.data?.email_id;
  if (!key || !to || !emailId) return NextResponse.json({ ok: false }, { status: 200 });

  // Only mail addressed to our own domain (never loop on our own forwards)
  const rcpts = list(event?.data?.to).join(' ').toLowerCase();
  if (!rcpts.includes('@tripshare.org')) return NextResponse.json({ ok: true, ignored: true });

  const r = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!r.ok) {
    console.error('inbound: could not fetch received email', r.status);
    return NextResponse.json({ ok: false }, { status: 502 }); // Resend retries later
  }
  const m: any = await r.json();
  const sender = String(m.from || event?.data?.from || '');
  if (/hello@tripshare\.org/i.test(sender)) return NextResponse.json({ ok: true, ignored: true });

  // trips@tripshare.org: a member emails an itinerary → it becomes a draft trip for them to check
  if (/trips@tripshare\.org/i.test(list(m.to).join(' ') + ' ' + list(event?.data?.to).join(' '))) {
    const addr = (sender.match(/<([^>]+)>/)?.[1] || sender).trim().toLowerCase();
    const member = addr ? await prisma.user.findUnique({ where: { email: addr }, select: { id: true, name: true, email: true, blockedAt: true } }) : null;
    if (member && !member.blockedAt && ANTHROPIC_API_KEY) {
      const body = `Subject: ${m.subject || ''}\n\n${m.text || String(m.html || '').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+\n/g, '\n')}`;
      emailToDraft(member, body); // runs in the background; Resend shouldn't wait (or it retries)
      return NextResponse.json({ ok: true, draft: true });
    }
    // Not a member (or AI not set up): falls through and is forwarded to the owner like any other mail
  }

  const subject = String(m.subject || '(no subject)');
  const header = `From: ${sender}\nTo: ${list(m.to).join(', ')}\n${m.created_at ? `Date: ${m.created_at}\n` : ''}`;
  const text = `${header}\n${m.text || '(This message has no plain-text version - see the HTML version.)'}`;
  const html = `<div style="font:13px/1.5 -apple-system,Segoe UI,Arial,sans-serif;color:#5B6A73;border-bottom:1px solid #ECE7DF;padding-bottom:8px;margin-bottom:12px">${esc(header).replace(/\n/g, '<br>')}</div>${m.html || `<pre style="white-space:pre-wrap;font-family:inherit">${esc(String(m.text || ''))}</pre>`}`;

  const replyTo = list(m.reply_to).length ? list(m.reply_to) : [sender];
  const send = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], reply_to: replyTo, subject: `[tripshare] ${subject}`.slice(0, 250), html, text }),
  });
  if (!send.ok) {
    console.error('inbound: forward failed', send.status);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}

const SITE = 'https://tripshare.org';
async function emailToDraft(member: { id: string; name: string; email: string }, text: string) {
  try {
    const r = await runImport(text.slice(0, 150_000), 'email');
    if (r.status === 'done' && r.trip) {
      const p = await prisma.pendingImport.create({ data: { userId: member.id, data: JSON.stringify(r.trip) } });
      const cities = (r.trip.cities || []).map((c: any) => c.name).slice(0, 4).join(', ');
      await sendEmail(member.email, {
        subject: `Your trip is ready to check${cities ? `: ${cities}` : ''}`,
        body: `Hi {name},\n\nThanks for sending your itinerary. We turned it into a draft trip${cities ? ` (${cities})` : ''}. Have a quick look, fix anything that's off, add what you'd skip, and save it.\n\nNothing is shared until you press Save.`,
        linkUrl: `${SITE}/trips/import?pending=${p.id}`,
        linkLabel: 'Check your trip',
      }, member.name, member.id);
    } else {
      await sendEmail(member.email, {
        subject: 'We couldn’t read that itinerary',
        body: `Hi {name},\n\nThanks for sending your trip. We couldn't find the places in that email${r.error ? ` (${r.error})` : ''}.\n\nYou can paste your notes straight into the site instead, and the AI will fill in the trip for you to check.`,
        linkUrl: `${SITE}/trips/import`,
        linkLabel: 'Share a trip in 5 minutes',
      }, member.name, member.id);
    }
  } catch (e) {
    console.error('email-to-draft failed:', e instanceof Error ? e.message : 'error');
  }
}
