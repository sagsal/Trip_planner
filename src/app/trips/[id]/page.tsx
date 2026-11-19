'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Calendar, Star, User, ArrowLeft, Heart, ThumbsUp, ThumbsDown, Copy, Plus, X, ExternalLink } from 'lucide-react';
import { placeFields, linkLabel, isRental } from '@/lib/placeDetails';
import { slugify } from '@/lib/slug';
import { cleanArrival, cleanTravel, parseJson, routeText, modeInfo, type FlightLeg } from '@/lib/travel';
import { tripTypeIcon } from '@/lib/regions';
import SaveToSandbox from '@/components/SaveToSandbox';
import GoogleReviews from '@/components/GoogleReviews';
import ShareTrip from '@/components/ShareTrip';
import { monthYear, daysFromDates } from '@/lib/dates';
import type { PlaceToSave } from '@/lib/sandbox';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchTrip } from '@/utils/api';

interface Trip {
  id: string;
  title: string;
  coverImageUrl?: string | null;
  travelInfo?: string | null;
  tripType?: string | null;
  region?: string | null;
  description: string | null;
  startDate: string;
  endDate: string;
  countries: string;
  cities: string;
  isPublic: boolean;
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
  state?: string | null;
  area?: string | null;
  numberOfDays?: number;
  arrival?: string | null;
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
  imageUrl?: string | null;
  webUrl?: string | null;
  dayNumber?: number | null;
  stayType?: string | null;
}

interface Restaurant {
  id: string;
  name: string;
  location: string;
  rating?: number;
  review?: string;
  liked?: boolean;
  imageUrl?: string | null;
  webUrl?: string | null;
  dayNumber?: number | null;
  stayType?: string | null;
}

interface Activity {
  id: string;
  name: string;
  location: string;
  rating?: number;
  review?: string;
  liked?: boolean;
  imageUrl?: string | null;
  webUrl?: string | null;
  dayNumber?: number | null;
  stayType?: string | null;
}

interface DraftTrip {
  id: string;
  title: string;
  countries: string[];
  citiesData: {
    id: string;
    name: string;
    country: string;
    numberOfDays: number;
    days: {
      id: string;
      dayNumber: number;
    }[];
  }[];
}

type Kind = 'hotel' | 'restaurant' | 'activity';
const KIND_LABEL: Record<Kind, string> = { hotel: 'Stay', restaurant: 'Eat', activity: 'Do' };

// One hotel / restaurant / activity, as a journal entry: kind, name, details in mono, the traveller's own words, a photo
const HATCH = { background: 'repeating-linear-gradient(135deg, #EFEBE3 0 1px, #F6F3EC 1px 10px)' };
function PlaceCard({ place, kind, save, boxed }: { place: { name: string; location?: string; rating?: number | null; review?: string | null; liked?: boolean | null; imageUrl?: string | null; webUrl?: string | null; stayType?: string | null }; kind: Kind; save?: PlaceToSave; boxed?: boolean }) {
  const details = placeFields(place);
  const rating = Number(place.rating) || 0;
  const [imgOk, setImgOk] = useState(true);
  const label = (isRental(place) ? 'Rental' : KIND_LABEL[kind]).toUpperCase();
  const meta = [
    place.location,
    rating > 0 ? `★ ${rating}/5` : '',
    place.liked === true ? 'Loved it' : place.liked === false ? 'Would skip' : '',
  ].filter(Boolean).join(' · ');
  const photo = details.imageUrl && imgOk;
  return (
    <div className={`flex gap-4 sm:gap-6 ${boxed ? 'p-4 sm:p-5 border border-[#E2DDD5] bg-white' : 'py-5 border-b border-[#E2DDD5]'}`}>
      {!boxed && <span className="hidden sm:block w-12 shrink-0 font-mono text-[13px] text-[#1F6F78] pt-1.5">{label}</span>}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <span className={`font-mono text-[11px] tracking-[0.12em] text-[#1F6F78] ${boxed ? '' : 'sm:hidden'}`}>{label}</span>
        <h4 className={`font-serif font-medium leading-tight text-[#13212B] ${boxed ? 'text-[26px] sm:text-[28px]' : 'text-[22px] sm:text-2xl'}`}>{place.name}</h4>
        {meta && <p className="font-mono text-[11px] tracking-[0.06em] uppercase text-[#5B6A73]">{meta}</p>}
        {details.review && (
          <p className="font-serif italic text-[17px] sm:text-lg leading-relaxed text-[#2A3A44] whitespace-pre-line mt-0.5">“{details.review}”</p>
        )}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-1 font-mono text-xs tracking-[0.06em]">
          {details.webUrl && (
            <a href={details.webUrl} target="_blank" rel="noopener noreferrer" className="py-2 uppercase text-[#1F6F78] hover:text-[#13212B]">
              {linkLabel(details.webUrl)} ↗
            </a>
          )}
          {save && <SaveToSandbox places={[save]} />}
        </div>
        {!isRental(place) && (
          <GoogleReviews name={place.name} location={place.location} city={save?.city} country={save?.country} kind={kind} />
        )}
      </div>
      {photo && (
        <img
          src={details.imageUrl!}
          alt=""
          loading="lazy"
          className={`shrink-0 object-cover border border-[#E2DDD5] ${boxed ? 'w-24 h-24 sm:w-48 sm:h-36' : 'w-20 h-20 sm:w-24 sm:h-24'}`}
          style={HATCH}
          onError={() => setImgOk(false)}
        />
      )}
    </div>
  );
}

