import { NextRequest, NextResponse } from 'next/server';

/**
 * AI trip import: sends the text of an uploaded spreadsheet / document to
 * Claude (Anthropic API) and returns the trip in the same shape the
 * "Add your trip" form imports (see src/lib/tripImport.ts → ImportedTrip).
 *
 * The key is read only from the server environment (ANTHROPIC_API_KEY in
 * .env.local on the server). Never put the key in this file: the repo is public.
 * Model: Claude Haiku 5.5 (cheapest; built for extraction).
 */

export const dynamic = 'force-dynamic';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

/*
 * Reading a big spreadsheet can take Claude more than a minute, longer than the
 * web server waits for one request. So POST starts a background job and returns
 * its id right away; the page then asks GET ?job=ID every few seconds until done.
 * Jobs live in memory (one server process) and are forgotten after 30 minutes.
 */
type Job = { status: 'running' | 'done' | 'error'; trip?: any; error?: string; created: number };
const g = globalThis as unknown as { __tripImportJobs?: Map<string, Job> };
const jobs: Map<string, Job> = g.__tripImportJobs || (g.__tripImportJobs = new Map());
function cleanupJobs() {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, job] of jobs) if (job.created < cutoff) jobs.delete(id);
}
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
            name: { type: 'string' },
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

/** GET: whether AI import is set up, or (with ?job=ID) the status of an import. */
export async function GET(request: NextRequest) {
  const id = new URL(request.url).searchParams.get('job');
  if (!id) return NextResponse.json({ available: !!ANTHROPIC_API_KEY });
  const job = jobs.get(id);
  if (!job) return NextResponse.json({ status: 'error', error: 'This import has expired. Please upload the file again.' }, { status: 404 });
  if (job.status === 'running') return NextResponse.json({ status: 'running' });
  if (job.status === 'error') return NextResponse.json({ status: 'error', error: job.error });
  return NextResponse.json({ status: 'done', trip: job.trip });
}

export async function POST(request: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI import is not set up yet.' }, { status: 503 });
  }

  let text = '';
  let fileName = '';
  try {
    const body = await request.json();
    text = typeof body?.text === 'string' ? body.text : '';
    fileName = typeof body?.fileName === 'string' ? body.fileName.slice(0, 200) : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  text = text.trim();
  if (!text) return NextResponse.json({ error: 'The file looks empty.' }, { status: 400 });

  cleanupJobs();
  const jobId = crypto.randomUUID();
  jobs.set(jobId, { status: 'running', created: Date.now() });
  // Run in the background; the page polls GET ?job=ID
  runImport(text, fileName)
    .then((result) => jobs.set(jobId, { ...result, created: Date.now() }))
    .catch((e) => jobs.set(jobId, { status: 'error', error: e instanceof Error ? e.message : 'The AI couldn’t read this file right now.', created: Date.now() }));
  return NextResponse.json({ jobId });
}

async function runImport(text: string, fileName: string): Promise<{ status: 'done' | 'error'; trip?: any; error?: string }> {
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
            content: `File: ${fileName || 'pasted text'}\n\n<trip_notes>\n${text}\n</trip_notes>`,
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
      return { status: 'error', error: 'The AI couldn’t find any cities in this file.' };
    }

    console.log('AI import ok:', fileName, 'cities:', trip.cities.length, 'places:', trip.rowCount, 'usage:', JSON.stringify(data.usage || {}));
    return { status: 'done', trip };
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    console.error('AI import error:', error instanceof Error ? error.message : error);
    return { status: 'error', error: aborted ? 'The AI took too long. Please try a smaller file.' : 'The AI couldn’t read this file right now.' };
  }
}
