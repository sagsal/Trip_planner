
/**
 * AI trip import (shared by the import page and email-to-draft): sends the text of an uploaded spreadsheet / document to
 * Claude (Anthropic API) and returns the trip in the same shape the
 * "Add your trip" form imports (see src/lib/tripImport.ts → ImportedTrip).
 *
 * The key is read only from the server environment (ANTHROPIC_API_KEY in
 * .env.local on the server). Never put the key in this file: the repo is public.
 * Model: Claude Haiku 5.5 (cheapest; built for extraction).
 */


import { ALL_COUNTRIES } from '@/lib/profile';

export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const MODEL = process.env.ANTHROPIC_IMPORT_MODEL || 'claude-haiku-5-5';
const MAX_CHARS = 150_000; // ~40k tokens; keeps each import cheap and under Haiku's lower price tier

const place = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Name of the hotel, restaurant or activity' },
    location: { type: 'string', description: 'Address or area, if given; otherwise empty' },
    rating: { type: 'number', description: '1-5 if the traveller gave a rating (convert other scales); 0 if none' },
    review: { type: 'string', description: "The traveller's own notes/review about this place, if any; otherwise empty" },
  },
  required: ['name'],
};

const TRIP_TOOL = {
  name: 'save_trip',
  description: 'Save the trip extracted from the traveller’s notes.',
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Trip title; if none is given, make a short one like "Week in Mexico City"' },
      startDate: { type: 'string', description: 'First day of the trip as YYYY-MM-DD, or empty if unknown' },
      endDate: { type: 'string', description: 'Last day of the trip as YYYY-MM-DD, or empty if unknown' },
      cities: {
        type: 'array',
        description: 'Cities in the order visited',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'A city or town (never left empty). If the notes name only a country or region, work out the town from the places; see the rules.' },
            country: { type: 'string', description: 'Country name in English (infer from the city if not written)' },
            numberOfDays: { type: 'integer', description: 'Days spent in this city (at least 1)' },
            hotels: { type: 'array', items: place, description: 'Places stayed (hotels, Airbnbs, hostels...)' },
            days: {
              type: 'array',
              description: 'Day 1 is the first day in THIS city. Only include days that have places.',
              items: {
                type: 'object',
                properties: {
                  dayNumber: { type: 'integer' },
                  restaurants: { type: 'array', items: place, description: 'Restaurants, cafés, bars, food spots' },
                  activities: { type: 'array', items: place, description: 'Sights, tours, museums, outings, anything else' },
                },
                required: ['dayNumber'],
              },
            },
          },
          required: ['name', 'numberOfDays'],
        },
      },
      warnings: {
        type: 'array',
        items: { type: 'string' },
        description: 'Short notes for the traveller about anything unclear or guessed (e.g. "No day given for Pujol — put on Day 1").',
      },
    },
    required: ['title', 'cities'],
  },
};

const SYSTEM = `You turn a traveller's trip notes into structured data for a trip-sharing website.
The notes may be a spreadsheet (tab-separated rows, possibly several sheets), a Word document, or pasted text, in any layout.
Rules:
- Use only what the notes say. Never invent places, addresses, ratings or reviews. Infer only the obvious: a city's country, whether a place is a hotel/restaurant/activity, which day it belongs to from context.
- Every trip needs at least one city. Notes often name only the country ("Mexico, 10 days") or a region, not the cities. Then work out the cities:
  1. Look for town or city names anywhere: headings, addresses, hotel names, "in Tulum", "drove to Oaxaca".
  2. For a well-known place, use the town it is in (Chichen Itza → Pisté/Valladolid area: use Valladolid; Palenque ruins → Palenque; Pujol → Mexico City). This counts as an obvious inference, not an invention.
  3. Places in different towns go under different cities, in the order visited.
  4. Only if nothing at all points to a town: put everything under one city named after the country's area the notes describe, or the country itself (name "Mexico", country "Mexico"), and add a warning: "No city was named, so places are under Mexico. Change it to the right city."
  Never return an empty list of cities when the notes describe a trip.
- Put each place in exactly one city. Hotels belong to the city stay, not to a day, so never warn about a hotel's day.
- If a restaurant's or activity's day isn't clear, use Day 1 for that city and add a warning.
- Only add warnings that help the traveller check something; don't report routine conversions like rating scales.
- numberOfDays per city: from dates or the highest day mentioned; at least 1.
- Dates: output YYYY-MM-DD. If a date like 03/04/2026 is ambiguous, prefer the reading that fits the other dates, and add a warning.
- Spreadsheet dates may appear as Excel serial numbers with a YYYY-MM-DD hint next to them — use the hint.
- Ratings: convert to 1-5 (e.g. 9/10 → 5, 4.5 → 5, 3.4 → 3). 0 if none.
- Keep the traveller's review/notes text as written (trim it; don't add your own words).
- Ignore content that is not about the trip (totals, budgets, packing lists) unless it names a place they went.
Always answer by calling the save_trip tool exactly once.`;

