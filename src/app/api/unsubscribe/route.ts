import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { unsubscribeToken } from '@/lib/email';

/** One-click unsubscribe from the owner's emails (link in every email; also works as a mail-app "Unsubscribe" button) */
export const dynamic = 'force-dynamic';

async function handle(request: NextRequest) {
  const sp = new URL(request.url).searchParams;
  const u = sp.get('u') || '';
  const t = sp.get('t') || '';
  const expected = u ? unsubscribeToken(u) : '';
  const ok = !!u && t.length === expected.length && crypto.timingSafeEqual(Buffer.from(t), Buffer.from(expected));
  if (ok) await prisma.user.updateMany({ where: { id: u }, data: { emailOptOut: true } }).catch(() => {});
  const msg = ok ? 'You’re unsubscribed. You won’t get any more of these emails.' : 'This unsubscribe link isn’t valid.';
  return new NextResponse(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe · tripshare</title></head>
<body style="margin:0;background:#FBFAF7;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#13212B">
<div style="max-width:480px;margin:80px auto;padding:24px;background:#fff;border:1px solid #ECE7DF;border-radius:16px;text-align:center">
<p style="font-weight:800;font-size:18px;margin:0 0 12px">tripshare</p><p style="margin:0 0 20px">${msg}</p>
<a href="/" style="color:#1F6F78;font-weight:600">Go to tripshare.org</a></div></body></html>`,
    { status: ok ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
  );
}
export const GET = handle;
export const POST = handle;
