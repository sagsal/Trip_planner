import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { askClaudeTool, ANTHROPIC_API_KEY, type ClaudeMessage } from '@/lib/claude';
import { REGIONS, TRIP_TYPES, regionOf } from '@/lib/regions';
import { placeFields } from '@/lib/placeDetails';
import type { PlaceToSave } from '@/lib/sandbox';

/**
 * "Find me a trip" assistant.
 * POST { messages: [{role, content}], asked: number }
 *  → { action: 'ask', question, options, multi }   a follow-up question (at most 3 in total)
 *  → { action: 'results', results, note, filters }  real trips from the site, best first, each with a reason
 * The AI only ranks trips that exist on the site; it never invents trips.
 */
export const dynamic = 'force-dynamic';

const NEXT_STEP_TOOL = {
  name: 'next_step',
  description: 'Either ask one short follow-up question, or say what to search for.',
  input_schema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['ask', 'search', 'collect'],
        description: '"collect" when they ask to create a sandbox / planned trip and add places from trips (e.g. "create a Mexico sandbox and add places from family trips to Mexico"). Otherwise "search" (or "ask").',
      },
      sandboxTitle: { type: 'string', description: 'For collect: a short name for the planned trip, e.g. "Mexico – family ideas".' },
      kinds: {
        type: 'array',
        items: { type: 'string', enum: ['hotel', 'restaurant', 'activity'] },
        description: 'For collect: only these kinds of places, if they said so (e.g. "just restaurants"). Empty = all.',
      },
      cities: {
        type: 'array',
        items: { type: 'string' },
        description: 'For collect: only places in these cities, if they named any (e.g. "just Cartagena and Medellín" → ["Cartagena", "Medellín"]). Empty = all cities. A neighbourhood is NOT a city: put it in areas and its city here.',
      },
      areas: {
        type: 'array',
        items: { type: 'string' },
        description: 'For collect: neighbourhoods/areas they named, e.g. "hotels in Polanco" → ["Polanco"] (and cities ["Mexico City"], countries ["Mexico"]). Empty = anywhere.',
      },
      question: { type: 'string', description: 'When asking: one short, friendly question.' },
      options: { type: 'array', items: { type: 'string' }, description: 'When asking: 3-6 short tap-to-answer choices.' },
      multi: { type: 'boolean', description: 'When asking: true if several choices can be picked.' },
      filters: {
        type: 'object',
        description: 'When searching.',
        properties: {
          countries: { type: 'array', items: { type: 'string' }, description: 'Country names in English' },
          region: { type: 'string', description: `One of: ${REGIONS.join(', ')}` },
          tripTypes: { type: 'array', items: { type: 'string' }, description: `Any of: ${TRIP_TYPES.map((t) => t.value).join(', ')}` },
          minDays: { type: 'integer' },
          maxDays: { type: 'integer' },
          interests: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string', description: 'Very short title for what they want, e.g. "Japan with teens, 2 weeks, food & culture"' },
        },
      },
    },
    required: ['action'],
  },
};

const RANK_TOOL = {
  name: 'rank_trips',
  description: 'Pick and order the trips that best match what the traveller wants.',
  input_schema: {
    type: 'object',
    properties: {
      matches: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            tripId: { type: 'string' },
            reason: { type: 'string', description: 'One sentence on why it fits, mentioning specific cities/places from the trip.' },
            exact: { type: 'boolean', description: 'true if it matches the destination; false for a close alternative.' },
          },
          required: ['tripId', 'reason'],
        },
      },
      note: { type: 'string', description: 'One short sentence if there are no or few exact matches (e.g. what the alternatives are).' },
    },
    required: ['matches'],
  },
};

const FAMILY = ['Family', 'Family with young kids', 'Family with teens', 'Multi-generational'];

