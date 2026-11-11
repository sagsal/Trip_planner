import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { askClaudeTool, ANTHROPIC_API_KEY } from '@/lib/claude';
import { searchGooglePlaces, GOOGLE_PLACES_API_KEY } from '@/lib/googlePlaces';
import { placeFields } from '@/lib/placeDetails';
import { AI_SUGGESTION, type PlaceToSave } from '@/lib/sandbox';

/**
 * "✨ Fill with AI" for a planned trip in My Travel Sandbox.
 * POST { userId, sandboxTripId, request }  → { jobId }   (runs in the background; can take ~30-60s)
 * GET  ?job=ID                             → { status: 'running' | 'done' | 'error', plan?, error? }
 *
 * 1. Claude reads the request (and the planned trip) and decides cities, days and a few Google searches.
 * 2. Candidates: places from real shared trips on the site in those cities, plus Google Places results.
 * 3. Claude picks and arranges them by day, preferring places from real trips. Only candidates can be chosen.
 * Nothing is saved here: the traveller reviews the plan and adds what they want.
 */
export const dynamic = 'force-dynamic';

type Job = { status: 'running' | 'done' | 'error'; plan?: any; error?: string; created: number; userId: string };
const g = globalThis as unknown as { __fillJobs?: Map<string, Job> };
const jobs: Map<string, Job> = g.__fillJobs || (g.__fillJobs = new Map());
const cleanup = () => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, j] of jobs) if (j.created < cutoff) jobs.delete(id);
};

const PLAN_TOOL = {
  name: 'plan_trip',
  description: 'Decide the shape of the trip and what to search for.',
  input_schema: {
    type: 'object',
    properties: {
      cities: {
        type: 'array',
        description: 'Cities in visiting order, with days in each. Day trips (e.g. Teotihuacan from Mexico City) belong to the base city.',
        items: {
          type: 'object',
          properties: { name: { type: 'string' }, country: { type: 'string' }, days: { type: 'integer' } },
          required: ['name', 'country', 'days'],
        },
      },
      searches: {
        type: 'array',
        description: 'Up to 8 Google Maps searches to find places that fit (e.g. "boutique hotel Roma Norte", "best tacos al pastor", "Teotihuacan guided tour").',
        items: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            city: { type: 'string' },
            kind: { type: 'string', enum: ['hotel', 'restaurant', 'activity'] },
          },
          required: ['query', 'city', 'kind'],
        },
      },
      summary: { type: 'string', description: 'One sentence describing the plan.' },
    },
    required: ['cities', 'searches'],
  },
};

const PICK_TOOL = {
  name: 'build_itinerary',
  description: 'Choose places from the candidates and put them on days.',
  input_schema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Candidate id, exactly as given' },
            dayNumber: { type: 'integer', description: 'Day within its city (1 = first day there). Omit for hotels.' },
            why: { type: 'string', description: 'Short reason it fits their request (max ~15 words).' },
          },
          required: ['id', 'why'],
        },
      },
      summary: { type: 'string', description: 'One or two sentences describing the plan.' },
    },
    required: ['items'],
  },
};