/* ---------- make sure whatever comes back is safe and well-formed ---------- */
// Models sometimes send a nested list as a JSON string ("[{...}]") instead of a real list
function unstring(v: unknown): unknown {
  if (typeof v === 'string') {
    const t = v.trim();
    if ((t.startsWith('[') && t.endsWith(']')) || (t.startsWith('{') && t.endsWith('}'))) {
      try { return unstring(JSON.parse(t)); } catch { return v; }
    }
    return v;
  }
  if (Array.isArray(v)) return v.map(unstring);
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) out[k] = unstring(val);
    return out;
  }
  return v;
}
// Accept a few likely alternative field names
const pick = (o: any, ...keys: string[]) => { for (const k of keys) if (o?.[k] !== undefined) return o[k]; return undefined; };
const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isoDate = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.trim()) ? v.trim() : '');
const toPlace = (p: any) => (typeof p === 'string' ? { name: str(p, 200), location: '', rating: 0, review: '' } : {
  name: str(pick(p, 'name', 'title', 'place'), 200),
  location: str(p?.location, 300),
  rating: Math.max(0, Math.min(5, Math.round(Number(p?.rating) || 0))),
  review: str(p?.review, 2000),
});
const places = (arr: unknown) =>
  (Array.isArray(arr) ? arr : arr && typeof arr === 'object' ? [arr] : []).map(toPlace).filter((p: any) => p.name);

function sanitize(rawInput: any) {
  const input: any = unstring(rawInput);
  const warnings: string[] = Array.isArray(input?.warnings) ? input.warnings.map((w: unknown) => str(w, 300)).filter(Boolean) : [];
  const rawCities = pick(input, 'cities', 'destinations', 'locations');
  const cities = (Array.isArray(rawCities) ? rawCities : [])
    .map((c: any) => {
      const rawDays = pick(c, 'days', 'itinerary');
      const days = (Array.isArray(rawDays) ? rawDays : [])
        .map((d: any) => ({
          dayNumber: Math.max(1, Math.min(90, Math.round(Number(pick(d, 'dayNumber', 'day', 'day_number')) || 1))),
          restaurants: places(pick(d, 'restaurants', 'food', 'dining')),
          activities: places(pick(d, 'activities', 'sights', 'attractions')),
        }))
        .filter((d: any) => d.restaurants.length || d.activities.length);
      const maxDay = days.reduce((m: number, d: any) => Math.max(m, d.dayNumber), 1);
      return {
        name: str(pick(c, 'name', 'city'), 120),
        country: str(c?.country, 120),
        numberOfDays: Math.max(maxDay, Math.min(90, Math.max(1, Math.round(Number(c?.numberOfDays) || 1)))),
        hotels: places(pick(c, 'hotels', 'hotel', 'accommodation', 'stays')),
        days,
      };
    })
    .filter((c: any) => c.name)
    .slice(0, 50);
  const rowCount = cities.reduce(
    (n: number, c: any) => n + c.hotels.length + c.days.reduce((m: number, d: any) => m + d.restaurants.length + d.activities.length, 0),
    0
  );
  return {
    title: str(input?.title, 200),
    startDate: isoDate(input?.startDate),
    endDate: isoDate(input?.endDate),
    cities,
    warnings,
    rowCount,
  };
}