function parseList(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  let body: any = {};
  try { body = await request.json(); } catch {}
  const messages: ClaudeMessage[] = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m: any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-12)
    .map((m: any) => ({ role: m.role, content: m.content.slice(0, 1000) }));
  if (!messages.length || messages[0].role !== 'user') {
    return NextResponse.json({ error: 'Tell me where you’d like to go.' }, { status: 400 });
  }
  if (!ANTHROPIC_API_KEY) return NextResponse.json({ error: 'The trip assistant isn’t set up.' }, { status: 503 });
  const asked = Math.max(0, Number(body.asked) || 0);

  /* 1. Ask a follow-up, or decide what to search for */
  const step = await askClaudeTool<any>({
    system:
      `You help a traveller find trips on a trip-sharing website, where people share real itineraries (cities, hotels, restaurants, activities, day by day). ` +
      `Ask at most ${Math.max(0, 3 - asked)} more short follow-up question(s), only if the answer would really change which trips fit (e.g. kids' ages, trip length, interests). ` +
      (asked >= 3 ? 'Do NOT ask anything more: search now. ' : 'If you already know enough, search now. ') +
      'Questions must offer tap-to-answer options. Be warm and brief. ' +
      'If they ask to create a sandbox or planned trip from trips, use action "collect" (you may still ask one question first if the destination is unclear). ' +
      'Neighbourhoods (e.g. Polanco, Roma Norte, Getsemaní) belong to a city: search that city/country and put the neighbourhood in areas.',
    messages,
    tool: NEXT_STEP_TOOL,
    maxTokens: 1200,
    timeoutMs: 25_000,
  });
  if (!step.input) return NextResponse.json({ error: step.error || 'Something went wrong.' }, { status: 502 });

  const collect =
    step.input.action === 'collect'
      ? {
          title: (typeof step.input.sandboxTitle === 'string' && step.input.sandboxTitle.trim()) || (step.input.filters?.summary as string) || 'My next trip',
          kinds: (Array.isArray(step.input.kinds) ? step.input.kinds : []).filter((k: any) => ['hotel', 'restaurant', 'activity'].includes(k)),
          cities: (Array.isArray(step.input.cities) ? step.input.cities : [])
            .filter((c: any) => typeof c === 'string' && c.trim())
            .map((c: string) => c.trim().slice(0, 80))
            .slice(0, 20),
          areas: (Array.isArray(step.input.areas) ? step.input.areas : [])
            .filter((c: any) => typeof c === 'string' && c.trim())
            .map((c: string) => c.trim().slice(0, 80))
            .slice(0, 10),
        }
      : null;

  if (step.input.action === 'ask' && asked < 3 && typeof step.input.question === 'string') {
    const options = (Array.isArray(step.input.options) ? step.input.options : []).filter((o: any) => typeof o === 'string').slice(0, 6);
    return NextResponse.json({ action: 'ask', question: step.input.question.slice(0, 300), options, multi: !!step.input.multi });
  }

  /* 2. Find candidate trips on the site */
  const f = step.input.filters || {};
  const wantCountries: string[] = (Array.isArray(f.countries) ? f.countries : []).map((c: any) => String(c).toLowerCase());
  const wantRegion: string = typeof f.region === 'string' ? f.region : wantCountries.length ? regionOf(wantCountries[0]) : '';
  const wantTypes: string[] = Array.isArray(f.tripTypes) ? f.tripTypes.map(String) : [];
  const wantFamily = wantTypes.some((t) => FAMILY.includes(t));
  const minDays = Number(f.minDays) || 0;
  const maxDays = Number(f.maxDays) || 0;

  const trips = await prisma.trip.findMany({
    where: { isPublic: true, isDraft: false },
    orderBy: { createdAt: 'desc' },
    take: 400,
    include: {
      user: { select: { name: true } },
      cities_data: { include: { hotels: true, restaurants: true, activities: true } },
    },
  });

  const scored = trips.map((t) => {
    const countries = parseList(t.countries).map((c) => c.toLowerCase());
    const days = t.cities_data.reduce((n, c) => n + (c.numberOfDays || 0), 0);
    let score = 0;
    if (wantCountries.some((c) => countries.includes(c))) score += 6;
    if (wantRegion && (t.region === wantRegion || countries.some((c) => regionOf(c) === wantRegion))) score += 2;
    if (t.tripType && wantTypes.includes(t.tripType)) score += 3;
    else if (t.tripType && wantFamily && FAMILY.includes(t.tripType)) score += 2;
    if (days && minDays && days >= minDays) score += 0.5;
    if (days && maxDays && days <= maxDays) score += 0.5;
    return { t, score, days };
  });
  const candidates = scored.sort((a, b) => b.score - a.score).slice(0, 40);
  if (candidates.length === 0) {
    return NextResponse.json({ action: 'results', results: [], note: 'There are no shared trips yet — be the first to add one!', filters: f });
  }

  // Short summaries for the AI to rank
  const summaries = candidates.map(({ t, days }) => {
    const places = t.cities_data.flatMap((c) => [
      ...c.hotels.map((h) => `stay: ${h.name}`),
      ...c.activities.map((a) => `do: ${a.name}`),
      ...c.restaurants.map((r) => `eat: ${r.name}`),
    ]);
    const reviews = t.cities_data
      .flatMap((c) => [...c.activities, ...c.restaurants, ...c.hotels])
      .map((p) => placeFields(p).review)
      .filter(Boolean)
      .slice(0, 3)
      .map((r) => r.slice(0, 100));
    return {
      id: t.id,
      title: t.title,
      type: t.tripType || '',
      countries: parseList(t.countries),
      cities: t.cities_data.map((c) => `${c.name} (${c.numberOfDays || 1}d)`),
      days,
      places: places.slice(0, 15),
      reviews,
    };
  });

  /* 3. Let the AI pick and explain the best matches (only from this list) */
  const ranked = await askClaudeTool<any>({
    system:
      'Rank real trips for a traveller. Use ONLY trips from the list (by id). Put trips to the requested destination first (exact: true); ' +
      'then, if there are few, add close alternatives (same region, similar style; exact: false). Leave out trips that do not fit at all. ' +
      'If they named a neighbourhood (e.g. Polanco), a trip to that city counts as exact — places are filtered by address later, so do not say none were found. ' +
      'Give each a one-sentence reason that mentions specific cities or places from that trip. At most 8.',
    messages: [
      {
        role: 'user',
        content:
          `What they want: ${f.summary || ''}\nFilters: ${JSON.stringify({ countries: f.countries, region: wantRegion, tripTypes: wantTypes, minDays, maxDays, interests: f.interests })}\n` +
          `Conversation:\n${messages.map((m) => `${m.role}: ${m.content}`).join('\n')}\n\nTrips:\n${JSON.stringify(summaries)}`,
      },
    ],
    tool: RANK_TOOL,
    maxTokens: 2500,
    timeoutMs: 40_000,
  });

  const byId = new Map<string, { t: any; score: number; days: number }>(candidates.map((c: any) => [c.t.id, c]));
  const matches = (ranked.input?.matches || []).filter((m: any) => byId.has(m?.tripId)).slice(0, 8);
  const results = matches.map((m: any) => {
    const { t, days } = byId.get(m.tripId)!;
    const places: PlaceToSave[] = t.cities_data.flatMap((c) => {
      const mk = (p: any, kind: PlaceToSave['kind']): PlaceToSave => {
        const pf = placeFields(p);
        return {
          kind,
          name: p.name,
          location: p.location || null,
          city: c.name,
          country: c.country,
          imageUrl: pf.imageUrl,
          webUrl: pf.webUrl,
          stayType: p.stayType || null,
          sourceTripId: t.id,
          sourceTripTitle: t.title,
          sourceUserName: t.user?.name || null,
          sourceRating: p.rating || null,
          sourceReview: pf.review || null,
        };
      };
      return [...c.hotels.map((h) => mk(h, 'hotel')), ...c.activities.map((a) => mk(a, 'activity')), ...c.restaurants.map((r) => mk(r, 'restaurant'))];
    });
    return {
      id: t.id,
      title: t.title,
      coverImageUrl: t.coverImageUrl,
      tripType: t.tripType,
      region: t.region,
      countries: parseList(t.countries),
      cities: t.cities_data.map((c) => c.name),
      days,
      userName: t.user?.name || '',
      reason: typeof m.reason === 'string' ? m.reason.slice(0, 300) : '',
      exact: m.exact !== false,
      places: places.slice(0, 80),
    };
  });

  return NextResponse.json({
    action: 'results',
    collect,
    results,
    note: typeof ranked.input?.note === 'string' ? ranked.input.note.slice(0, 300) : results.length ? '' : 'No shared trips match that yet.',
    filters: { ...f, region: wantRegion || f.region },
  });
}