type CityT = CityData;

// One city: filter by kind, then where they stayed and a day-by-day timeline
function CityView({ city, trip, showHeader }: { city: CityT; trip: Trip; showHeader: boolean }) {
  const [kind, setKind] = useState<'all' | Kind>('all');
  useEffect(() => setKind('all'), [city.id]);

  const toSave = (p: any, k: Kind): PlaceToSave => {
    const f = placeFields(p);
    return {
      kind: k,
      name: p.name,
      location: p.location || null,
      city: city.name,
      country: city.country,
      imageUrl: f.imageUrl,
      webUrl: f.webUrl,
      stayType: p.stayType || null,
      sourceTripId: trip.id,
      sourceTripTitle: trip.title,
      sourceUserName: null,
      sourceRating: p.rating || null,
      sourceReview: f.review || null,
    };
  };
  const cityPlaces: PlaceToSave[] = [
    ...city.hotels.map((h) => toSave(h, 'hotel')),
    ...city.activities.map((a) => toSave(a, 'activity')),
    ...city.restaurants.map((r) => toSave(r, 'restaurant')),
  ];

  const dayNumbers = new Set<number>();
  city.restaurants.forEach((r) => r.dayNumber && dayNumbers.add(r.dayNumber));
  city.activities.forEach((a) => a.dayNumber && dayNumbers.add(a.dayNumber));
  const days = Array.from(dayNumbers).sort((a, b) => a - b);
  const noDay = [
    ...city.activities.filter((a) => !a.dayNumber).map((a) => ({ p: a, k: 'activity' as Kind })),
    ...city.restaurants.filter((r) => !r.dayNumber).map((r) => ({ p: r, k: 'restaurant' as Kind })),
  ];
  const totalDays = Math.max(city.numberOfDays || 0, days.length ? days[days.length - 1] : 0);
  const arrival = cleanArrival(parseJson(city.arrival, null));
  const m = arrival?.mode ? modeInfo(arrival.mode) : null;

  const pills: { k: 'all' | Kind; label: string; n: number }[] = [
    { k: 'all', label: 'All', n: cityPlaces.length },
    { k: 'hotel', label: 'Where to stay', n: city.hotels.length },
    { k: 'restaurant', label: 'Where to eat', n: city.restaurants.length },
    { k: 'activity', label: 'Things to do', n: city.activities.length },
  ].filter((x) => x.k === 'all' || x.n > 0) as any;

  const list = (k: Kind) => (k === 'hotel' ? city.hotels : k === 'restaurant' ? city.restaurants : city.activities);

  return (
    <div className="flex flex-col">
      {showHeader && (
        <div className="flex flex-wrap items-end justify-between gap-3 pt-6 pb-4">
          <div>
            <h2 className="font-serif font-normal text-[36px] sm:text-[44px] leading-none tracking-[-0.015em] text-[#13212B]">{city.name}</h2>
            <p className="font-mono text-xs tracking-[0.1em] uppercase text-[#5B6A73] mt-2">
              {city.area && city.area !== city.name ? `${city.area} · ` : ''}{city.state && city.state !== city.name ? `${city.state} · ` : ''}{city.country}
              {totalDays > 0 && ` · ${totalDays} ${totalDays === 1 ? 'day' : 'days'}`}
            </p>
          </div>
          {cityPlaces.length > 1 && <SaveToSandbox places={cityPlaces} label="Save this city" variant="pill" />}
        </div>
      )}
      {arrival && m && (
        <div className="py-4 border-y border-[#E2DDD5] font-mono text-[13px] tracking-[0.04em]">
          <p className="flex flex-wrap gap-x-4 gap-y-1 uppercase">
            <span className="text-[#1F6F78]">Arrived by</span>
            <span>{[m.label, arrival.from && `from ${arrival.from}`, arrival.operator].filter(Boolean).join(' · ')}</span>
          </p>
          {arrival.details && <p className="mt-2 font-serif text-[17px] tracking-normal text-[#2A3A44] whitespace-pre-line">{arrival.details}</p>}
        </div>
      )}

      {pills.length > 2 && (
        <div role="group" aria-label="Show" className="flex flex-wrap gap-x-1 gap-y-1 pt-5 font-mono text-xs tracking-[0.08em]">
          {pills.map((x) => (
            <button
              key={x.k}
              type="button"
              aria-pressed={kind === x.k}
              onClick={() => setKind(x.k)}
              className={`px-3 min-h-[40px] border uppercase ${
                kind === x.k ? 'bg-[#13212B] border-[#13212B] text-[#F8F6F1]' : 'bg-transparent border-[#E2DDD5] text-[#3A4A54] hover:border-[#13212B]'
              }`}
            >
              {x.label} <span className={kind === x.k ? 'text-[#F8F6F1]/70' : 'text-[#5B6A73]'}>{x.n}</span>
            </button>
          ))}
        </div>
      )}

      {kind !== 'all' ? (
        <div className="mt-6 border-t border-[#13212B]">
          {list(kind).map((p: any) => (
            <div key={p.id}>
              {p.dayNumber ? <p className="font-mono text-[11px] tracking-[0.12em] text-[#5B6A73] pt-4">DAY {String(p.dayNumber).padStart(2, '0')}</p> : null}
              <PlaceCard place={p} kind={kind} save={toSave(p, kind)} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {city.hotels.length > 0 && (
            <section className="pt-9">
              <h3 className="font-serif font-normal text-[30px] sm:text-[34px] mb-4">Where we stayed</h3>
              <div className="flex flex-col gap-3">
                {city.hotels.map((h) => <PlaceCard key={h.id} place={h} kind="hotel" save={toSave(h, 'hotel')} boxed />)}
              </div>
            </section>
          )}

          {days.map((dayNumber) => {
            const items = [
              ...city.activities.filter((a) => a.dayNumber === dayNumber).map((a) => ({ p: a, k: 'activity' as Kind })),
              ...city.restaurants.filter((r) => r.dayNumber === dayNumber).map((r) => ({ p: r, k: 'restaurant' as Kind })),
            ];
            return (
              <section key={dayNumber} className="pt-10">
                <div className="flex flex-wrap items-baseline justify-between gap-3 pb-3 border-b border-[#13212B]">
                  <h3 className="font-serif font-normal text-[30px] sm:text-[34px] flex items-baseline gap-3.5">
                    Day {dayNumber}
                    <span className="font-mono text-xs tracking-[0.1em] text-[#5B6A73]">{items.length} {items.length === 1 ? 'STOP' : 'STOPS'}</span>
                  </h3>
                  {items.length > 1 && (
                    <SaveToSandbox places={items.map(({ p, k }) => toSave(p, k))} label="Save this day" variant="pill" />
                  )}
                </div>
                {items.map(({ p, k }) => <PlaceCard key={`${k}-${p.id}`} place={p} kind={k} save={toSave(p, k)} />)}
              </section>
            );
          })}

          {noDay.length > 0 && (
            <section className="pt-10">
              <h3 className="font-serif font-normal text-[30px] sm:text-[34px]">{days.length > 0 ? `Also in ${city.name}` : 'Places'}</h3>
              {days.length > 0 && <p className="font-mono text-[11px] tracking-[0.12em] text-[#5B6A73] mt-1">NO DAY GIVEN</p>}
              <div className="mt-3 border-t border-[#13212B]">
                {noDay.map(({ p, k }) => <PlaceCard key={`${k}-${p.id}`} place={p} kind={k} save={toSave(p, k)} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/** For signed-in members: planned trips to this country that are asking for advice */
function AskingHere({ country }: { country: string }) {
  const [d, setD] = useState<{ list: { id: string; title: string; ask: string | null; commentCount: number }[]; count: number } | null>(null);
  useEffect(() => {
    let signedIn = false;
    try { signedIn = !!localStorage.getItem('user'); } catch {}
    if (!signedIn || !country) return;
    fetch(`/api/advice/summary?country=${encodeURIComponent(country)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((x) => x?.signedIn && x.inCountryCount > 0 && setD({ list: x.inCountry || [], count: x.inCountryCount }))
      .catch(() => {});
  }, [country]);
  if (!d) return null;
  return (
    <div className="border border-[#1F6F78] bg-[#EEF5F4]">
      <h2 className="px-5 py-4 border-b border-[#C3DEDF] font-mono font-normal text-[11px] tracking-[0.14em] text-[#16535A] uppercase">
        {d.count === 1 ? `A member is planning ${country}` : `${d.count} members are planning ${country}`}
      </h2>
      <div className="px-5">
        {d.list.map((a) => (
          <Link key={a.id} href={`/feedback/${a.id}`} className="py-3.5 border-b border-[#C3DEDF] last:border-b-0 flex flex-col gap-1 hover:text-[#1F6F78]">
            <span className="font-serif text-xl leading-snug">{a.title}</span>
            {a.ask && <span className="font-serif italic text-base text-[#3A4A54] line-clamp-2">“{a.ask}”</span>}
            <span className="font-mono text-[11px] tracking-[0.08em] text-[#5B6A73] uppercase">{a.commentCount ? `${a.commentCount} ${a.commentCount === 1 ? 'reply' : 'replies'}` : 'No replies yet'}</span>
          </Link>
        ))}
      </div>
      <Link href="/feedback" className="block px-5 py-3.5 border-t border-[#C3DEDF] font-mono text-xs tracking-[0.1em] text-[#1F6F78] hover:text-[#13212B]">GIVE ADVICE →</Link>
    </div>
  );
}

function TripDetailContent() {
  const params = useParams();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [draftTrips, setDraftTrips] = useState<DraftTrip[]>([]);
  const [showSaveOptions, setShowSaveOptions] = useState(true); // Expanded by default
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeCityId, setActiveCityId] = useState<string | null>(null);
  const [coverOk, setCoverOk] = useState(true);
  const [selectedItems, setSelectedItems] = useState<{
    hotels: Set<string>;
    restaurants: Set<string>;
    activities: Set<string>;
  }>({
    hotels: new Set(),
    restaurants: new Set(),
    activities: new Set()
  });

  // Set mounted state to prevent hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug: Track state changes
  useEffect(() => {
    if (mounted) {
      console.log('📊 State updated - Draft:', selectedDraft, 'City:', selectedCity, 'Day:', selectedDay);
    }
  }, [selectedDraft, selectedCity, selectedDay, mounted]);

  const loadDraftTrips = useCallback(async () => {
    try {
      if (typeof window === 'undefined') return; // Only run on client
      const userData = localStorage.getItem('user');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
      
      try {
        const response = await fetch(`/api/trips?drafts=true&userId=${user.id}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          const transformed: DraftTrip[] = (data.trips || []).map((trip: any) => {
          let countries: string[] = [];
          try {
            if (typeof trip.countries === 'string') {
              const parsed = JSON.parse(trip.countries);
              countries = Array.isArray(parsed) ? parsed : (typeof parsed === 'string' ? JSON.parse(parsed) : []);
            } else if (Array.isArray(trip.countries)) {
              countries = trip.countries;
            }
          } catch (e) {
            countries = [];
          }

          return {
            id: trip.id,
            title: trip.title,
            countries,
            citiesData: (trip.cities_data || []).map((city: any) => {
              // Calculate numberOfDays from items or use default
              // If we have restaurants/activities, estimate days (roughly 3-5 items per day)
              const totalItems = (city.restaurants?.length || 0) + (city.activities?.length || 0);
              const estimatedDays = totalItems > 0 ? Math.max(1, Math.ceil(totalItems / 4)) : 1;
              // Default to at least 3 days if no items, so users can always select a day
              const numberOfDays = city.numberOfDays || (totalItems > 0 ? estimatedDays : 3);
              
              // Create days array
              const days = Array.from({ length: numberOfDays }, (_, index) => ({
                id: `day-${index + 1}`,
                dayNumber: index + 1
              }));
              
              return {
                id: city.id,
                name: city.name,
                country: city.country,
                numberOfDays,
                days
              };
            })
          };
          });
          setDraftTrips(transformed);
          console.log('✅ Loaded draft trips:', transformed.length, transformed);
          console.log('✅ Draft trips data structure:', JSON.stringify(transformed, null, 2));
        } else {
          console.error('❌ Failed to load draft trips:', response.status, response.statusText);
          // Set empty array on error to prevent UI issues
          setDraftTrips([]);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('❌ Draft trips fetch timeout');
          setDraftTrips([]); // Set empty array on timeout
        } else {
          throw fetchError; // Re-throw to be caught by outer catch
        }
      }
    } catch (err) {
      console.error('❌ Error loading draft trips:', err);
      setDraftTrips([]); // Set empty array on any error
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return; // Only run on client
    
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
        loadDraftTrips();
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    const tripId = params?.id as string;
    if (tripId) {
      fetchTripData(tripId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id, loadDraftTrips]);

  const fetchTripData = async (id: string) => {
    try {
      console.log('Fetching trip data for ID:', id);
      const result = await fetchTrip(id);
      console.log('Fetch result:', result);
      
      if (result.status === 404) {
        setError('Trip not found. It may have been deleted or you may not have permission to view it.');
        setIsLoading(false);
        return;
      }
      
      if (result.data && result.data.trip) {
        setTrip(result.data.trip);
      } else if (result.error) {
        const errorMsg = result.error;
        console.error('Trip fetch failed:', errorMsg);
        setError(errorMsg);
      } else {
        setError('Trip not found. Please check the URL and try again.');
      }
    } catch (error) {
      console.error('Error in fetchTripData:', error);
      setError(error instanceof Error ? error.message : 'Error loading trip');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderLikeButton = (liked: boolean | null) => {
    if (liked === true) {
      return (
        <div className="flex items-center text-green-600">
          <ThumbsUp className="w-4 h-4 mr-1" />
          <span className="text-sm">Loved it</span>
        </div>
      );
    } else if (liked === false) {
      return (
        <div className="flex items-center text-red-600">
          <ThumbsDown className="w-4 h-4 mr-1" />
          <span className="text-sm">Not great</span>
        </div>
      );
    }
    return null;
  };

  const toggleItemSelection = useCallback((itemType: 'hotel' | 'restaurant' | 'activity', itemId: string) => {
    console.log('🔄 toggleItemSelection called:', { itemType, itemId });
    setSelectedItems(prev => {
      // Handle each item type explicitly to avoid TypeScript issues
      let newSet: Set<string>;
      if (itemType === 'hotel') {
        newSet = new Set(prev.hotels);
      } else if (itemType === 'restaurant') {
        newSet = new Set(prev.restaurants);
      } else if (itemType === 'activity') {
        newSet = new Set(prev.activities);
      } else {
        console.error('Unknown item type:', itemType);
        return prev;
      }

      const wasSelected = newSet.has(itemId);
      if (wasSelected) {
        newSet.delete(itemId);
        console.log('❌ Removed', itemType, itemId);
      } else {
        newSet.add(itemId);
        console.log('✅ Added', itemType, itemId);
      }

      const updated = {
        ...prev,
        ...(itemType === 'hotel' && { hotels: newSet }),
        ...(itemType === 'restaurant' && { restaurants: newSet }),
        ...(itemType === 'activity' && { activities: newSet })
      };

      console.log('📊 Updated selectedItems:', {
        hotels: updated.hotels.size,
        restaurants: updated.restaurants.size,
        activities: updated.activities.size
      });

      return updated;
    });
  }, []);

  const handleCopySelected = useCallback(async () => {
    if (!selectedDraft) {
      setError('Please select a draft trip first');
      setTimeout(() => setError(''), 5000);
      return;
    }

    if (!selectedCity) {
      setError('Please select a target city first');
      setTimeout(() => setError(''), 5000);
      return;
    }

    // Check if restaurants or activities are selected but no day is selected
    const hasRestaurants = selectedItems.restaurants.size > 0;
    const hasActivities = selectedItems.activities.size > 0;
    if ((hasRestaurants || hasActivities) && !selectedDay) {
      setError('Please select a day for restaurants and activities');
      setTimeout(() => setError(''), 5000);
      return;
    }

    if (!trip) {
      alert('Trip data not loaded');
      return;
    }

    const copyPromises: Promise<void>[] = [];
    const errors: string[] = [];

    // Copy selected hotels
    trip.cities_data.forEach(city => {
      city.hotels.forEach(hotel => {
        const hotelId = hotel.id || `${city.id}-hotel-${hotel.name || 'unnamed'}`;
        if (selectedItems.hotels.has(hotelId)) {
          copyPromises.push(
            handleCopyItem('hotel', hotel, selectedCity).catch(err => {
              errors.push(`Failed to copy hotel ${hotel.name}`);
            })
          );
        }
      });

      // Copy selected restaurants
      if (selectedDay) {
        city.restaurants.forEach(restaurant => {
          const restaurantId = restaurant.id || `${city.id}-restaurant-${restaurant.name || 'unnamed'}`;
          if (selectedItems.restaurants.has(restaurantId)) {
            copyPromises.push(
              handleCopyItem('restaurant', restaurant, selectedCity, selectedDay).catch(err => {
                errors.push(`Failed to copy restaurant ${restaurant.name}`);
              })
            );
          }
        });
      }

      // Copy selected activities
      if (selectedDay) {
        city.activities.forEach((activity, activityIndex) => {
          const activityId = activity.id || `${city.id || 'city'}-activity-${activityIndex}-${activity.name || 'unnamed'}`;
          if (selectedItems.activities.has(activityId)) {
            copyPromises.push(
              handleCopyItem('activity', activity, selectedCity, selectedDay).catch(err => {
                errors.push(`Failed to copy activity ${activity.name}`);
              })
            );
          }
        });
      }
    });

    if (copyPromises.length === 0) {
      alert('Please select at least one item to copy');
      return;
    }

    try {
      await Promise.all(copyPromises);
      setSelectedItems({ hotels: new Set(), restaurants: new Set(), activities: new Set() });
      if (errors.length > 0) {
        setError(`Some items copied successfully. Errors: ${errors.join(', ')}`);
        setTimeout(() => setError(''), 5000);
      } else {
        setSuccess(`Successfully copied ${copyPromises.length} item${copyPromises.length !== 1 ? 's' : ''}!`);
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err) {
      setError('An error occurred while copying items');
      setTimeout(() => setError(''), 5000);
    }
  }, [selectedDraft, selectedCity, selectedDay, selectedItems, trip]);

  const handleCopyItem = async (itemType: 'hotel' | 'restaurant' | 'activity', item: any, targetCityId: string, targetDayId?: string) => {
    console.log('handleCopyItem called:', { itemType, item, targetCityId, targetDayId, selectedDraft });
    
    if (!selectedDraft) {
      console.error('No draft selected');
      setError('Please select a draft trip first');
      return;
    }

    if (!targetCityId) {
      console.error('No city selected');
      setError('Please select a city in your draft trip');
      return;
    }

    // For restaurants and activities, day selection is required
    if ((itemType === 'restaurant' || itemType === 'activity') && !targetDayId) {
      console.error('No day selected for', itemType);
      setError('Please select a day for restaurants and activities');
      return;
    }

    if (!item || !item.name) {
      console.error('Invalid item:', item);
      setError('Invalid item data');
      return;
    }

    try {
      setError(null);
      console.log('Sending request to save item:', {
        url: `/api/trips/${selectedDraft}`,
        itemType,
        itemName: item.name,
        cityId: targetCityId,
        dayId: targetDayId
      });
      
      const response = await fetch(`/api/trips/${selectedDraft}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType,
          item,
          cityId: targetCityId,
          dayId: targetDayId
        })
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('Error parsing success response:', parseError);
          setSuccess(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} "${item.name}" saved to your draft!`);
          setTimeout(() => setSuccess(null), 5000);
          loadDraftTrips();
          return;
        }
        console.log('Item saved successfully:', data);
        const successMsg = `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} "${item.name}" saved to your draft!`;
        setSuccess(successMsg);
        setTimeout(() => setSuccess(null), 5000);
        // Reload draft trips to get updated data
        loadDraftTrips();
      } else {
        let errorMsg = 'Failed to save item to draft';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || errorMsg);
            console.error('Failed to save item:', data);
          } else {
            const text = await response.text();
            errorMsg = text || `HTTP ${response.status}: ${response.statusText}`;
            console.error('Failed to save item - non-JSON response:', text);
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMsg = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        setError(errorMsg);
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('Error copying item:', err);
      setError('An error occurred while saving the item');
      setTimeout(() => setError(null), 5000);
    }
  };

  const totalSelected = selectedItems.hotels.size + selectedItems.restaurants.size + selectedItems.activities.size;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || (!trip && !isLoading)) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link
            href="/trips"
            className="inline-flex items-center font-semibold text-[#1F6F78] hover:text-[#16535A] mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Trips
          </Link>
          
          <div className="bg-white border border-[#E2DDD5] rounded-[4px] p-8 text-center">
            <div className="mb-6">
              <span className="text-6xl">🔍</span>
            </div>
            <h1 className="text-3xl font-normal text-gray-900 mb-4">Trip Not Found</h1>
            <p className="text-gray-600 mb-2 text-lg">
              {error || 'The trip you are looking for does not exist.'}
            </p>
            <p className="text-gray-500 text-sm mb-6">
              This trip may have been deleted, or you may not have permission to view it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/trips"
                className="inline-flex items-center px-6 py-3 bg-[#13212B] text-white rounded-xl hover:bg-[#24394A] transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse All Trips
              </Link>
              <Link
                href="/trips/new"
                className="inline-flex items-center px-6 py-3 bg-white border border-[#E2DDD5] text-[#13212B] rounded-xl hover:bg-[#F6F3EE] transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your Own Trip
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const t = trip!;
  const cities = t.cities_data || [];
  const multi = cities.length > 1;
  const active = cities.find((c) => c.id === activeCityId) || cities[0];
  const travel = cleanTravel(t.travelInfo);
  const counts = {
    stays: cities.reduce((n, c) => n + c.hotels.length, 0),
    eats: cities.reduce((n, c) => n + c.restaurants.length, 0),
    todo: cities.reduce((n, c) => n + c.activities.length, 0),
  };
  const daysTotal = daysFromDates(t.startDate, t.endDate) || cities.reduce((n, c) => n + (c.numberOfDays || 0), 0);
  const allPlaces: PlaceToSave[] = cities.flatMap((c) => {
    const mk = (p: any, kind: Kind): PlaceToSave => {
      const f = placeFields(p);
      return {
        kind, name: p.name, location: p.location || null, city: c.name, country: c.country,
        imageUrl: f.imageUrl, webUrl: f.webUrl, stayType: p.stayType || null,
        sourceTripId: t.id, sourceTripTitle: t.title, sourceUserName: null,
        sourceRating: p.rating || null, sourceReview: f.review || null,
      };
    };
    return [...c.hotels.map((h) => mk(h, 'hotel')), ...c.activities.map((a) => mk(a, 'activity')), ...c.restaurants.map((r) => mk(r, 'restaurant'))];
  });
  const country = parseCountries(t.countries);
  const kicker = [
    ...country,
    daysTotal ? `${daysTotal} ${daysTotal === 1 ? 'day' : 'days'}` : '',
    monthYear(t.startDate),
    t.tripType || '',
  ].filter(Boolean).join(' · ');
  const where = [
    ...Array.from(new Set(cities.map((c) => c.area).filter(Boolean) as string[])),
    ...Array.from(new Set(cities.map((c) => c.state).filter(Boolean) as string[])),
    ...country,
  ].join(', ');
  const ledger: [string, string][] = ([
    ['Where', where],
    ['When', monthYear(t.startDate)],
    ['Days', daysTotal ? String(daysTotal) : ''],
    ['Cities', cities.length ? String(cities.length) : ''],
    ['Stays', String(counts.stays)],
    ['Restaurants', String(counts.eats)],
    ['Things to do', String(counts.todo)],
    ['Who went', t.tripType || ''],
  ] as [string, string][]).filter(([, v]) => v);
  const legsBlock = (title: string, legs: FlightLeg[]) =>
    legs.length > 0 && (
      <div className="flex flex-col gap-1.5">
        <p className="font-mono text-[11px] tracking-[0.12em] text-[#5B6A73] uppercase">{title}</p>
        {legs.map((l, i) => (
          <div key={i} className="flex flex-col">
            <span className="font-mono text-[15px] tracking-[0.03em] uppercase">{[l.from, l.to].filter(Boolean).join(' → ')}</span>
            {(l.airline || l.flightNumber) && (
              <span className="font-mono text-[11px] tracking-[0.08em] text-[#5B6A73] uppercase">{[l.airline, l.flightNumber].filter(Boolean).join(' · ')}</span>
            )}
          </div>
        ))}
      </div>
    );
  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      {t.isPublic && <ShareTrip title={t.title} />}
      {allPlaces.length > 0 && <SaveToSandbox places={allPlaces} label="Save trip" variant="pill" />}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-[#13212B] pt-16">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-6 sm:pt-8">
        <Link href="/trips" className="inline-block font-mono text-xs tracking-[0.1em] text-[#5B6A73] hover:text-[#13212B] py-2.5">
          ← ALL TRIPS
        </Link>

        {success && (
          <div className="border border-[#C3DEDF] bg-[#EEF5F4] text-[#16535A] px-5 py-3 mt-3 flex items-center justify-between">
            <p className="font-semibold">{success}</p>
            <button onClick={() => setSuccess(null)} aria-label="Close" className="ml-4"><X className="w-5 h-5" /></button>
          </div>
        )}
        {error && (
          <div className="border border-red-200 bg-red-50 text-red-700 px-4 py-3 mt-3 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} aria-label="Close"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Title block */}
        <div className="flex flex-wrap gap-x-12 gap-y-6 items-end justify-between pt-4 sm:pt-5 pb-7 sm:pb-8 border-b border-[#13212B]">
          <div className="flex-[1_1_520px] min-w-0 flex flex-col gap-4">
            {kicker && (
              <p className="font-mono text-xs tracking-[0.14em] uppercase text-[#1F6F78]">
                {country.map((c, i) => (
                  <span key={c}>{i > 0 && ' · '}<Link href={`/destinations/${slugify(c)}`} className="underline-offset-4 hover:underline">{c}</Link></span>
                ))}
                {kicker.slice(country.join(' · ').length)}
              </p>
            )}
            <h1 className="font-serif font-normal text-[42px] sm:text-[60px] lg:text-[76px] leading-[1.02] tracking-[-0.02em]">{t.title}</h1>
            {multi && (
              <p className="font-mono text-sm sm:text-[15px] tracking-[0.04em] uppercase flex flex-wrap items-center gap-x-2 gap-y-1">
                {cities.map((c, i) => {
                  const a = cleanArrival(parseJson(c.arrival, null));
                  const mi = i > 0 && a?.mode ? modeInfo(a.mode) : null;
                  return (
                    <span key={c.id} className="flex items-center gap-2">
                      {i > 0 && <span aria-hidden className="text-[#5B6A73]">{mi ? `→ ${mi.label.toUpperCase()} →` : '→'}</span>}
                      <button type="button" onClick={() => setActiveCityId(c.id)} className="uppercase hover:text-[#1F6F78] underline-offset-4 hover:underline">
                        {c.name}
                      </button>
                    </span>
                  );
                })}
              </p>
            )}
          </div>
          {actions}
        </div>
        {(t as any).credit && (
          <p className="pt-3 font-mono text-xs tracking-[0.08em] uppercase text-[#5B6A73] flex flex-wrap gap-x-3 gap-y-1">
            <span>
              Shared by{' '}
              {(t as any).credit.url ? (
                <a href={(t as any).credit.url} target="_blank" rel="noopener nofollow ugc" className="text-[#1F6F78] underline underline-offset-4 hover:text-[#13212B]">{(t as any).credit.name} ↗</a>
              ) : (
                <span className="text-[#13212B]">{(t as any).credit.name}</span>
              )}
            </span>
            {(t as any).credit.founding && <span className="text-[#1F6F78]">· Founding contributor</span>}
          </p>
        )}

        {/* Cover plate */}
        {t.coverImageUrl && coverOk && (
          <figure className="mt-7 sm:mt-8 border border-[#E2DDD5] bg-white p-2.5 sm:p-3.5 pb-0 sm:pb-0">
            <div className="relative h-[240px] sm:h-[420px] border border-[#E2DDD5] overflow-hidden" style={HATCH}>
              <img src={t.coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={() => setCoverOk(false)} />
            </div>
            <figcaption className="flex justify-between gap-3 py-3 px-0.5 font-mono text-[11px] tracking-[0.08em] uppercase text-[#5B6A73]">
              <span className="truncate">{where || t.title}</span>
              <span className="shrink-0">{monthYear(t.startDate)}</span>
            </figcaption>
          </figure>
        )}

        <div className="pt-10 sm:pt-12 pb-20 flex flex-wrap gap-12 items-start">
          {/* The trip itself */}
          <div className="flex-[999_1_560px] min-w-0">
            {multi && active && (
              <div role="tablist" aria-label="Cities" className="flex flex-wrap gap-x-7 border-b border-[#13212B]">
                {cities.map((c, i) => {
                  const on = c.id === active.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => setActiveCityId(c.id)}
                      className={`-mb-px border-b-[3px] py-3 pr-1 text-left flex flex-col gap-0.5 ${on ? 'border-[#1F6F78] text-[#13212B]' : 'border-transparent text-[#5B6A73] hover:text-[#13212B]'}`}
                    >
                      <span className="font-mono text-[11px] tracking-[0.12em] text-[#5B6A73]">
                        {String(i + 1).padStart(2, '0')}{c.numberOfDays ? ` · ${c.numberOfDays} ${c.numberOfDays === 1 ? 'DAY' : 'DAYS'}` : ''}
                      </span>
                      <span className="font-serif text-[22px] sm:text-[26px] leading-tight">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {active ? (
              <CityView city={active} trip={t} showHeader={multi} />
            ) : (
              <p className="font-serif italic text-xl text-[#5B6A73]">No places added to this trip yet.</p>
            )}
          </div>

          {/* Ledger */}
          <aside aria-label="Trip at a glance" className="flex-[1_1_300px] min-w-0 flex flex-col gap-6">
            <div className="border border-[#E2DDD5] bg-white">
              <h2 className="px-5 py-4 border-b border-[#E2DDD5] font-mono font-normal text-[11px] tracking-[0.14em] text-[#5B6A73]">TRIP AT A GLANCE</h2>
              <dl className="px-5 pt-1 pb-2">
                {ledger.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-3 border-b border-[#EFEBE3] last:border-b-0">
                    <dt className="font-serif text-lg">{k}</dt>
                    <dd className="font-mono text-[13px] text-right uppercase">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {country[0] && <AskingHere country={country[0]} />}
            {(travel.outbound.length > 0 || travel.return.length > 0) && (
              <div className="border border-[#E2DDD5] bg-white">
                <h2 className="px-5 py-4 border-b border-[#E2DDD5] font-mono font-normal text-[11px] tracking-[0.14em] text-[#5B6A73]">FLIGHTS</h2>
                <div className="px-5 py-4 flex flex-col gap-4">
                  {legsBlock('Getting there', travel.outbound)}
                  {legsBlock('Getting home', travel.return)}
                </div>
              </div>
            )}
            {t.description && (
              <div className="border-t border-[#13212B] pt-4">
                <h2 className="font-mono font-normal text-[11px] tracking-[0.14em] text-[#5B6A73] mb-2.5">OVERALL COMMENTS</h2>
                <p className="font-serif text-[19px] leading-relaxed text-[#2A3A44] whitespace-pre-line">{t.description}</p>
              </div>
            )}
            {allPlaces.length > 0 && (
              <p className="font-mono text-xs leading-relaxed tracking-[0.03em] text-[#5B6A73] border-t border-[#E2DDD5] pt-4">
                TAP ＋ ON ANY PLACE TO SAVE IT TO YOUR SANDBOX, OR SAVE A WHOLE DAY OR CITY AT ONCE.
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function TripDetailPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TripDetailContent />
    </Suspense>
  );
}
