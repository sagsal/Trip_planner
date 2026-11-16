'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import SaveToSandbox from '@/components/SaveToSandbox';
import { placeFields } from '@/lib/placeDetails';
import { tripTypeIcon, regionOf } from '@/lib/regions';
import type { PlaceToSave } from '@/lib/sandbox';
import { monthYear, daysFromDates } from '@/lib/dates';

/* A trip as the list API returns it (only the fields the card uses) */
export interface CardTrip {
  id: string;
  title: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  countries?: string | null;
  coverImageUrl?: string | null;
  tripType?: string | null;
  region?: string | null;
  user?: { name?: string | null } | null;
  cities_data?: {
    id: string;
    name: string;
    country?: string | null;
    numberOfDays?: number | null;
    hotels: any[];
    restaurants: any[];
    activities: any[];
  }[];
}

export function parseList(json: unknown): string[] {
  try {
    let v: any = typeof json === 'string' ? JSON.parse(json) : json;
    if (typeof v === 'string') v = JSON.parse(v);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export function tripDays(t: CardTrip): number {
  return daysFromDates(t.startDate, t.endDate) || (t.cities_data || []).reduce((n, c) => n + (c.numberOfDays || 0), 0);
}

export function tripCounts(t: CardTrip) {
  const c = t.cities_data || [];
  return {
    stays: c.reduce((n, x) => n + x.hotels.length, 0),
    eats: c.reduce((n, x) => n + x.restaurants.length, 0),
    todo: c.reduce((n, x) => n + x.activities.length, 0),
  };
}

/** Photos of the trip's places, for the little strip on a card */
export function tripPlacePhotos(t: CardTrip, max = 8): string[] {
  const out: string[] = [];
  for (const c of t.cities_data || []) {
    for (const p of [...c.restaurants, ...c.activities, ...c.hotels]) {
      const u = placeFields(p).imageUrl;
      if (u && !out.includes(u)) out.push(u);
      if (out.length >= max) return out;
    }
  }
  return out;
}

/** Every place in a trip, ready for "Save to Sandbox" */
export function tripPlacesToSave(t: CardTrip): PlaceToSave[] {
  return (t.cities_data || []).flatMap((c) => {
    const mk = (p: any, kind: PlaceToSave['kind']): PlaceToSave => {
      const pf = placeFields(p);
      return {
        kind,
        name: p.name,
        location: p.location || null,
        city: c.name,
        country: c.country || null,
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
    return [...c.hotels.map((h) => mk(h, 'hotel')), ...c.restaurants.map((r) => mk(r, 'restaurant')), ...c.activities.map((a) => mk(a, 'activity'))];
  });
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function Counts({ t, small }: { t: CardTrip; small?: boolean }) {
  const n = tripCounts(t);
  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-1 ${small ? 'text-[13px]' : 'text-sm'} text-[#3D4C56]`}>
      <span>{plural(n.stays, 'stay', 'stays')}</span>
      <span>{plural(n.eats, 'restaurant', 'restaurants')}</span>
      <span>{plural(n.todo, 'thing to do', 'things to do')}</span>
    </div>
  );
}

function Byline({ t }: { t: CardTrip }) {
  const days = tripDays(t);
  const cities = (t.cities_data || []).length;
  const bits = [monthYear(t.startDate), days ? plural(days, 'day', 'days') : '', cities ? plural(cities, 'city', 'cities') : '', t.user?.name ? `by ${t.user.name}` : ''].filter(Boolean);
  return <p className="text-sm text-[#5B6A73]">{bits.join(' · ')}</p>;
}

function Route({ t }: { t: CardTrip }) {
  const names = (t.cities_data || []).map((c) => c.name);
  if (names.length < 2) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-[#2A3A44]">
      {names.map((n, i) => (
        <span key={`${n}-${i}`} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden className="text-[#A9B3B9] font-normal">→</span>}
          {n}
        </span>
      ))}
    </div>
  );
}

function Cover({ t, className }: { t: CardTrip; className: string }) {
  const region = t.region || regionOf(parseList(t.countries)[0] || '');
  return (
    <div className={`relative bg-[#E6DED2] ${className}`}>
      {t.coverImageUrl && (
        <img
          src={t.coverImageUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-2">
        {t.tripType && (
          <span className="bg-white rounded-full px-3 py-1.5 text-[13px] font-semibold text-[#13212B]">
            {tripTypeIcon(t.tripType)} {t.tripType}
          </span>
        )}
        {region && <span className="bg-white/85 rounded-full px-3 py-1.5 text-[13px] font-semibold text-[#3D4C56]">{region}</span>}
      </div>
    </div>
  );
}

/** The wide card at the top of Browse */
export function FeaturedTripCard({ t }: { t: CardTrip }) {
  const photos = tripPlacePhotos(t, 8);
  const places = tripPlacesToSave(t);
  return (
    <div className="flex flex-wrap bg-white border border-[#ECE7DF] rounded-3xl overflow-hidden">
      <Link href={`/trips/${t.id}`} className="block flex-[1_1_480px] min-h-[300px]" aria-label={`Open ${t.title}`}>
        <Cover t={t} className="h-full min-h-[300px]" />
      </Link>
      <div className="flex-[1_1_360px] min-w-0 p-7 sm:p-8 flex flex-col gap-3.5">
        <p className="text-xs font-bold uppercase tracking-wider text-[#1F6F78]">Featured trip</p>
        <h2 className="text-3xl font-extrabold tracking-tight text-[#13212B]">{t.title}</h2>
        <Byline t={t} />
        <Route t={t} />
        {t.description && <p className="text-[15px] leading-relaxed text-[#4A5963] line-clamp-3">{t.description}</p>}
        {photos.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {photos.slice(0, photos.length > 4 ? 3 : 4).map((u) => (
              <img key={u} src={u} alt="" loading="lazy" className="h-16 w-full object-cover rounded-xl bg-[#F1EEE8]" />
            ))}
            {photos.length > 4 && (
              <div className="h-16 rounded-xl bg-[#F1EEE8] flex items-center justify-center text-sm font-bold text-[#3D4C56]">
                +{places.length - 3}
              </div>
            )}
          </div>
        )}
        <Counts t={t} />
        <div className="flex flex-wrap gap-2 mt-auto pt-2">
          <Link href={`/trips/${t.id}`} className="inline-flex items-center px-5 py-3 rounded-xl bg-[#13212B] text-white font-semibold text-sm hover:bg-[#24394A]">
            Open trip <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          {places.length > 0 && <SaveToSandbox places={places} label="Save ideas" variant="pill" />}
        </div>
      </div>
    </div>
  );
}

/** The regular card in a grid */
export default function TripCard({ t }: { t: CardTrip }) {
  const places = tripPlacesToSave(t);
  return (
    <div className="bg-white border border-[#ECE7DF] rounded-[20px] overflow-hidden flex flex-col hover:shadow-[0_8px_28px_rgba(19,33,43,0.08)] transition-shadow">
      <Link href={`/trips/${t.id}`} className="block" aria-label={`Open ${t.title}`}>
        <Cover t={t} className="h-48" />
      </Link>
      <div className="p-5 flex flex-col gap-2.5 flex-1">
        <h3 className="text-xl font-bold text-[#13212B] line-clamp-2">
          <Link href={`/trips/${t.id}`} className="hover:underline">{t.title}</Link>
        </h3>
        <Byline t={t} />
        <Route t={t} />
        {t.description && <p className="text-sm leading-relaxed text-[#4A5963] line-clamp-2">{t.description}</p>}
        <div className="mt-auto pt-2"><Counts t={t} small /></div>
        <div className="flex gap-2 pt-1.5">
          <Link href={`/trips/${t.id}`} className="flex-1 text-center px-4 py-3 rounded-xl bg-[#13212B] text-white font-semibold text-sm hover:bg-[#24394A]">
            Open trip
          </Link>
          {places.length > 0 && <SaveToSandbox places={places} label="Save ideas" variant="pill" />}
        </div>
      </div>
    </div>
  );
}
