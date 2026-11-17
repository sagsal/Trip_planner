import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/admin';

/**
 * GET /api/admin/stats?days=30 → site numbers for the owner's dashboard.
 * Owner only (anyone else gets "Not found"). Totals and breakdowns only: no names or emails.
 * Breakdowns of members (country, age…) hide groups smaller than 5 as "fewer than 5".
 */
export const dynamic = 'force-dynamic';
const SMALL = 5;
const NO_STORE = { 'Cache-Control': 'private, no-store' };

function parseList(json: unknown): string[] {
  try {
    let v: any = typeof json === 'string' ? JSON.parse(json) : json;
    if (typeof v === 'string') v = JSON.parse(v);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

const tally = (values: (string | null | undefined)[], blank = 'Not given') => {
  const m = new Map<string, number>();
  for (const v of values) m.set(v || blank, (m.get(v || blank) || 0) + 1);
  return Array.from(m.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
};

/** People breakdowns: merge groups under 5 into one "fewer than 5 each" row */
const protectSmall = (rows: { label: string; count: number }[]) => {
  const big = rows.filter((r) => r.count >= SMALL);
  const small = rows.filter((r) => r.count < SMALL);
  const total = small.reduce((n, r) => n + r.count, 0);
  return { rows: big, hidden: small.length ? { groups: small.length, people: total } : null };
};

/** Counts per week for the last N weeks (oldest first) */
function weekly(dates: Date[], weeks = 12) {
  const now = Date.now();
  const out = Array.from({ length: weeks }, (_, i) => {
    const end = now - (weeks - 1 - i) * 7 * 86400000;
    return { start: new Date(end - 7 * 86400000).toISOString().slice(0, 10), count: 0 };
  });
  for (const d of dates) {
    const ago = Math.floor((now - d.getTime()) / (7 * 86400000));
    if (ago >= 0 && ago < weeks) out[weeks - 1 - ago].count++;
  }
  return out;
}

function lastBackup(): { at: string | null; ok: boolean | null } {
  try {
    const p = path.join(process.env.HOME || '/root', 'tripshare-backup.log');
    if (!fs.existsSync(p)) return { at: null, ok: null };
    const lines = fs.readFileSync(p, 'utf8').trim().split('\n').slice(-20);
    const ok = [...lines].reverse().find((l) => l.startsWith('backup uploaded') || l.startsWith('BACKUP FAILED'));
    const m = ok?.match(/tripshare-(\d{4}-\d{2}-\d{2})-(\d{2})(\d{2})/);
    return { at: m ? `${m[1]} ${m[2]}:${m[3]} UTC` : null, ok: ok ? ok.startsWith('backup uploaded') : null };
  } catch {
    return { at: null, ok: null };
  }
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });

  const days = Math.min(365, Math.max(1, Number(new URL(request.url).searchParams.get('days')) || 30));
  const since = new Date(Date.now() - days * 86400000);
  const real = { NOT: [{ email: { endsWith: '@example.invalid' } }] };

  const [users, trips, cities, sandboxTrips, savedPlaces, comments, reviewsUsage] = await Promise.all([
    prisma.user.findMany({ where: real, select: { createdAt: true, homeRegion: true, homeCountry: true, ageBracket: true } }),
    prisma.trip.findMany({
      where: { NOT: [{ title: { contains: 'TEMPLATE' } }, { title: { contains: 'DATABASE:' } }] },
      select: { createdAt: true, isPublic: true, isDraft: true, countries: true, tripType: true, region: true },
    }),
    prisma.city.findMany({ where: { trip: { isPublic: true, isDraft: false } }, select: { name: true, country: true } }),
    prisma.sandboxTrip.findMany({ select: { createdAt: true, feedbackOpen: true } }),
    prisma.savedPlace.findMany({ select: { createdAt: true, kind: true } }),
    prisma.tripComment.findMany({ select: { createdAt: true, status: true } }),
    prisma.apiUsage.findUnique({ where: { key: `google-reviews:${new Date().toISOString().slice(0, 7)}` } }).catch(() => null),
  ]);

  const published = trips.filter((t) => t.isPublic && !t.isDraft);
  const countryTally = tally(published.flatMap((t) => parseList(t.countries)));

  return NextResponse.json(
    {
      days,
      generatedAt: new Date().toISOString(),
      members: {
        total: users.length,
        new: users.filter((u) => u.createdAt >= since).length,
        weekly: weekly(users.map((u) => u.createdAt)),
        byRegion: protectSmall(tally(users.map((u) => u.homeRegion))),
        byCountry: protectSmall(tally(users.map((u) => u.homeCountry))),
        byAge: protectSmall(tally(users.map((u) => u.ageBracket), 'Prefer not to say')),
      },
      trips: {
        shared: published.length,
        drafts: trips.filter((t) => t.isDraft).length,
        private: trips.filter((t) => !t.isPublic && !t.isDraft).length,
        new: trips.filter((t) => t.createdAt >= since).length,
        newShared: published.filter((t) => t.createdAt >= since).length,
        weekly: weekly(published.map((t) => t.createdAt)),
        topCountries: countryTally.slice(0, 10),
        topCities: tally(cities.map((c) => c.name)).slice(0, 10),
        types: tally(published.map((t) => t.tripType), 'No type given'),
      },
      planning: {
        sandboxTrips: sandboxTrips.length,
        newSandboxTrips: sandboxTrips.filter((t) => t.createdAt >= since).length,
        savedPlaces: savedPlaces.length,
        newSavedPlaces: savedPlaces.filter((p) => p.createdAt >= since).length,
      },
      feedback: {
        openTrips: sandboxTrips.filter((t) => t.feedbackOpen).length,
        comments: comments.length,
        newComments: comments.filter((c) => c.createdAt >= since).length,
        accepted: comments.filter((c) => c.status === 'accepted').length,
      },
      costs: {
        googleReviewsThisMonth: reviewsUsage?.count || 0,
        googleReviewsCap: Math.max(0, Number(process.env.GOOGLE_REVIEWS_MONTHLY_CAP) || 2000),
      },
      health: { backup: lastBackup() },
    },
    { headers: NO_STORE }
  );
}