async function runFill(userId: string, sandboxTripId: string, request: string) {
  const trip = await prisma.sandboxTrip.findFirst({ where: { id: sandboxTripId, userId } });
  if (!trip) throw new Error('That planned trip wasn’t found.');
  const existing = await prisma.savedPlace.findMany({
    where: { userId, sandboxTripId },
    select: { kind: true, name: true, city: true, country: true },
  });

  const context =
    `Planned trip: "${trip.title}"` +
    (trip.region ? `, region ${trip.region}` : '') +
    (trip.tripType ? `, type ${trip.tripType}` : '') +
    (trip.startDate && trip.endDate ? `, dates ${trip.startDate} to ${trip.endDate}` : '') +
    (trip.notes ? `\nTrip notes: ${trip.notes.slice(0, 500)}` : '') +
    (existing.length
      ? `\nAlready saved (don't repeat): ${existing.slice(0, 60).map((p) => `${p.kind} ${p.name} (${p.city || '?'})`).join('; ')}`
      : '') +
    `\n\nWhat they want: ${request}`;

  /* 1. Shape of the trip */
  const plan = await askClaudeTool<any>({
    system:
      'You plan trips for a traveller on a trip-sharing site. Decide which cities (with days in each) and up to 8 Google Maps searches that would find hotels, restaurants and activities matching their wishes. If they gave a total number of days, the city days must add up to it.',
    messages: [{ role: 'user', content: context }],
    tool: PLAN_TOOL,
    maxTokens: 1500,
    timeoutMs: 30_000,
  });
  const cities: { name: string; country: string; days: number }[] = (plan.input?.cities || [])
    .filter((c: any) => typeof c?.name === 'string' && c.name.trim())
    .slice(0, 8)
    .map((c: any) => ({ name: c.name.trim().slice(0, 100), country: String(c.country || '').trim().slice(0, 100), days: Math.max(1, Math.min(30, Math.round(Number(c.days) || 1))) }));
  if (cities.length === 0) throw new Error(plan.error || 'The AI couldn’t work out where you’re going. Try naming the city or country.');

  /* 2. Candidates: real trips on the site first */
  const cityNames = cities.map((c) => c.name);
  const where = { city: { name: { in: cityNames }, trip: { isPublic: true, isDraft: false } } };
  const include = { city: { include: { trip: { select: { id: true, title: true, user: { select: { name: true } } } } } } };
  const [hotels, restaurants, activities] = await Promise.all([
    prisma.hotel.findMany({ where, include, take: 60 }),
    prisma.restaurant.findMany({ where, include, take: 120 }),
    prisma.activity.findMany({ where, include, take: 120 }),
  ]);

  const candidates = new Map<string, { save: PlaceToSave; brief: any }>();
  const addSite = (p: any, kind: PlaceToSave['kind']) => {
    const f = placeFields(p);
    const id = `s${candidates.size + 1}`;
    candidates.set(id, {
      save: {
        kind,
        name: p.name,
        location: p.location || null,
        city: p.city?.name || null,
        country: p.city?.country || null,
        imageUrl: f.imageUrl,
        webUrl: f.webUrl,
        stayType: p.stayType || null,
        sourceTripId: p.city?.trip?.id || null,
        sourceTripTitle: p.city?.trip?.title || null,
        sourceUserName: p.city?.trip?.user?.name || null,
        sourceRating: p.rating || null,
        sourceReview: f.review || null,
      },
      brief: { id, kind, name: p.name, city: p.city?.name, from: 'traveler', rating: p.rating || undefined, review: f.review ? f.review.slice(0, 120) : undefined },
    });
  };
  hotels.forEach((h: any) => addSite(h, 'hotel'));
  restaurants.forEach((r: any) => addSite(r, 'restaurant'));
  activities.forEach((a: any) => addSite(a, 'activity'));

  // Then Google, for anything the site doesn't cover yet
  if (GOOGLE_PLACES_API_KEY) {
    const searches = (plan.input?.searches || []).slice(0, 8);
    const kindToCat = { hotel: 'hotels', restaurant: 'restaurants', activity: 'attractions' } as const;
    const lists = await Promise.all(
      searches.map(async (s: any) => {
        const kind: 'hotel' | 'restaurant' | 'activity' = s?.kind === 'hotel' || s?.kind === 'restaurant' ? s.kind : 'activity';
        const city = cities.find((c) => c.name.toLowerCase() === String(s?.city || '').toLowerCase()) || cities[0];
        try {
          const results = await searchGooglePlaces(`${String(s.query).slice(0, 120)} ${city.name} ${city.country}`, kindToCat[kind]);
          return results.slice(0, 5).map((r) => ({ r, kind, city }));
        } catch {
          return [];
        }
      })
    );
    const seen = new Set(Array.from(candidates.values()).map((c) => c.save.name.toLowerCase()));
    for (const { r, kind, city } of lists.flat()) {
      if (seen.has(r.name.toLowerCase())) continue;
      seen.add(r.name.toLowerCase());
      const id = `g${candidates.size + 1}`;
      candidates.set(id, {
        save: {
          kind,
          name: r.name,
          location: r.address_obj?.street1 || null,
          city: city.name,
          country: city.country,
          imageUrl: r.photo_url || null,
          webUrl: r.web_url || null,
          stayType: null,
          sourceTripId: null,
          sourceTripTitle: null,
          sourceUserName: AI_SUGGESTION,
          sourceRating: null,
          sourceReview: null,
        },
        brief: { id, kind, name: r.name, city: city.name, from: 'google', type: r.category?.name },
      });
    }
  }
  if (candidates.size === 0) throw new Error('No places found for that destination yet.');

  /* 3. Pick and arrange */
  const picked = await askClaudeTool<any>({
    system:
      'Build a day-by-day plan using ONLY the candidate places (by id). Prefer places from real travelers (from: "traveler") when they fit; use Google ones to fill gaps. ' +
      'Respect the traveller’s wishes (budget, style, interests, things to avoid, day trips). One hotel per city unless they asked otherwise (no dayNumber for hotels). ' +
      'About 2-4 activities and 2-3 restaurants per day; dayNumber is the day within that city. Don’t include places they already saved.',
    messages: [
      {
        role: 'user',
        content:
          `${context}\n\nCities and days: ${JSON.stringify(cities)}\n\nCandidates:\n${JSON.stringify(Array.from(candidates.values()).map((c) => c.brief))}`,
      },
    ],
    tool: PICK_TOOL,
    maxTokens: 6000,
    timeoutMs: 90_000,
  });
  if (!picked.input) throw new Error(picked.error || 'The AI couldn’t build a plan right now.');

  const used = new Set<string>();
  const items = (picked.input.items || [])
    .filter((it: any) => candidates.has(it?.id) && !used.has(it.id) && used.add(it.id))
    .slice(0, 80)
    .map((it: any) => {
      const c = candidates.get(it.id)!;
      const city = cities.find((x) => x.name === c.save.city) || cities[0];
      const day = Math.round(Number(it.dayNumber));
      return {
        ...c.save,
        dayNumber: c.save.kind === 'hotel' ? null : day >= 1 && day <= city.days ? day : 1,
        why: typeof it.why === 'string' ? it.why.slice(0, 200) : '',
        source: c.save.sourceTripId ? 'traveler' : 'google',
      };
    });
  if (items.length === 0) throw new Error('The AI couldn’t find places that fit. Try loosening the request a little.');

  return {
    summary: (typeof picked.input.summary === 'string' && picked.input.summary) || plan.input?.summary || '',
    cities,
    items,
  };
}

