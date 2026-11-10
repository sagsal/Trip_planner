import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_PLACES_API_KEY } from '@/lib/googlePlaces';

/**
 * Cover photo choices for a trip: a few Google photos of a city.
 *   /api/places/cover-photos?query=Mexico City, Mexico
 * Returns photo links (served by /api/places/photo). Only called when the
 * person clicks "Choose a cover photo", so photos are only billed then.
 */
export async function GET(request: NextRequest) {
  if (!GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ photos: [], error: 'Google photos are not set up' });
  }
  const query = (new URL(request.url).searchParams.get('query') || '').trim().slice(0, 200);
  if (!query) return NextResponse.json({ photos: [] });

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.photos',
      },
      // The city itself plus its best-known sights give a good mix of pictures
      body: JSON.stringify({ textQuery: `top sights in ${query}`, languageCode: 'en', pageSize: 6 }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('Cover photos search failed:', res.status, data?.error?.message);
      return NextResponse.json({ photos: [], error: 'Could not load photos' });
    }

    // One photo per place, up to 6 choices
    const photos: { thumb: string; full: string }[] = [];
    for (const p of data.places || []) {
      const name = p.photos?.[0]?.name;
      if (!name) continue;
      const base = `/api/places/photo?place=${encodeURIComponent(p.id)}&name=${encodeURIComponent(name)}`;
      photos.push({ thumb: `${base}&w=400`, full: `${base}&w=1600` });
      if (photos.length >= 6) break;
    }
    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Cover photos error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ photos: [], error: 'Could not load photos' });
  }
}