/** Country names written in the notes (e.g. "Mexico"), so the AI can be told where to look for cities */
export function countriesIn(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const c of ALL_COUNTRIES) {
    const k = c.toLowerCase();
    const i = lower.indexOf(k);
    if (i >= 0 && !/[a-z]/.test(lower[i - 1] || '') && !/[a-z]/.test(lower[i + k.length] || '')) found.push(c);
    if (found.length >= 6) break;
  }
  return found;
}

export async function runImport(text: string, fileName: string, hint = ''): Promise<{ status: 'done' | 'error'; trip?: any; error?: string }> {
  const truncated = text.length > MAX_CHARS;
  if (truncated) text = text.slice(0, MAX_CHARS);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5 * 60_000); // up to 5 minutes for big files
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 32000,
        system: SYSTEM,
        tools: [TRIP_TOOL],
        messages: [
          {
            role: 'user',
            content: `File: ${fileName || 'pasted text'}\n\n<trip_notes>\n${text}\n</trip_notes>${hint ? `\n\n${hint}` : ''}`,
          },
        ],
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || `HTTP ${res.status}`;
      console.error('AI import failed:', res.status, data?.error?.type, msg);
      const friendly =
        res.status === 401 ? 'The AI key isn’t valid. Please check the ANTHROPIC_API_KEY secret.'
        : res.status === 429 ? 'The AI service is busy or the spending limit was reached. Please try again later.'
        : /credit|billing|balance/i.test(msg) ? 'Your Anthropic account is out of credit.'
        : 'The AI couldn’t read this file right now.';
      return { status: 'error', error: friendly };
    }

    const toolUse = (data.content || []).find((b: any) => b?.type === 'tool_use' && b?.name === 'save_trip');
    let raw: any = toolUse?.input;
    if (!raw) {
      // Fallback: a JSON object written as text
      const textOut = (data.content || []).filter((b: any) => b?.type === 'text').map((b: any) => b.text).join('');
      const m = textOut.match(/\{[\s\S]*\}/);
      try { raw = m ? JSON.parse(m[0]) : null; } catch { raw = null; }
    }
    if (!raw) {
      return { status: 'error', error: 'The AI couldn’t find a trip in this file.' };
    }

    const trip = sanitize(raw);
    if (truncated) trip.warnings.unshift('The file was very long, so only the first part was read.');
    if (data.stop_reason === 'max_tokens') trip.warnings.unshift('The trip was very long; some places at the end may be missing.');
    if (trip.cities.length === 0) {
      const u = unstring(raw) as any;
      console.error(
        `AI import no cities: stop=${data.stop_reason} out=${data.usage?.output_tokens} in=${data.usage?.input_tokens} ` +
        `viaTool=${!!toolUse} keys=${Object.keys(u || {}).join('|')} citiesType=${Array.isArray(u?.cities) ? 'array' + u.cities.length : typeof u?.cities} chars=${text.length}`
      );
      if (data.stop_reason === 'max_tokens') {
        return { status: 'error', error: 'The file has more places than the AI can read in one go. Try splitting it into one file per city.' };
      }
      const countries = countriesIn(text);
      if (!hint) {
        // Second try, pointing the AI at the country the notes name
        const where = countries.length ? `The notes are about a trip in ${countries.join(', ')}.` : 'The notes may name only a country or region.';
        const retry = await runImport(text, fileName, `${where} The cities list came back empty last time. Work out the town or city for each place (rules 1–4 above) and return at least one city.`);
        if (retry.status === 'done') return retry;
      }
      return {
        status: 'error',
        error: countries.length
          ? `We could see this trip was in ${countries.join(', ')}, but couldn’t tell which cities. Add the town names (for example “${countries[0] === 'Mexico' ? 'Mexico City' : 'Town name'}: …”) and try again.`
          : 'The AI couldn’t find any cities in this file. Add the town names and try again.',
      };
    }

    console.log('AI import ok:', fileName, 'cities:', trip.cities.length, 'places:', trip.rowCount, 'usage:', JSON.stringify(data.usage || {}));
    return { status: 'done', trip };
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    console.error('AI import error:', error instanceof Error ? error.message : error);
    return { status: 'error', error: aborted ? 'The AI took too long. Please try a smaller file.' : 'The AI couldn’t read this file right now.' };
  }
}
