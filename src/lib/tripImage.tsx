import { ImageResponse } from 'next/og';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { daysFromDates, monthYear } from '@/lib/dates';

/**
 * Picture of a shared trip in the journal style, for link previews and Pinterest:
 *   /og/trip/<id>            → 1200×630 link-preview card (WhatsApp, Facebook, iMessage, X)
 *   /og/trip/<id>?f=pin      → 1000×1500 Pinterest pin
 * Only public, published trips. Outside /api/ so social sites may fetch it (robots.txt blocks /api/).
 * Fonts: IBM Plex Serif and Mono (SIL Open Font License, see src/assets/fonts/OFL.txt).
 */

const PAPER = '#F8F6F1', INK = '#13212B', QUIET = '#5B6A73', RULE = '#E2DDD5', TEAL = '#1F6F78';

let fonts: { serif: Buffer; mono: Buffer } | null = null;
function loadFonts() {
  if (!fonts) {
    const dir = path.join(process.cwd(), 'src', 'assets', 'fonts');
    fonts = { serif: fs.readFileSync(path.join(dir, 'IBMPlexSerif-Regular.ttf')), mono: fs.readFileSync(path.join(dir, 'IBMPlexMono-Regular.ttf')) };
  }
  return fonts;
}

function list(json: unknown): string[] {
  try {
    let v: any = typeof json === 'string' ? JSON.parse(json) : json;
    if (typeof v === 'string') v = JSON.parse(v);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

/** The cover photo as a data URL (fetched from this server for our own photo links), or null */
async function photo(url: string | null | undefined, width: number): Promise<string | null> {
  if (!url) return null;
  let u = url;
  if (u.includes('/api/places/photo') && !/[?&]w=/.test(u)) u += `${u.includes('?') ? '&' : '?'}w=${width}`;
  if (u.startsWith('/')) u = `http://127.0.0.1:${process.env.PORT || 3000}${u}`;
  if (!/^https?:\/\//.test(u)) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(u, { signal: ctrl.signal }).finally(() => clearTimeout(t));
    const type = r.headers.get('content-type') || '';
    if (!r.ok || !/^image\/(jpeg|png|webp|gif)/.test(type)) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 6_000_000) return null;
    return `data:${type.split(';')[0]};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

const CACHE_DIR = path.join(os.tmpdir(), 'tripshare-og');
const HEADERS = { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400, s-maxage=86400' };

/**
 * The trip's picture as a PNG response. Each picture is drawn once per version of the trip and kept on disk,
 * so Pinterest and link previews (which give up after a few seconds) get it at once.
 */
export async function tripImageResponse(id: string, pin: boolean): Promise<Response> {
  if (!/^[A-Za-z0-9_-]{5,64}$/.test(id || '')) return new Response('Not found', { status: 404 });
  const stamp = await prisma.trip.findUnique({ where: { id }, select: { updatedAt: true, isPublic: true, isDraft: true } }).catch(() => null);
  if (!stamp || !stamp.isPublic || stamp.isDraft) return new Response('Not found', { status: 404 });
  const file = path.join(CACHE_DIR, `${id}-${pin ? 'pin' : 'card'}-${stamp.updatedAt.getTime()}.png`);
  try {
    const buf = await fs.promises.readFile(file);
    return new Response(new Uint8Array(buf), { headers: HEADERS });
  } catch {}
  const drawn = await drawTripImage(id, pin);
  if (drawn.status !== 200) return drawn;
  const buf = Buffer.from(await drawn.arrayBuffer());
  try {
    await fs.promises.mkdir(CACHE_DIR, { recursive: true });
    await fs.promises.writeFile(file, buf);
  } catch {}
  return new Response(new Uint8Array(buf), { headers: HEADERS });
}

async function drawTripImage(id: string, pin: boolean): Promise<Response> {

  const t = await prisma.trip.findUnique({
    where: { id },
    select: {
      title: true, isPublic: true, isDraft: true, coverImageUrl: true, countries: true, tripType: true, startDate: true, endDate: true,
      user: { select: { blockedAt: true } },
      cities_data: { select: { name: true, numberOfDays: true }, orderBy: { createdAt: 'asc' } },
    },
  }).catch(() => null);
  if (!t || !t.isPublic || t.isDraft || t.user?.blockedAt) return new Response('Not found', { status: 404 });

  const cities = t.cities_data || [];
  const days = daysFromDates(t.startDate, t.endDate) || cities.reduce((n, c) => n + (c.numberOfDays || 0), 0);
  const country = list(t.countries).join(' · ');
  const kind = [days ? `${days}-day` : '', (t.tripType || '').toLowerCase(), 'itinerary'].filter(Boolean).join(' ').toUpperCase();
  const route = cities.length < 2 ? '' : cities.map((c) => c.name).slice(0, 5).join(' → ').toUpperCase();
  const when = (monthYear(t.startDate) || '').toUpperCase();
  const title = t.title.length > 90 ? `${t.title.slice(0, 88)}…` : t.title;
  const img = await photo(t.coverImageUrl, pin ? 1000 : 700);
  const { serif, mono } = loadFonts();
  const fontList = [
    { name: 'Serif', data: serif, weight: 400 as const, style: 'normal' as const },
    { name: 'Mono', data: mono, weight: 400 as const, style: 'normal' as const },
  ];
  
  const photoBox = (w: number, h: number) =>
    img ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={img} width={w} height={h} style={{ width: w, height: h, objectFit: 'cover' }} />
    ) : (
      <div style={{ width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E9E4DA', color: QUIET, fontFamily: 'Mono', fontSize: 28, letterSpacing: 4 }}>
        {(country || 'A REAL TRIP').toUpperCase()}
      </div>
    );

  if (pin) {
    const size = title.length > 50 ? 64 : title.length > 28 ? 76 : 92;
    return new ImageResponse(
      (
        <div style={{ width: 1000, height: 1500, display: 'flex', flexDirection: 'column', background: PAPER, color: INK }}>
          <div style={{ display: 'flex', borderBottom: `2px solid ${INK}` }}>{photoBox(1000, 860)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, padding: '48px 64px 44px' }}>
            <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 26, letterSpacing: 4, color: TEAL }}>{kind}</div>
            <div style={{ display: 'flex', fontFamily: 'Serif', fontSize: size, lineHeight: 1.08, marginTop: 18 }}>{title}</div>
            {route && <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 24, letterSpacing: 2, color: QUIET, marginTop: 24 }}>{route}</div>}
            <div style={{ display: 'flex', flexGrow: 1 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${RULE}`, paddingTop: 24, fontFamily: 'Mono', fontSize: 24, letterSpacing: 3 }}>
              <span style={{ color: QUIET }}>STAYS, FOOD & WHAT TO SKIP</span>
              <span style={{ color: INK }}>TRIPSHARE.ORG</span>
            </div>
          </div>
        </div>
      ),
      { width: 1000, height: 1500, fonts: fontList }
    );
  }

  const size = title.length > 60 ? 46 : title.length > 34 ? 56 : 68;
  const facts = [when, days ? `${days} DAYS` : '', (t.tripType || '').toUpperCase(), country.toUpperCase()].filter(Boolean).join(' · ');
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: 'flex', background: PAPER, color: INK }}>
        <div style={{ display: 'flex', borderRight: `2px solid ${INK}` }}>{photoBox(560, 630)}</div>
        <div style={{ display: 'flex', flexDirection: 'column', width: 640, padding: '48px 52px 40px' }}>
          <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 20, letterSpacing: 4, color: TEAL }}>{`A REAL TRIP · ${kind}`}</div>
          <div style={{ display: 'flex', fontFamily: 'Serif', fontSize: size, lineHeight: 1.1, marginTop: 20 }}>{title}</div>
          {facts && <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 19, letterSpacing: 2, color: QUIET, marginTop: 22, borderTop: `1px solid ${RULE}`, paddingTop: 16 }}>{facts}</div>}
          {route && <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 19, letterSpacing: 2, color: QUIET, marginTop: 10 }}>{route}</div>}
          <div style={{ display: 'flex', flexGrow: 1 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Mono', fontSize: 19, letterSpacing: 3 }}>
            <span style={{ color: QUIET }}>DAY BY DAY</span>
            <span>TRIPSHARE.ORG</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: fontList }
  );
}
