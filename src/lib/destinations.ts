import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/slug';

/* Destination pages: every shared trip, stay, restaurant and activity for one country */

export { slugify };

const parseList = (v: unknown): string[] => {
  try {
    let x: any = v;
    for (let i = 0; i < 2 && typeof x === 'string'; i++) x = JSON.parse(x);
    return Array.isArray(x) ? x.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
};

const isRealTrip = (t: { title: string }) => !t.title.includes('TEMPLATE') && !t.title.includes('DATABASE:');

/** Every public trip with just enough to list it (small site: one query, filtered here) */
export async function publicTrips() {
  const rows = await prisma.trip.findMany({
    where: { isPublic: true, isDraft: false, user: { blockedAt: null } },
    orderBy: { createdAt: 'desc' },
    take: 3000,
    select: {
      id: true, title: true, countries: true, startDate: true, endDate: true, tripType: true, coverImageUrl: true, updatedAt: true, createdAt: true,
      cities_data: { select: { name: true, country: true, numberOfDays: true, area: true, state: true } },
    },
  });
  return rows.filter(isRealTrip).map((t) => ({
    ...t,
    countryList: Array.from(new Set([...parseList(t.countries), ...t.cities_data.map((c) => c.country)].filter(Boolean))),
  }));
}
export type PublicTrip = Awaited<ReturnType<typeof publicTrips>>[number];

/** Countries that have at least one shared trip, with counts, most trips first */
export async function destinationIndex() {
  const trips = await publicTrips();
  const by = new Map<string, { country: string; slug: string; trips: number; cover: string | null; cities: Set<string> }>();
  for (const t of trips) {
    for (const c of t.countryList) {
      const slug = slugify(c);
      if (!slug) continue;
      const d = by.get(slug) || { country: c, slug, trips: 0, cover: null, cities: new Set<string>() };
      d.trips++;
      d.cover ||= t.coverImageUrl || null;
      t.cities_data.filter((x) => slugify(x.country) === slug).forEach((x) => d.cities.add(x.name));
      by.set(slug, d);
    }
  }
  return Array.from(by.values())
    .map((d) => ({ ...d, cities: Array.from(d.cities) }))
    .sort((a, b) => b.trips - a.trips || a.country.localeCompare(b.country));
}

/** One country: its trips and every place in them, grouped by city */
export async function destination(slug: string) {
  const all = await publicTrips();
  const trips = all.filter((t) => t.countryList.some((c) => slugify(c) === slug));
  if (!trips.length) return null;
  const country = trips[0].countryList.find((c) => slugify(c) === slug) || slug;
  const cities = await prisma.city.findMany({
    where: { tripId: { in: trips.map((t) => t.id) } },
    select: {
      name: true, country: true, tripId: true,
      hotels: { select: { name: true, location: true, rating: true, review: true, liked: true, imageUrl: true } },
      restaurants: { select: { name: true, location: true, rating: true, review: true, liked: true, imageUrl: true } },
      activities: { select: { name: true, location: true, rating: true, review: true, liked: true, imageUrl: true } },
    },
  });
  const title = new Map(trips.map((t) => [t.id, t.title]));
  type Place = { name: string; location: string | null; rating: number | null; review: string | null; liked: boolean | null; imageUrl: string | null; tripId: string; tripTitle: string };
  const byCity = new Map<string, { city: string; stays: Place[]; eats: Place[]; todo: Place[] }>();
  for (const c of cities.filter((c) => slugify(c.country) === slug)) {
    const k = c.name.trim();
    const g = byCity.get(k.toLowerCase()) || { city: k, stays: [], eats: [], todo: [] };
    const tag = (p: any): Place => ({ ...p, tripId: c.tripId, tripTitle: title.get(c.tripId) || '' });
    g.stays.push(...c.hotels.map(tag));
    g.eats.push(...c.restaurants.map(tag));
    g.todo.push(...c.activities.map(tag));
    byCity.set(k.toLowerCase(), g);
  }
  const rank = (a: Place, b: Place) => Number(b.liked === true) - Number(a.liked === true) || (b.rating || 0) - (a.rating || 0);
  const cityList = Array.from(byCity.values())
    .map((g) => ({ ...g, stays: g.stays.sort(rank), eats: g.eats.sort(rank), todo: g.todo.sort(rank) }))
    .sort((a, b) => b.stays.length + b.eats.length + b.todo.length - (a.stays.length + a.eats.length + a.todo.length));
  return { country, slug, trips, cities: cityList };
}
