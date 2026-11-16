'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Calendar, Star, User, ArrowLeft, Heart, ThumbsUp, ThumbsDown, Copy, Plus, X, ExternalLink } from 'lucide-react';
import { placeFields, linkLabel, isRental } from '@/lib/placeDetails';
import { cleanArrival, cleanTravel, parseJson, routeText, modeInfo, type FlightLeg } from '@/lib/travel';
import { tripTypeIcon } from '@/lib/regions';
import SaveToSandbox from '@/components/SaveToSandbox';
import GoogleReviews from '@/components/GoogleReviews';
import ShareTrip from '@/components/ShareTrip';
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

// One hotel / restaurant / activity: photo, name, address, rating, the traveller's review and a link
function PlaceCard({ place, kind, save }: { place: { name: string; location?: string; rating?: number | null; review?: string | null; liked?: boolean | null; imageUrl?: string | null; webUrl?: string | null; stayType?: string | null }; kind: Kind; save?: PlaceToSave }) {
  const details = placeFields(place);
  const rating = Number(place.rating) || 0;
  const [imgOk, setImgOk] = useState(true);
  return (
    <div className="bg-white border border-[#ECE7DF] rounded-2xl overflow-hidden flex flex-row">
      {details.imageUrl && imgOk && (
        <img
          src={details.imageUrl}
          alt=""
          loading="lazy"
          className="w-20 h-20 m-3 mr-0 rounded-xl sm:m-0 sm:rounded-none sm:w-44 sm:h-auto sm:min-h-[132px] object-cover shrink-0 bg-[#F1EEE8]"
          onError={() => setImgOk(false)}
        />
      )}
      <div className="p-3 sm:p-4 flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-[#5B6A73]">
              {isRental(place) ? 'Rental' : KIND_LABEL[kind]}
            </p>
            <h4 className="text-[17px] font-bold text-[#13212B] leading-snug">{place.name}</h4>
            {place.location && <p className="text-[#5B6A73] text-sm mt-0.5 line-clamp-1">{place.location}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {place.liked === true && <ThumbsUp className="w-4 h-4 text-[#2F7A4F]" aria-label="Liked" />}
            {place.liked === false && <ThumbsDown className="w-4 h-4 text-[#B4532A]" aria-label="Didn’t like" />}
            {save && <SaveToSandbox places={[save]} />}
          </div>
        </div>
        {rating > 0 && (
          <span className="flex items-center" title={`${rating} out of 5`} aria-label={`${rating} out of 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className={`w-4 h-4 ${n <= rating ? 'text-[#E0A526] fill-[#E0A526]' : 'text-[#D9D4CC]'}`} />
            ))}
          </span>
        )}
        {details.review && <p className="text-[#3D4C56] text-sm leading-relaxed whitespace-pre-line">{details.review}</p>}
        {details.webUrl && (
          <a
            href={details.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center self-start text-sm font-semibold text-[#1F6F78] hover:text-[#16535A]"
          >
            {linkLabel(details.webUrl)}
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </a>
        )}
        {!isRental(place) && (
          <GoogleReviews name={place.name} location={place.location} city={save?.city} country={save?.country} kind={kind} />
        )}
      </div>
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
      sourceUserName: trip.user?.name || null,
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
    <div className="flex flex-col gap-5">
      {showHeader && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[28px] font-extrabold tracking-tight text-[#13212B]">{city.name}</h2>
            <p className="text-[#5B6A73]">
              {city.country}
              {totalDays > 0 && ` · ${totalDays} ${totalDays === 1 ? 'day' : 'days'}`}
            </p>
          </div>
          {cityPlaces.length > 1 && <SaveToSandbox places={cityPlaces} label="Save this city" variant="pill" />}
        </div>
      )}
      {arrival && m && (
        <div className="rounded-xl bg-[#F1F6F6] border border-[#D4E5E6] px-4 py-2.5 text-sm text-[#16535A]">
          <span className="font-semibold">
            {m.icon} Arrived by {m.label.toLowerCase()}
            {arrival.from && ` from ${arrival.from}`}
          </span>
          {arrival.operator && <span> · {arrival.operator}</span>}
          {arrival.details && <p className="mt-1 whitespace-pre-line">{arrival.details}</p>}
        </div>
      )}

      {pills.length > 2 && (
        <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
          {pills.map((x) => (
            <button
              key={x.k}
              type="button"
              aria-pressed={kind === x.k}
              onClick={() => setKind(x.k)}
              className={`px-3.5 py-2 rounded-full border text-sm min-h-[40px] ${
                kind === x.k ? 'bg-[#13212B] border-[#13212B] text-white font-semibold' : 'bg-white border-[#E2DCD2] text-[#3D4C56] hover:bg-[#F6F3EE]'
              }`}
            >
              {x.label} <span className={kind === x.k ? 'text-white/70' : 'text-[#8A969D]'}>{x.n}</span>
            </button>
          ))}
        </div>
      )}

      {kind !== 'all' ? (
        <div className="grid grid-cols-1 gap-3">
          {list(kind).map((p: any) => (
            <div key={p.id} className="flex flex-col gap-1">
              {p.dayNumber ? <span className="text-xs font-semibold text-[#5B6A73]">Day {p.dayNumber}</span> : null}
              <PlaceCard place={p} kind={kind} save={toSave(p, kind)} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {city.hotels.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-[#13212B] mb-3">Where we stayed</h3>
              <div className="grid grid-cols-1 gap-3">
                {city.hotels.map((h) => <PlaceCard key={h.id} place={h} kind="hotel" save={toSave(h, 'hotel')} />)}
              </div>
            </div>
          )}

          {days.length > 0 && (
            <div className="flex flex-col">
              {days.map((dayNumber, idx) => {
                const items = [
                  ...city.activities.filter((a) => a.dayNumber === dayNumber).map((a) => ({ p: a, k: 'activity' as Kind })),
                  ...city.restaurants.filter((r) => r.dayNumber === dayNumber).map((r) => ({ p: r, k: 'restaurant' as Kind })),
                ];
                const last = idx === days.length - 1 && noDay.length === 0;
                return (
                  <div key={dayNumber} className="flex gap-4 sm:gap-5">
                    <div className="hidden sm:flex flex-col items-center shrink-0">
                      <span className="w-11 h-11 rounded-full bg-[#1F6F78] text-white flex items-center justify-center font-extrabold">{dayNumber}</span>
                      {!last && <span className="flex-1 w-0.5 bg-[#E2DCD2] mt-1.5" />}
                    </div>
                    <div className={`flex-1 min-w-0 ${last ? '' : 'pb-6 sm:pb-8'} flex flex-col gap-3`}>
                      <div className="flex flex-wrap items-center justify-between gap-2 min-h-[44px]">
                        <h3 className="text-xl font-extrabold text-[#13212B] flex items-center gap-2.5">
                          <span className="sm:hidden w-8 h-8 rounded-full bg-[#1F6F78] text-white text-sm flex items-center justify-center font-extrabold">{dayNumber}</span>
                          Day {dayNumber}
                        </h3>
                        {items.length > 1 && (
                          <SaveToSandbox places={items.map(({ p, k }) => toSave(p, k))} label="Save this day" variant="pill" />
                        )}
                      </div>
                      {items.map(({ p, k }) => <PlaceCard key={`${k}-${p.id}`} place={p} kind={k} save={toSave(p, k)} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {noDay.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-[#13212B] mb-3">{days.length > 0 ? `Also in ${city.name}` : 'Places'}</h3>
              <div className="grid grid-cols-1 gap-3">
                {noDay.map(({ p, k }) => <PlaceCard key={`${k}-${p.id}`} place={p} kind={k} save={toSave(p, k)} />)}
              </div>
            </div>
          )}
        </>
      )}
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
      <div className="min-h-screen bg-[#FBFAF7] pt-16">
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
      <div className="min-h-screen bg-[#FBFAF7] pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link
            href="/trips"
            className="inline-flex items-center font-semibold text-[#1F6F78] hover:text-[#16535A] mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Trips
          </Link>
          
          <div className="bg-white border border-[#ECE7DF] rounded-[20px] p-8 text-center">
            <div className="mb-6">
              <span className="text-6xl">🔍</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Trip Not Found</h1>
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
                className="inline-flex items-center px-6 py-3 bg-white border border-[#E2DCD2] text-[#13212B] rounded-xl hover:bg-[#F6F3EE] transition-colors"
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
  const daysTotal =
    cities.reduce((n, c) => n + (c.numberOfDays || 0), 0) ||
    (t.startDate && t.endDate ? Math.max(1, Math.round((new Date(t.endDate).getTime() - new Date(t.startDate).getTime()) / 86400000) + 1) : 0);
  const allPlaces: PlaceToSave[] = cities.flatMap((c) => {
    const mk = (p: any, kind: Kind): PlaceToSave => {
      const f = placeFields(p);
      return {
        kind, name: p.name, location: p.location || null, city: c.name, country: c.country,
        imageUrl: f.imageUrl, webUrl: f.webUrl, stayType: p.stayType || null,
        sourceTripId: t.id, sourceTripTitle: t.title, sourceUserName: t.user?.name || null,
        sourceRating: p.rating || null, sourceReview: f.review || null,
      };
    };
    return [...c.hotels.map((h) => mk(h, 'hotel')), ...c.activities.map((a) => mk(a, 'activity')), ...c.restaurants.map((r) => mk(r, 'restaurant'))];
  });
  const byline = [
    t.startDate && t.endDate ? `${formatDate(t.startDate)} – ${formatDate(t.endDate)}` : '',
    daysTotal ? `${daysTotal} ${daysTotal === 1 ? 'day' : 'days'}` : '',
    multi ? `${cities.length} cities` : '',
    t.user?.name ? `by ${t.user.name}` : '',
  ].filter(Boolean).join(' · ');
  const chips = (light: boolean) => (
    <div className="flex flex-wrap gap-2">
      {t.tripType && (
        <span className={`px-3 py-1.5 rounded-full text-[13px] font-semibold ${light ? 'bg-white text-[#13212B]' : 'bg-[#E3F0F0] text-[#16535A]'}`}>
          {tripTypeIcon(t.tripType)} {t.tripType}
        </span>
      )}
      {t.region && (
        <span className={`px-3 py-1.5 rounded-full text-[13px] font-semibold ${light ? 'bg-white/20 text-white' : 'bg-[#F1EEE8] text-[#3D4C56]'}`}>{t.region}</span>
      )}
    </div>
  );
  const legsBlock = (title: string, legs: FlightLeg[]) =>
    legs.length > 0 && (
      <div className="text-sm">
        <p className="text-[#5B6A73] mb-1">{title}</p>
        {routeText(legs) && <p className="font-semibold text-[#13212B]">{routeText(legs)}</p>}
        <ul className="mt-1 space-y-0.5 text-[#3D4C56]">
          {legs.map((l, i) => (
            <li key={i}>
              {[l.from, l.to].filter(Boolean).join(' → ')}
              {l.airline && <span> · {l.airline}</span>}
              {l.flightNumber && <span className="text-[#8A969D]"> · {l.flightNumber}</span>}
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#13212B] pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Link href="/trips" className="inline-flex items-center font-semibold text-[#1F6F78] hover:text-[#16535A] mb-4">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> All trips
        </Link>

        {success && (
          <div className="bg-[#E3F0F0] border border-[#C3DEDF] text-[#16535A] px-5 py-3 rounded-xl mb-5 flex items-center justify-between">
            <p className="font-semibold">{success}</p>
            <button onClick={() => setSuccess(null)} aria-label="Close" className="ml-4"><X className="w-5 h-5" /></button>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} aria-label="Close"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Cover with the title on it */}
        {t.coverImageUrl && coverOk ? (
          <div className="relative h-[340px] sm:h-[400px] rounded-[24px] sm:rounded-[28px] overflow-hidden bg-[#D9C7AF]">
            <img src={t.coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={() => setCoverOk(false)} />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 bg-[rgba(19,33,43,0.58)] flex flex-wrap items-end justify-between gap-3 sm:gap-4">
              <div className="flex flex-col gap-2 min-w-0">
                {chips(true)}
                <h1 className="text-[28px] leading-tight sm:text-5xl font-extrabold tracking-tight text-white">{t.title}</h1>
                {byline && <p className="text-sm sm:text-base text-[#F1EEE8]">{byline}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {t.isPublic && <ShareTrip title={t.title} />}
                {allPlaces.length > 0 && (
                  <div className="bg-white rounded-xl"><SaveToSandbox places={allPlaces} label="Save trip" variant="pill" /></div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#ECE7DF] rounded-[28px] p-6 sm:p-8 flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-2 min-w-0">
              {chips(false)}
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{t.title}</h1>
              {byline && <p className="text-[#5B6A73]">{byline}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {t.isPublic && <ShareTrip title={t.title} />}
              {allPlaces.length > 0 && <SaveToSandbox places={allPlaces} label="Save trip" variant="pill" />}
            </div>
          </div>
        )}

        {/* Route between cities */}
        {multi && (
          <div className="mt-5 bg-white border border-[#ECE7DF] rounded-[20px] px-5 py-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <span className="font-bold text-[#5B6A73]">Route</span>
            {cities.map((c, i) => {
              const a = cleanArrival(parseJson(c.arrival, null));
              const mi = a?.mode ? modeInfo(a.mode) : null;
              return (
                <span key={c.id} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden className="text-[#A9B3B9]">→{mi ? ` ${mi.icon} →` : ''}</span>}
                  <button type="button" onClick={() => setActiveCityId(c.id)} className="font-bold text-[#13212B] hover:text-[#1F6F78] underline-offset-2 hover:underline">
                    {c.name}
                  </button>
                  {c.numberOfDays ? <span className="text-[#8A969D]">{c.numberOfDays} {c.numberOfDays === 1 ? 'day' : 'days'}</span> : null}
                </span>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-8 items-start pb-16">
          {/* The trip itself */}
          <div className="flex-[999_1_560px] min-w-0">
            {multi && active && (
              <div role="tablist" aria-label="Cities" className="flex flex-wrap gap-1 border-b border-[#E2DCD2] mb-6">
                {cities.map((c) => {
                  const on = c.id === active.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => setActiveCityId(c.id)}
                      className={`px-4 min-h-[48px] -mb-px border-b-[3px] text-[15px] ${on ? 'border-[#1F6F78] text-[#13212B] font-bold' : 'border-transparent text-[#5B6A73] hover:text-[#13212B]'}`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}
            {active ? (
              <CityView city={active} trip={t} showHeader={multi} />
            ) : (
              <p className="text-[#5B6A73]">No places added to this trip yet.</p>
            )}
          </div>

          {/* At a glance */}
          <aside className="flex-[1_1_300px] min-w-0 flex flex-col gap-4">
            <div className="bg-white border border-[#ECE7DF] rounded-[20px] p-5 flex flex-col gap-4">
              <h2 className="text-[17px] font-extrabold">Trip at a glance</h2>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                {[['stays', counts.stays], ['eats', counts.eats], ['to do', counts.todo]].map(([label, n]) => (
                  <div key={label as string} className="bg-[#F6F3EE] rounded-xl py-3 px-1.5">
                    <div className="text-xl font-extrabold">{n}</div>
                    <div className="text-xs text-[#5B6A73]">{label}</div>
                  </div>
                ))}
              </div>
              <div className="text-sm flex flex-col gap-1.5">
                <div className="flex justify-between gap-3"><span className="text-[#5B6A73]">Where</span><span className="text-right">{parseCountries(t.countries).join(', ')}</span></div>
                {daysTotal > 0 && <div className="flex justify-between gap-3"><span className="text-[#5B6A73]">Length</span><span>{daysTotal} {daysTotal === 1 ? 'day' : 'days'}</span></div>}
              </div>
              {(travel.outbound.length > 0 || travel.return.length > 0) && (
                <div className="pt-3 border-t border-[#ECE7DF] flex flex-col gap-3">
                  {legsBlock('Getting there', travel.outbound)}
                  {legsBlock('Getting home', travel.return)}
                </div>
              )}
            </div>
            {t.description && (
              <div className="bg-white border border-[#ECE7DF] rounded-[20px] p-5">
                <h2 className="text-[17px] font-extrabold mb-2">Overall comments</h2>
                <p className="text-[15px] leading-relaxed text-[#3D4C56] whitespace-pre-line">{t.description}</p>
              </div>
            )}
            {allPlaces.length > 0 && (
              <div className="bg-[#F1F6F6] border border-[#D4E5E6] rounded-[20px] p-5 text-sm text-[#16535A]">
                Tap <b>＋</b> on any place to save it to your Sandbox, or save a whole day or city at once.
              </div>
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
