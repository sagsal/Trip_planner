import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GOOGLE_PLACES_API_KEY, searchGooglePlaces } from '@/lib/googlePlaces';
import { namesMatch } from '@/lib/placeEnrich';

/**
 * Google rating and reviews for one place on a trip, loaded when someone taps "Google reviews".
 *   GET /api/places/reviews?name=&location=&city=&country=&kind=
 *
 * Reviews are Google's top price tier (1,000 free a month, then about $25 per 1,000),
 * so lookups are capped per month (GOOGLE_REVIEWS_MONTHLY_CAP, default 2,000).
 * Past the cap the answer is { capped: true, mapsUrl }, and the page links to Google Maps instead (free).
 * Answers are kept in memory for an hour so repeat taps on the same place aren't billed again.
 */

const CAP = Math.max(0, Number(process.env.GOOGLE_REVIEWS_MONTHLY_CAP) || 2000);
const CACHE_MS = 60 * 60 * 1000;

type Answer = {
  name: string;
  rating: number | null;
  count: number | null;
  mapsUrl: string;
  reviews: { author: string; authorUrl: string | null; photo: string | null; rating: number | null; when: string; text: string }[];
};
const g = globalThis as any;
const cache: Map<string, { at: number; answer: Answer | null }> = g.__reviewsCache || (g.__reviewsCache = new Map());

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const mapsSearch = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const monthKey = () => `google-reviews:${new Date().toISOString().slice(0, 7)}`;

/** Reserve one paid lookup this month; false when the cap is reached */
async function takeOne(): Promise<boolean> {
  const key = monthKey();
  const row = await prisma.apiUsage.upsert({ where: { key }, create: { key, count: 1 }, update: { count: { increment: 1 } } });
  if (row.count > CAP) {
    await prisma.apiUsage.update({ where: { key }, data: { count: { decrement: 1 } } }).catch(() => {});
    return false;
  }
  return true;
}

export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams;
  const name = clip(sp.get('name'), 200);
  const location = clip(sp.get('location'), 200);
  const city = clip(sp.get('city'), 100);
  const country = clip(sp.get('country'), 100);
  const kindParam = sp.get('kind');
  const category = kindParam === 'hotel' ? 'hotels' : kindParam === 'restaurant' ? 'restaurants' : kindParam === 'activity' ? 'attractions' : undefined;
  if (name.length < 2) return NextResponse.json({ error: 'Missing place name.' }, { status: 400 });

  const query = [name, location, city, country].filter(Boolean).join(', ').slice(0, 250);
  const fallbackUrl = mapsSearch([name, city, country].filter(Boolean).join(' '));
  if (!GOOGLE_PLACES_API_KEY) return NextResponse.json({ unavailable: true, mapsUrl: fallbackUrl });

  const cacheKey = query.toLowerCase();
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return hit.answer ? NextResponse.json(hit.answer) : NextResponse.json({ notFound: true, mapsUrl: fallbackUrl });
  }

  try {
    // 1. Find the place (the cheaper search allowance)
    const results = await searchGooglePlaces(query, category as any);
    const place = results.find((r) => namesMatch(name, r.name));
    if (!place) {
      cache.set(cacheKey, { at: Date.now(), answer: null });
      return NextResponse.json({ notFound: true, mapsUrl: fallbackUrl });
    }
    const mapsUrl = place.web_url || fallbackUrl;

    // 2. The reviews themselves (the paid lookup), within the monthly cap
    if (!(await takeOne())) return NextResponse.json({ capped: true, mapsUrl });

    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(place.location_id)}`, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'displayName,rating,userRatingCount,googleMapsUri,reviews',
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error('Google reviews lookup failed', res.status);
      return NextResponse.json({ error: 'Couldn’t load Google reviews right now.', mapsUrl }, { status: 502 });
    }
    const d: any = await res.json().catch(() => ({}));
    const answer: Answer = {
      name: clip(d.displayName?.text, 200) || place.name,
      rating: typeof d.rating === 'number' ? d.rating : null,
      count: typeof d.userRatingCount === 'number' ? d.userRatingCount : null,
      mapsUrl: typeof d.googleMapsUri === 'string' ? d.googleMapsUri : mapsUrl,
      reviews: (Array.isArray(d.reviews) ? d.reviews : []).slice(0, 5).map((r: any) => ({
        author: clip(r.authorAttribution?.displayName, 100) || 'Google user',
        authorUrl: typeof r.authorAttribution?.uri === 'string' && r.authorAttribution.uri.startsWith('https://') ? r.authorAttribution.uri : null,
        photo: typeof r.authorAttribution?.photoUri === 'string' && r.authorAttribution.photoUri.startsWith('https://') ? r.authorAttribution.photoUri : null,
        rating: typeof r.rating === 'number' ? r.rating : null,
        when: clip(r.relativePublishTimeDescription, 60),
        text: clip(r.text?.text || r.originalText?.text, 1500),
      })),
    };
    cache.set(cacheKey, { at: Date.now(), answer });
    if (cache.size > 2000) cache.delete(cache.keys().next().value as string);
    return NextResponse.json(answer);
  } catch (e) {
    console.error('Google reviews error', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Couldn’t load Google reviews right now.', mapsUrl: fallbackUrl }, { status: 502 });
  }
}
