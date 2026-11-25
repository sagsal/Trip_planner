'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import SaveToSandbox from '@/components/SaveToSandbox';
import { placeFields } from '@/lib/placeDetails';
import { regionOf } from '@/lib/regions';
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

/** Every place in a trip, ready for "Save to My plans" */
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
        sourceUserName: null,
        sourceRating: p.rating || null,
        sourceReview: pf.review || null,
      };
    };
    return [...c.hotels.map((h) => mk(h, 'hotel')), ...c.restaurants.map((r) => mk(r, 'restaurant')), ...c.activities.map((a) => mk(a, 'activity'))];
  });
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const MONO = 'font-mono uppercase tracking-[0.1em]';

/** "2 stays · 4 things to do" — zeros are left out */
function Counts({ t }: { t: CardTrip }) {
  const n = tripCounts(t);
  const bits = [n.stays ? plural(n.stays, 'stay', 'stays') : '', n.eats ? plural(n.eats, 'place to eat', 'places to eat') : '', n.todo ? plural(n.todo, 'thing to do', 'things to do') : ''].filter(Boolean);
  if (!bits.length) return null;
  return <p className={`${MONO} text-[11px] text-[#5B6A73]`}>{bits.join(' · ')}</p>;
}

/** "BELIZE · 7 DAYS · DECEMBER 2024 · FAMILY WITH TEENS" */
function Kicker({ t }: { t: CardTrip }) {
  const days = tripDays(t);
  const country = parseList(t.countries).slice(0, 2).join(' & ') || t.region || '';
  const bits = [country, days ? plural(days, 'day', 'days') : '', monthYear(t.startDate), t.tripType || ''].filter(Boolean);
  return <p className={`${MONO} text-[11px] text-[#1F6F78] leading-relaxed`}>{bits.join(' · ')}</p>;
}

function Route({ t }: { t: CardTrip }) {
  const names = (t.cities_data || []).map((c) => c.name);
  if (names.length < 2) return null;
  return <p className={`${MONO} text-[12px] text-[#13212B] tracking-[0.06em]`}>{names.join(' → ')}</p>;
}

function Cover({ t, className }: { t: CardTrip; className: string }) {
  const region = t.region || regionOf(parseList(t.countries)[0] || '');
  return (
    <div className={`relative border border-[#E2DDD5] overflow-hidden ${className}`}
      style={{ background: 'repeating-linear-gradient(135deg, #EFEBE3 0 6px, #F6F3EE 6px 12px)' }}>
      <span className={`absolute inset-0 flex items-center justify-center ${MONO} text-[11px] text-[#5B6A73] px-2 text-center`}>
        {parseList(t.countries)[0] || region || ''}
      </span>
      {t.coverImageUrl && (
        <img
          src={t.coverImageUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
    </div>
  );
}

/** The wide card at the top of Browse */
export function FeaturedTripCard({ t }: { t: CardTrip }) {
  const places = tripPlacesToSave(t);
  return (
    <div className="flex flex-wrap bg-white border border-[#13212B]">
      <Link href={`/trips/${t.id}`} className="block flex-[1_1_420px] p-3 sm:p-4" aria-label={`Open ${t.title}`}>
        <Cover t={t} className="h-[220px] sm:h-full sm:min-h-[300px]" />
      </Link>
      <div className="flex-[1_1_360px] min-w-0 p-5 sm:p-8 flex flex-col gap-3">
        <p className={`${MONO} text-[11px] text-[#5B6A73]`}>Featured trip</p>
        <h2 className="font-serif font-normal text-[30px] sm:text-[36px] leading-[1.1] text-[#13212B]">
          <Link href={`/trips/${t.id}`} className="hover:text-[#1F6F78]">{t.title}</Link>
        </h2>
        <Kicker t={t} />
        <Route t={t} />
        {t.description && <p className="font-serif text-[17px] leading-relaxed text-[#3A4A54] line-clamp-3">{t.description}</p>}
        <Counts t={t} />
        <div className="flex flex-wrap gap-2 mt-auto pt-2">
          <Link href={`/trips/${t.id}`} className={`inline-flex items-center min-h-[44px] px-5 bg-[#13212B] text-[#F8F6F1] ${MONO} text-xs hover:bg-[#24394A]`}>
            Read the trip <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          {places.length > 0 && <SaveToSandbox places={places} label="Save ideas" variant="pill" />}
        </div>
      </div>
    </div>
  );
}

/** A trip in the Browse list: a compact row on phones, a card on wider screens */
export default function TripCard({ t }: { t: CardTrip }) {
  const places = tripPlacesToSave(t);
  return (
    <div className="bg-white border border-[#E2DDD5] flex sm:flex-col gap-4 sm:gap-0 p-3 sm:p-0">
      <Link href={`/trips/${t.id}`} className="block shrink-0 sm:p-3 sm:pb-0" aria-label={`Open ${t.title}`}>
        <Cover t={t} className="w-[104px] h-[104px] sm:w-full sm:h-44" />
      </Link>
      <div className="min-w-0 flex-1 sm:p-5 flex flex-col gap-1.5 sm:gap-2.5">
        <h3 className="font-serif font-normal text-[20px] sm:text-[24px] leading-[1.15] text-[#13212B] line-clamp-2">
          <Link href={`/trips/${t.id}`} className="hover:text-[#1F6F78]">{t.title}</Link>
        </h3>
        <Kicker t={t} />
        <div className="hidden sm:block"><Route t={t} /></div>
        {t.description && <p className="hidden sm:block text-[15px] leading-relaxed text-[#3A4A54] line-clamp-2">{t.description}</p>}
        <div className="hidden sm:block mt-auto pt-1"><Counts t={t} /></div>
        <div className="flex items-center gap-2 pt-1 sm:pt-2">
          <Link href={`/trips/${t.id}`} className={`${MONO} text-[11px] text-[#1F6F78] min-h-[40px] inline-flex items-center pr-2`}>Read →</Link>
          {places.length > 0 && <SaveToSandbox places={places} label="Save ideas" variant="pill" />}
        </div>
      </div>
    </div>
  );
}
