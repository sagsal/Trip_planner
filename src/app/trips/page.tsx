'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { tripTypeIcon, REGIONS, TRIP_TYPES, regionOf } from '@/lib/regions';
import { MapPin, Heart } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import TripCard, { FeaturedTripCard } from '@/components/TripCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import TripFinder from '@/components/TripFinder';
import { fetchTrips } from '@/utils/api';

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

function TripsContent() {
  const searchParams = useSearchParams();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    fetchTripsData();
  }, []);

  const fetchTripsData = async () => {
    try {
      // Fetch public trips (non-drafts)
      const result = await fetchTrips();
      
      if (result.data) {
        // Filter to only show public, non-draft trips
        // Handle cases where isDraft might be undefined/null
        // Exclude template trips and database trips (used for suggestions only)
        const publicTrips = result.data.trips.filter((trip: any) => {
          const isPublic = trip.isPublic === true;
          const isNotDraft = trip.isDraft === false || trip.isDraft === undefined || trip.isDraft === null;
          const isNotTemplate = !trip.title?.includes('TEMPLATE') && !trip.title?.includes('DATABASE:');
          return isPublic && isNotDraft && isNotTemplate;
        });
        
        setTrips(publicTrips);
        
        // Extract unique countries for filter
        const uniqueCountries = new Set<string>();
        publicTrips.forEach((trip: Trip) => {
          try {
            const tripCountries = JSON.parse(trip.countries);
            tripCountries.forEach((country: string) => uniqueCountries.add(country));
          } catch (e) {
            // Handle parsing error
          }
        });
        setCountries(Array.from(uniqueCountries).sort());
      } else if (result.error) {
        console.error('Error fetching trips:', result.error);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const parseCountries = (countriesJson: string) => {
    try {
      // Handle double-encoded JSON
      let parsed = JSON.parse(countriesJson);
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const parseCities = (citiesJson: string) => {
    try {
      // Handle double-encoded JSON
      let parsed = JSON.parse(citiesJson);
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         parseCountries(trip.countries).some((country: string) => 
                           country.toLowerCase().includes(searchTerm.toLowerCase())
                         ) ||
                         parseCities(trip.cities).some((city: string) => 
                           city.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesCountry = !filterCountry || parseCountries(trip.countries).includes(filterCountry);
    const matchesRegion =
      !filterRegion || trip.region === filterRegion || parseCountries(trip.countries).some((c: string) => regionOf(c) === filterRegion);
    const matchesType = !filterType || trip.tripType === filterType;

    return matchesSearch && matchesCountry && matchesRegion && matchesType;
  });

  const askParam = searchParams.get('ask') || undefined;
  const sorted = [...filteredTrips].sort((a, b) => (b.coverImageUrl ? 1 : 0) - (a.coverImageUrl ? 1 : 0));
  const anyFilter = !!(searchTerm || filterCountry || filterRegion || filterType);
  const featured = !anyFilter && sorted.length > 1 ? sorted[0] : null;
  const rest = featured ? sorted.slice(1) : sorted;
  const selectCls = 'px-3.5 py-2.5 rounded-full border border-[#E2DCD2] bg-white text-sm text-[#3D4C56] min-h-[42px]';

  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#13212B] pt-16">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Find a trip to build on</h1>
        <p className="text-[#5B6A73] mb-6">Real itineraries shared by fellow travelers. Describe what you want, or filter below.</p>

        {/* One box: typing filters the trips below; Enter asks the AI assistant */}
        <TripFinder onTyping={setSearchTerm} initialAsk={askParam}>
          <div data-tour="filters" className="flex flex-wrap gap-2">
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
                className="px-3.5 py-2.5 rounded-full text-sm text-[#1F6F78] underline min-h-[42px]"
              >
                Clear filters
              </button>
            )}
          </div>
        </TripFinder>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => <div key={i} className="h-[400px] rounded-[20px] bg-white border border-[#ECE7DF] animate-pulse" />)}
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center py-14 bg-white border border-[#ECE7DF] rounded-[20px]">
            <MapPin className="w-12 h-12 text-[#C9D2D6] mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">No trips found</h3>
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
              {filteredTrips.length === trips.length ? `${trips.length} ${trips.length === 1 ? 'trip' : 'trips'}` : `Showing ${filteredTrips.length} of ${trips.length} trips`}
            </p>
            {featured && <div className="mb-5"><FeaturedTripCard t={featured} /></div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((trip) => <TripCard key={trip.id} t={trip} />)}
            </div>
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
