'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { tripTypeIcon, REGIONS, TRIP_TYPES, regionOf } from '@/lib/regions';
import { useSearchParams } from 'next/navigation';
import TripCard, { FeaturedTripCard } from '@/components/TripCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import TripFinder from '@/components/TripFinder';

interface Trip {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  countries: string;
  cities: string;
  isPublic: boolean;
  isDraft?: boolean; // Add isDraft to interface
  coverImageUrl?: string | null;
  tripType?: string | null;
  region?: string | null;
  createdAt: string;
  cities_data: CityData[];
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface CityData {
  id: string;
  name: string;
  country: string;
  hotels: Hotel[];
  restaurants: Restaurant[];
  activities: Activity[];
}

interface Hotel {
  id: string;
  name: string;
  location: string;
  rating?: number;
  review?: string;
  liked?: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  location: string;
  rating?: number;
  review?: string;
  liked?: boolean;
}

interface Activity {
  id: string;
  name: string;
  location: string;
  rating?: number;
  review?: string;
  liked?: boolean;
}

const PAGE_SIZE = 24;

function TripsContent() {
  const searchParams = useSearchParams();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState(''); // searchTerm, after a short pause in typing
  const [filterRegion, setFilterRegion] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [countries, setCountries] = useState<string[]>([]);
  const requestId = useRef(0);

  // Every country that has a trip, for the filter
  useEffect(() => {
    fetch('/api/trips?facets=countries')
      .then((r) => r.json())
      .then((d) => setCountries(Array.isArray(d.countries) ? d.countries : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setQuery(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Search and filters run in the database, so older trips are found too
  const load = async (pageNo: number) => {
    const id = ++requestId.current;
    if (pageNo === 1) setIsLoading(true);
    else setLoadingMore(true);
    try {
      const qs = new URLSearchParams({ public: 'true', page: String(pageNo), limit: String(PAGE_SIZE) });
      if (query) qs.set('q', query);
      if (filterCountry) qs.set('country', filterCountry);
      if (filterRegion) qs.set('region', filterRegion);
      if (filterType) qs.set('type', filterType);
      const res = await fetch(`/api/trips?${qs}`);
      const data = await res.json();
      if (id !== requestId.current) return; // a newer search has started
      const got: Trip[] = Array.isArray(data.trips) ? data.trips : [];
      setTrips((prev) => (pageNo === 1 ? got : [...prev, ...got.filter((t) => !prev.some((p) => p.id === t.id))]));
      setTotal(Number(data.pagination?.total) || got.length);
      setPage(pageNo);
    } catch (error) {
      console.error('Error fetching trips:', error);
      if (pageNo === 1) setTrips([]);
    } finally {
      if (id === requestId.current) {
        setIsLoading(false);
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filterCountry, filterRegion, filterType]);

  const filteredTrips = trips;
  const hasMore = trips.length < total;

  const askParam = searchParams.get('ask') || undefined;
  // Featured: the newest trip with a cover photo; everything else stays newest first
  const anyFilter = !!(searchTerm || filterCountry || filterRegion || filterType);
  const featured = !anyFilter && filteredTrips.length > 1 ? filteredTrips.find((t) => t.coverImageUrl) || filteredTrips[0] : null;
  const rest = featured ? filteredTrips.filter((t) => t.id !== featured.id) : filteredTrips;
  const selectCls = 'shrink-0 px-3 py-2.5 border border-[#E2DDD5] bg-white font-mono text-xs tracking-[0.06em] uppercase text-[#13212B] min-h-[44px]';

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-[#13212B] pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <p className="font-mono text-xs tracking-[0.14em] text-[#1F6F78] mb-2">REAL TRIPS FROM REAL TRAVELERS</p>
        <h1 className="font-serif text-[34px] sm:text-[44px] leading-[1.05] font-normal tracking-[-0.01em] mb-2">Find a trip to build on</h1>
        <p className="font-serif text-[18px] text-[#3A4A54] mb-6">Where people stayed, ate and explored, day by day. Search, filter, or ask a question.</p>

        {/* One box: typing filters the trips below; Enter asks the AI assistant */}
        <TripFinder onTyping={setSearchTerm} initialAsk={askParam}>
          <div data-tour="filters" className="flex sm:flex-wrap gap-2 -mx-5 px-5 sm:mx-0 sm:px-0 overflow-x-auto sm:overflow-visible pb-1 [scrollbar-width:none]">
            <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className={selectCls} aria-label="Region">
              <option value="">All regions</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} className={selectCls} aria-label="Country">
              <option value="">All countries</option>
              {countries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectCls} aria-label="Type of trip">
              <option value="">All types of trip</option>
              {TRIP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.value}</option>
              ))}
            </select>
            {anyFilter && (
              <button
                type="button"
                onClick={() => { setFilterCountry(''); setFilterRegion(''); setFilterType(''); }}
                className="shrink-0 whitespace-nowrap px-3 py-2.5 text-sm text-[#1F6F78] underline min-h-[44px]"
              >
                Clear filters
              </button>
            )}
          </div>
        </TripFinder>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => <div key={i} className="h-[130px] sm:h-[400px] bg-white border border-[#E2DDD5] animate-pulse" />)}
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="bg-white border border-[#E2DDD5] p-6 sm:p-8">
            <p className="font-mono text-xs tracking-[0.14em] text-[#1F6F78] mb-2">NOTHING YET</p>
            <h3 className="font-normal text-[26px] leading-tight mb-2">
              {searchTerm ? <>No trips for “{searchTerm}” yet</> : anyFilter ? 'No trips match these filters yet' : 'No trips yet'}
            </h3>
            <p className="text-[#3A4A54] mb-5 max-w-[560px]">
              The site is new, so some places have no trips so far. Ask members who’ve been there, browse the countries we do have, or be the first to share a trip there.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/feedback" className="inline-flex items-center min-h-[48px] px-5 bg-[#13212B] text-[#F8F6F1] font-mono text-xs tracking-[0.1em] hover:bg-[#24394A]">ASK MEMBERS WHO’VE BEEN</Link>
              <Link href="/destinations" className="inline-flex items-center min-h-[48px] px-5 border border-[#13212B] font-mono text-xs tracking-[0.1em] hover:bg-[#F8F6F1]">SEE WHERE WE HAVE TRIPS</Link>
              <Link href="/trips/import" className="inline-flex items-center min-h-[48px] px-5 border border-[#E2DDD5] font-mono text-xs tracking-[0.1em] hover:bg-[#F8F6F1]">SHARE A TRIP</Link>
              {anyFilter && (
                <button type="button" onClick={() => { setFilterCountry(''); setFilterRegion(''); setFilterType(''); }}
                  className="inline-flex items-center min-h-[48px] px-3 text-sm text-[#1F6F78] underline">Clear filters</button>
              )}
            </div>
          </div>
        ) : (
          <>
            <p className="font-mono text-xs tracking-[0.12em] uppercase text-[#5B6A73] mb-4 pb-3 border-b border-[#13212B]">
              {total} {total === 1 ? 'trip' : 'trips'}
              {anyFilter ? ' match' : ' so far'}
            </p>
            {featured && <div className="mb-5"><FeaturedTripCard t={featured} /></div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {rest.map((trip) => <TripCard key={trip.id} t={trip} />)}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  type="button"
                  onClick={() => load(page + 1)}
                  disabled={loadingMore}
                  className="px-6 min-h-[48px] bg-white border border-[#13212B] font-mono text-xs tracking-[0.1em] uppercase text-[#13212B] hover:bg-[#F6F3EE] disabled:opacity-60"
                >
                  {loadingMore ? 'Loading…' : `Load more trips (${total - trips.length} more)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function TripsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TripsContent />
    </Suspense>
  );
}
