/**
 * Google Places (New) search, returned in the same shape the site already
 * uses for TripAdvisor results, so the search box and forms need no changes.
 *
 * The key is read only from the server environment (GOOGLE_PLACES_API_KEY in
 * .env.local on the server). Never put the key in this file: the repo is public.
 *
 * Cost: only Pro-tier fields are requested (name, address, Maps link, type),
 * which Google gives 5,000 free searches a month for. Ratings are left out
 * because they are billed at a higher tier. Photo *names* come with the search;
 * the image itself is only fetched (and billed) for places the user adds.
 */

export const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.googleMapsUri',
  'places.primaryTypeDisplayName',
  'places.photos', // photo names only; images are fetched later, only for places the user adds
].join(',');

const TYPE_FOR_CATEGORY: Record<string, string> = {
  hotels: 'lodging',
  restaurants: 'restaurant',
  attractions: 'tourist_attraction',
};

export interface PlaceResultInTripAdvisorShape {
  location_id: string;
  name: string;
  address_obj?: { street1?: string };
  category?: { key: string; name: string };
  web_url?: string;
  // Link to one photo, used only after the user picks this place (not in the search list)
  photo_url?: string;
  photos: [];
}

export async function searchGooglePlaces(
  query: string,
  category?: 'hotels' | 'restaurants' | 'attractions',
  near?: { center: { lat: number; lng: number }; radiusMeters: number } // only look close to a point
): Promise<PlaceResultInTripAdvisorShape[]> {
  if (!GOOGLE_PLACES_API_KEY) throw new Error('GOOGLE_PLACES_API_KEY is not set');

  const body: Record<string, unknown> = {
    textQuery: query,
    languageCode: 'en',
    pageSize: 10,
  };
  if (near) {
    // Text Search can only *restrict* to a rectangle, so use a box around the point
    const dLat = near.radiusMeters / 111_320;
    const dLng = near.radiusMeters / (111_320 * Math.max(0.2, Math.cos((near.center.lat * Math.PI) / 180)));
    body.locationRestriction = {
      rectangle: {
        low: { latitude: near.center.lat - dLat, longitude: near.center.lng - dLng },
        high: { latitude: near.center.lat + dLat, longitude: near.center.lng + dLng },
      },
    };
  }
  const includedType = category ? TYPE_FOR_CATEGORY[category] : undefined;
  if (includedType) {
    body.includedType = includedType;
    // Hotels and restaurants: only that type. Attractions: allow related types too.
    body.strictTypeFiltering = category !== 'attractions';
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const reasons = (data?.error?.details || [])
        .map((d: any) => [d?.reason, d?.metadata?.service, d?.metadata?.consumer].filter(Boolean).join(' '))
        .filter(Boolean)
        .join('; ');
      const msg = [data?.error?.message || `HTTP ${res.status}`, data?.error?.status, reasons].filter(Boolean).join(' | ');
      console.error('Google Places search failed:', res.status, msg);
      throw new Error(`Google Places: ${msg}`);
    }
    return (data.places || []).map((p: any) => ({
      location_id: String(p.id),
      name: p.displayName?.text || '',
      address_obj: p.formattedAddress ? { street1: p.formattedAddress } : undefined,
      category: p.primaryTypeDisplayName?.text
        ? { key: category || 'place', name: p.primaryTypeDisplayName.text }
        : undefined,
      web_url: p.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${p.id}`,
      photo_url: p.photos?.[0]?.name
        ? `/api/places/photo?place=${encodeURIComponent(p.id)}&name=${encodeURIComponent(p.photos[0].name)}`
        : undefined,
      photos: [], // kept empty so the search list doesn't load (and pay for) photos
    }));
  } finally {
    clearTimeout(timeout);
  }
}
