'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { tripTypeIcon, REGIONS, TRIP_TYPES, regionOf } from '@/lib/regions';
import { MapPin, Heart } from 'lucide-react';
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
  const selectCls = 'shrink-0 px-3.5 py-2.5 rounded-full border border-[#E2DDD5] bg-white text-sm text-[#3D4C56] min-h-[42px]';

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-[#13212B] pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="text-3xl sm:text-4xl font-normal tracking-tight mb-2">Find a trip to build on</h1>
        <p className="text-[#5B6A73] mb-6">Real itineraries shared by fellow travelers. Describe what you want, or filter below.</p>

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
                <option key={t.value} value={t.value}>{t.icon} {t.value}</option>
              ))}
            </select>
            {anyFilter && (
              <button
                type="button"
                onClick={() => { setFilterCountry(''); setFilterRegion(''); setFilterType(''); }}
                className="shrink-0 whitespace-nowrap px-3.5 py-2.5 rounded-full text-sm text-[#1F6F78] underline min-h-[42px]"
              >
                Clear filters
              </button>
            )}
          </div>
        </TripFinder>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => <div key={i} className="h-[400px] rounded-[4px] bg-white border border-[#E2DDD5] animate-pulse" />)}
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center py-14 bg-white border border-[#E2DDD5] rounded-[4px]">
            <MapPin className="w-12 h-12 text-[#C9D2D6] mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No trips found</h3>
            <p className="text-[#5B6A73] mb-6">
              {anyFilter ? 'Try changing your search or filters.' : 'Be the first to share your travel experience!'}
            </p>
            <Link href="/trips/new" className="inline-flex items-center px-6 py-3 bg-[#13212B] text-white rounded-xl font-semibold hover:bg-[#24394A]">
              <Heart className="w-5 h-5 mr-2" /> Share your trip
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#5B6A73] mb-4">
              {total} {total === 1 ? 'trip' : 'trips'}
              {anyFilter ? ' match' : ''}
            </p>
            {featured && <div className="mb-5"><FeaturedTripCard t={featured} /></div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((trip) => <TripCard key={trip.id} t={trip} />)}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  type="button"
                  onClick={() => load(page + 1)}
                  disabled={loadingMore}
                  className="px-6 min-h-[48px] rounded-xl bg-white border border-[#E2DDD5] font-semibold text-[#13212B] hover:bg-[#F6F3EE] disabled:opacity-60"
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