export async function POST(request: NextRequest) {
  if (!ANTHROPIC_API_KEY) return NextResponse.json({ error: 'AI isn’t set up.' }, { status: 503 });
  let body: any = {};
  try { body = await request.json(); } catch {}
  const userId = typeof body.userId === 'string' ? body.userId : '';
  const sandboxTripId = typeof body.sandboxTripId === 'string' ? body.sandboxTripId : '';
  const req = typeof body.request === 'string' ? body.request.trim().slice(0, 2000) : '';
  if (!userId || !sandboxTripId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  if (req.length < 3) return NextResponse.json({ error: 'Tell the AI a little about what you want.' }, { status: 400 });

  cleanup();
  const running = Array.from(jobs.values()).filter((j) => j.userId === userId && j.status === 'running').length;
  if (running >= 2) return NextResponse.json({ error: 'Please wait for your current plan to finish.' }, { status: 429 });

  const jobId = crypto.randomUUID();
  jobs.set(jobId, { status: 'running', created: Date.now(), userId });
  runFill(userId, sandboxTripId, req)
    .then((plan) => jobs.set(jobId, { status: 'done', plan, created: Date.now(), userId }))
    .catch((e) => jobs.set(jobId, { status: 'error', error: e instanceof Error ? e.message : 'Something went wrong.', created: Date.now(), userId }));
  return NextResponse.json({ jobId });
}

export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams;
  const job = jobs.get(sp.get('job') || '');
  if (!job || job.userId !== (sp.get('userId') || '')) {
    return NextResponse.json({ status: 'error', error: 'This plan has expired. Please try again.' }, { status: 404 });
  }
  if (job.status === 'running') return NextResponse.json({ status: 'running' });
  if (job.status === 'error') return NextResponse.json({ status: 'error', error: job.error });
  return NextResponse.json({ status: 'done', plan: job.plan });
}
