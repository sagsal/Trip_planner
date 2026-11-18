import crypto from 'crypto';

/**
 * Sending the owner's emails through Resend (RESEND_API_KEY, a server setting from a GitHub secret).
 * Every email carries an unsubscribe link; replies go to the owner.
 */

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tripshare.org').replace(/\/$/, '');
export const EMAIL_FROM = process.env.EMAIL_FROM || 'Share and Plan <hello@tripshare.org>';
export const emailConfigured = () => !!process.env.RESEND_API_KEY;
const replyTo = () => (process.env.ADMIN_EMAILS || '').split(/[,\s]+/).filter(Boolean)[0];

/** Unsubscribe links are signed, so nobody can unsubscribe someone else */
export function unsubscribeToken(userId: string): string {
  return crypto.createHmac('sha256', process.env.SESSION_SECRET || 'x').update(`unsub:${userId}`).digest('base64url').slice(0, 32);
}
export const unsubscribeUrl = (userId: string) => `${SITE}/api/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubscribeToken(userId)}`;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export interface Message {
  subject: string;
  body: string; // plain text; blank lines make paragraphs
  linkUrl?: string | null;
  linkLabel?: string | null;
}

/** The email itself (HTML + plain text), personalised with the first name */
export function renderEmail(m: Message, name: string, userId: string) {
  const first = (name || '').trim().split(/\s+/)[0] || 'there';
  const body = m.body.replace(/\{name\}/g, first);
  const paras = body.split(/\n{2,}/).map((p) => `<p style="margin:0 0 16px;line-height:1.6">${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  const button = m.linkUrl
    ? `<p style="margin:24px 0"><a href="${esc(m.linkUrl)}" style="background:#1F6F78;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;display:inline-block">${esc(m.linkLabel || 'Visit Share and Plan')}</a></p>`
    : '';
  const unsub = unsubscribeUrl(userId);
  const html = `<!doctype html><html><body style="margin:0;background:#FBFAF7;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#13212B">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
<p style="margin:0 0 24px;font-weight:800;font-size:18px">✈ Share and Plan</p>
<div style="background:#ffffff;border:1px solid #ECE7DF;border-radius:16px;padding:24px;font-size:16px">${paras}${button}</div>
<p style="margin:20px 4px 0;font-size:12px;line-height:1.5;color:#5B6A73">You’re getting this because you have an account on <a href="${SITE}" style="color:#5B6A73">tripshare.org</a>. <a href="${esc(unsub)}" style="color:#5B6A73">Unsubscribe</a></p>
</div></body></html>`;
  const text = `${body}\n\n${m.linkUrl ? `${m.linkLabel || 'Visit Share and Plan'}: ${m.linkUrl}\n\n` : ''}—\nYou’re getting this because you have an account on tripshare.org.\nUnsubscribe: ${unsub}\n`;
  return { html, text, unsub };
}

export async function sendEmail(to: string, m: Message, name: string, userId: string): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: 'Email isn’t set up yet (RESEND_API_KEY missing).' };
  const { html, text, unsub } = renderEmail(m, name, userId);
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        reply_to: replyTo() || undefined,
        subject: m.subject,
        html,
        text,
        headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) {
      const d: any = await r.json().catch(() => ({}));
      return { ok: false, error: (d?.message || d?.name || `HTTP ${r.status}`).toString().slice(0, 200) };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Send failed' };
  }
}
