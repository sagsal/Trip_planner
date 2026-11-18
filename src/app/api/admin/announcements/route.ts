import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/admin';

/**
 * Owner's site banner. GET → recent banners. POST { action: "post", title, body, linkUrl?, linkLabel? } | { action: "end", id }
 * Posting a new banner ends the previous one (one banner at a time).
 */
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'private, no-store' };

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });
  const list = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
  return NextResponse.json({ announcements: list }, { headers: NO_STORE });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });
  const b = await request.json().catch(() => ({}));
  if (b.action === 'end' && typeof b.id === 'string') {
    await prisma.announcement.updateMany({ where: { id: b.id }, data: { active: false } });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  }
  if (b.action === 'post') {
    const title = typeof b.title === 'string' ? b.title.trim().slice(0, 120) : '';
    const body = typeof b.body === 'string' ? b.body.trim().slice(0, 400) : '';
    if (!title) return NextResponse.json({ error: 'Add a headline.' }, { status: 400, headers: NO_STORE });
    const linkUrl = typeof b.linkUrl === 'string' && /^(https:\/\/|\/)/.test(b.linkUrl.trim()) ? b.linkUrl.trim().slice(0, 500) : null;
    const linkLabel = typeof b.linkLabel === 'string' ? b.linkLabel.trim().slice(0, 40) || null : null;
    await prisma.announcement.updateMany({ where: { active: true }, data: { active: false } });
    const a = await prisma.announcement.create({ data: { title, body, linkUrl, linkLabel, active: true } });
    return NextResponse.json({ ok: true, announcement: a }, { headers: NO_STORE });
  }
  return NextResponse.json({ error: 'Unknown action.' }, { status: 400, headers: NO_STORE });
}
