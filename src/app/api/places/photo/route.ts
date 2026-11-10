import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_PLACES_API_KEY } from '@/lib/googlePlaces';

/**
 * Shows one Google photo for a place the user added to a trip.
 *   /api/places/photo?place=PLACE_ID&name=places/PLACE_ID/photos/PHOTO_ID
 *
 * The key stays on the server. Each photo shown is billed by Google
 * (Place Details Photos, 1,000 free a month), so browsers are told to keep
 * the image for a day to avoid paying again on every page view.
 * If the stored photo name has expired, a fresh one is looked up from the place id.
 */

const PLACE_ID = /^[A-Za-z0-9_-]{10,300}$/;
const PHOTO_NAME = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

async function photoUri(name: string): Promise<string | null> {
  const res = await fetch(
    `https://places.googleapis.com/v1/${name}/media?maxWidthPx=800&skipHttpRedirect=true`,
    { headers: { 'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY } }
  );
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.photoUri || null;
}

async function freshPhotoName(placeId: string): Promise<string | null> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: { 'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY, 'X-Goog-FieldMask': 'photos' },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.photos?.[0]?.name || null;
}

export async function GET(request: NextRequest) {
  if (!GOOGLE_PLACES_API_KEY) {
    return new NextResponse('Photos unavailable', { status: 404 });
  }
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || '';
  const place = searchParams.get('place') || '';

  try {
    let uri = PHOTO_NAME.test(name) ? await photoUri(name) : null;
    if (!uri && PLACE_ID.test(place)) {
      const fresh = await freshPhotoName(place);
      if (fresh) uri = await photoUri(fresh);
    }
    if (!uri) return new NextResponse('Photo not found', { status: 404 });

    return NextResponse.redirect(uri, {
      status: 302,
      headers: { 'Cache-Control': 'private, max-age=86400' },
    });
  } catch (error) {
    console.error('Place photo error:', error instanceof Error ? error.message : error);
    return new NextResponse('Photo not available', { status: 502 });
  }
}
