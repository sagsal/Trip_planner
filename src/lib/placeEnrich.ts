/**
 * Fill in a photo and Google Maps link for places that don't have one yet,
 * by searching Google Places for "name, address, city, country".
 * A result is only used when its name clearly matches the place's name.
 * Runs on the server when a trip is saved. Searches are Pro tier
 * (5,000 free a month); photos themselves are only fetched when viewed.
 */
import { searchGooglePlaces, GOOGLE_PLACES_API_KEY } from '@/lib/googlePlaces';
import { placeFields } from '@/lib/placeDetails';

const STOP = new Set(['the', 'a', 'an', 'de', 'la', 'le', 'el', 'and', 'y', 'et', '&', 'hotel', 'restaurant', 'cafe', 'bar', 'museum', 'museo']);
const tokens = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));

/** True when the Google result's name is clearly the same place. */
export function namesMatch(ours: string, theirs: string): boolean {
  const a = tokens(ours);
  const b = new Set(tokens(theirs));
  if (a.length === 0) return false; // generic names like "Hotel" are not looked up
  const hits = a.filter((t) => b.has(t)).length;
  return hits / a.length >= 0.6 || (a.length >= 3 && hits >= 2);
}

type Kind = 'hotels' | 'restaurants' | 'attractions';

export async function findPlace(
  p: { name?: string; location?: string },
  city: { name?: string; country?: string },
  kind: Kind
): Promise<{ imageUrl: string | null; webUrl: string | null } | null> {
  if (!GOOGLE_PLACES_API_KEY || !p?.name || tokens(p.name).length === 0) return null;
  const query = [p.name, p.location, city.name, city.country].filter(Boolean).join(', ').slice(0, 250);
  try {
    let results = await searchGooglePlaces(query, kind);
    if (results.length === 0 && kind === 'attractions') results = await searchGooglePlaces(query);
    const hit = results.find((r) => namesMatch(p.name!, r.name));
    if (!hit) return null;
    return { imageUrl: hit.photo_url || null, webUrl: hit.web_url || null };
  } catch {
    return null;
  }
}

/**
 * Adds imageUrl/webUrl to places in a trip's citiesData that are missing a photo.
 * Bounded so saving stays quick: at most `limit` lookups, 5 at a time, ~10 seconds total.
 */
export async function enrichCitiesData(citiesData: any[], limit = 40): Promise<void> {
  if (!GOOGLE_PLACES_API_KEY || !Array.isArray(citiesData)) return;
  const jobs: (() => Promise<void>)[] = [];
  const add = (place: any, city: any, kind: Kind) => {
    if (!place || typeof place !== 'object') return;
    const f = placeFields(place);
    if (f.imageUrl) return;
    jobs.push(async () => {
      const found = await findPlace(place, city, kind);
      if (found) {
        if (found.imageUrl) place.imageUrl = found.imageUrl;
        if (found.webUrl && !f.webUrl) place.webUrl = found.webUrl;
      }
    });
  };
  for (const city of citiesData) {
    for (const h of city?.hotels || []) add(h, city, 'hotels');
    for (const r of city?.restaurants || []) add(r, city, 'restaurants');
    for (const a of city?.activities || []) add(a, city, 'attractions');
    for (const d of city?.days || []) {
      for (const r of d?.restaurants || []) add(r, city, 'restaurants');
      for (const a of d?.activities || []) add(a, city, 'attractions');
    }
  }
  const queue = jobs.slice(0, limit);
  const deadline = Date.now() + 10_000;
  const worker = async () => {
    while (queue.length && Date.now() < deadline) await queue.shift()!();
  };
  await Promise.all(Array.from({ length: 5 }, worker));
}
