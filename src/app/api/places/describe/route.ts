import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_PLACES_API_KEY, searchGooglePlaces } from '@/lib/googlePlaces';

/**
 * "Can't remember the name? Describe it."
 * POST { text, city, country, category } → { results: [...] } in the same shape as normal search results.
 *
 * 1. Claude (Haiku) turns the description into a search plan: what to look for and,
 *    if the place was described relative to something ("across from the Hyatt"), that landmark.
 * 2. Google finds the landmark's location, then searches for matching places close to it.
 * Without an Anthropic key it still works: the description goes straight to Google.
 */
export const dynamic = 'force-dynamic';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = process.env.ANTHROPIC_DESCRIBE_MODEL || 'claude-haiku-5-5';

type Category = 'hotels' | 'restaurants' | 'attractions';
interface Plan {
  query: string;            // what to search for, e.g. "vegetarian restaurant"
  landmark?: string | null; // e.g. "Hyatt Regency Polanco" or "Parque España"
  radiusMeters?: number;    // how close to the landmark
}

const PLAN_TOOL = {
  name: 'search_plan',
  description: 'How to search Google Maps for the place the traveller is describing.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Short Google Maps search for the place itself, with the key details (cuisine, style, features) but WITHOUT the landmark, e.g. "vegetarian restaurant", "rooftop bar", "boutique hotel".',
      },
      landmark: {
        type: ['string', 'null'],
        description:
          'A specific nearby landmark, street, park or building the traveller mentioned (e.g. "Hyatt Regency Polanco", "Parque España", "Avenida Presidente Masaryk"), or null.',
      },
      radiusMeters: {
        type: 'integer',
        description: 'How far from the landmark: "across from"/"next to" ≈ 150, "on" a street/park ≈ 300, "near" ≈ 600, "a few blocks" ≈ 800.',
      },
    },
    required: ['query'],
  },
};

async function makePlan(text: string, city: string, country: string, category?: Category): Promise<Plan | null> {
  if (!ANTHROPIC_API_KEY) return null;
  const kind = category === 'hotels' ? 'hotel' : category === 'restaurants' ? 'restaurant / café / bar' : category === 'attractions' ? 'activity or sight' : 'place';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system:
          'A traveller is trying to find a place they visited but can’t remember its name. Turn their description into a Google Maps search plan. Always answer by calling the search_plan tool once.',
        tools: [PLAN_TOOL],
        messages: [
          {
            role: 'user',
            content: `They are looking for a ${kind} in ${[city, country].filter(Boolean).join(', ') || 'an unknown city'}.\nTheir description: "${text}"`,
          },
        ],
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
    if (!res.ok) {
      console.error('Describe plan failed:', res.status);
      return null;
    }
    const data = await res.json();
    const tool = (data.content || []).find((b: any) => b?.type === 'tool_use');
    const p = tool?.input;
    if (!p || typeof p.query !== 'string' || !p.query.trim()) return null;
    return {
      query: p.query.trim().slice(0, 150),
      landmark: typeof p.landmark === 'string' && p.landmark.trim() ? p.landmark.trim().slice(0, 150) : null,
      radiusMeters: Math.max(100, Math.min(2000, Math.round(Number(p.radiusMeters) || 400))),
    };
  } catch (e) {
    console.error('Describe plan error:', e instanceof Error ? e.message : e);
    return null;
  }
}

/** Where a landmark is, via Google Text Search. */
async function locate(landmark: string, city: string, country: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.location,places.displayName',
    },
    body: JSON.stringify({ textQuery: [landmark, city, country].filter(Boolean).join(', '), pageSize: 1, languageCode: 'en' }),
  });
  if (!res.ok) return null;
  const loc = (await res.json()).places?.[0]?.location;
  return loc && typeof loc.latitude === 'number' ? { lat: loc.latitude, lng: loc.longitude } : null;
}

export async function POST(request: NextRequest) {
  if (!GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ results: [], error: 'Search isn’t set up.' }, { status: 503 });
  }
  let body: any = {};
  try { body = await request.json(); } catch {}
  const text = typeof body.text === 'string' ? body.text.trim().slice(0, 300) : '';
  const city = typeof body.city === 'string' ? body.city.trim().slice(0, 100) : '';
  const country = typeof body.country === 'string' ? body.country.trim().slice(0, 100) : '';
  const category: Category | undefined = ['hotels', 'restaurants', 'attractions'].includes(body.category) ? body.category : undefined;
  if (text.length < 3) return NextResponse.json({ results: [], error: 'Please describe the place a bit more.' }, { status: 400 });

  try {
    const plan = await makePlan(text, city, country, category);
    let results: any[] = [];
    let note = '';

    if (plan?.landmark) {
      const center = await locate(plan.landmark, city, country);
      if (center) {
        results = await searchGooglePlaces(plan.query, category, { center, radiusMeters: plan.radiusMeters || 400 });
        note = `Near ${plan.landmark}`;
      }
    }
    if (results.length === 0 && plan) {
      results = await searchGooglePlaces([plan.query, plan.landmark, city, country].filter(Boolean).join(', '), category);
    }
    if (results.length === 0) {
      // No AI, or nothing found: let Google read the description as written
      results = await searchGooglePlaces([text, city, country].filter(Boolean).join(', '), category);
    }

    // Show a small photo with each suggestion to help the traveller recognise the place.
    // (Each photo shown is billed by Google, so only up to 6 suggestions here.)
    const withPhotos = results.slice(0, 6).map((r: any) => ({
      ...r,
      photos: r.photo_url ? [{ images: { medium: { url: `${r.photo_url}&w=300` } } }] : [],
    }));
    return NextResponse.json({ results: withPhotos, note, usedAi: !!plan });
  } catch (e) {
    console.error('Describe search error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ results: [], error: 'Couldn’t search right now. Please try again.' }, { status: 502 });
  }
}
