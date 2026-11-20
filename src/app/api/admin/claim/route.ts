import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/admin';
import { runImport, ANTHROPIC_API_KEY } from '@/lib/importAi';

/**
 * Owner only. "Import a trip for someone":
 *   POST { text, note? } → AI reads the notes; returns a private link the owner sends to the traveller,
 *                          who opens it, checks the trip and publishes it as their own.
 *   GET                  → the last 20 links and whether each was claimed (no personal data).
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 300;
const NO_STORE = { 'Cache-Control': 'private, no-store' };
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tripshare.org').replace(/\/$/, '');

function summary(data: string) {
  try {
    const t = JSON.parse(data);
    const cities = Array.isArray(t?.cities) ? t.cities : [];
    return { title: String(t?.title || 'Untitled trip').slice(0, 200), cities: cities.map((c: any) => String(c?.name || '')).filter(Boolean).slice(0, 8) };
  } catch {
    return { title: 'Untitled trip', cities: [] as string[] };
  }
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });
  const rows = await prisma.claimDraft.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
  return NextResponse.json({
    links: rows.map((r) => ({ id: r.id, link: `${SITE}/claim/${r.token}`, note: r.note, createdAt: r.createdAt, claimedAt: r.claimedAt, ...summary(r.data) })),
  }, { headers: NO_STORE });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });
  if (!ANTHROPIC_API_KEY) return NextResponse.json({ error: 'The AI key isn’t set on the server.' }, { status: 503, headers: NO_STORE });
  let body: any = {};
  try { body = await request.json(); } catch {}
  const text = String(body?.text || '').trim();
  const note = String(body?.note || '').trim().slice(0, 200) || null;
  if (text.length < 40) return NextResponse.json({ error: 'Paste the trip notes or post first (a few lines at least).' }, { status: 400, headers: NO_STORE });

  const r = await runImport(text, 'pasted for someone');
  if (r.status !== 'done' || !r.trip) return NextResponse.json({ error: r.error || 'The AI couldn’t read that.' }, { status: 422, headers: NO_STORE });

  const token = crypto.randomBytes(18).toString('base64url');
  const data = JSON.stringify(r.trip);
  await prisma.claimDraft.create({ data: { token, data, note } });
  return NextResponse.json({ link: `${SITE}/claim/${token}`, ...summary(data), warnings: r.trip.warnings || [] }, { headers: NO_STORE });
}
