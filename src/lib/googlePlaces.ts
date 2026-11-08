/**
 * Google Places (New) search, returned in the same shape the site already
 * uses for TripAdvisor results, so the search box and forms need no changes.
 *
 * The key is read only from the server environment (GOOGLE_PLACES_API_KEY in
 * .env.local on the server). Never put the key in this file: the repo is public.
 *
 * Cost: only Pro-tier fields are requested (name, address, Maps link, type),
 * which Google gives 5,000 free searches a month for. Ratings and photos are
 * left out on purpose because they are billed at a higher tier.
 */

export const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.googleMapsUri',
  'places.primaryTypeDisplayName',
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
  photos: [];
}

export async function searchGooglePlaces(
  query: string,
  category?: 'hotels' | 'restaurants' | 'attractions'
): Promise<PlaceResultInTripAdvisorShape[]> {
  if (!GOOGLE_PLACES_API_KEY) throw new Error('GOOGLE_PLACES_API_KEY is not set');

  const body: Record<string, unknown> = {
    textQuery: query,
    languageCode: 'en',
    pageSize: 10,
  };
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
      const msg = data?.error?.message || `HTTP ${res.status}`;
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
      photos: [],
    }));
  } finally {
    clearTimeout(timeout);
  }
}
