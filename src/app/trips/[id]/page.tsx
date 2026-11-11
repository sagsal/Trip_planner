'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Calendar, Star, User, ArrowLeft, Heart, ThumbsUp, ThumbsDown, Copy, Plus, X, ExternalLink } from 'lucide-react';
import { placeFields, linkLabel, isRental } from '@/lib/placeDetails';
import { cleanLegs, cleanArrival, parseJson, routeText, modeInfo } from '@/lib/travel';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchTrip } from '@/utils/api';

interface Trip {
  id: string;
  title: string;
  coverImageUrl?: string | null;
  travelInfo?: string | null;
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

// One hotel / restaurant / activity: photo, name, address, rating, the traveller's review and a link
function PlaceCard({ place }: { place: { name: string; location?: string; rating?: number | null; review?: string | null; liked?: boolean | null; imageUrl?: string | null; webUrl?: string | null; stayType?: string | null } }) {
  const details = placeFields(place);
  const rating = Number(place.rating) || 0;
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {details.imageUrl && (
          <img
            src={details.imageUrl}
            alt={place.name}
            loading="lazy"
            className="w-full sm:w-48 h-40 sm:h-auto object-cover shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div className="p-4 flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-lg font-semibold text-gray-900">
                {place.name}
                {isRental(place) && (
                  <span className="ml-2 align-middle text-xs font-medium bg-[#E3ECEF] text-[#3F5B6A] px-2 py-0.5 rounded-full">🏠 Rental</span>
                )}
              </h4>
              {place.location && <p className="text-gray-600 text-sm">{place.location}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {rating > 0 && (
                <span className="flex items-center" title={`${rating} out of 5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`w-4 h-4 ${n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </span>
              )}
              {place.liked === true && <ThumbsUp className="w-4 h-4 text-green-600" />}
              {place.liked === false && <ThumbsDown className="w-4 h-4 text-red-500" />}
            </div>
          </div>
          {details.review && (
            <p className="mt-2 text-gray-700 text-sm leading-relaxed whitespace-pre-line">{details.review}</p>
          )}
          {details.webUrl && (
            <a
              href={details.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center text-sm text-[#3F5B6A] hover:text-[#2F4A5C] underline"
            >
              {linkLabel(details.webUrl)}
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          )}
        </div>
      </div>
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
      <div className="min-h-screen bg-gray-50 pt-16">
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
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link
            href="/trips"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Trips
          </Link>
          
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
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
                className="inline-flex items-center px-6 py-3 bg-[#0160D6] text-white rounded-lg hover:bg-[#0160D6]/90 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse All Trips
              </Link>
              <Link
                href="/trips/build"
                className="inline-flex items-center px-6 py-3 bg-[#AAB624] text-white rounded-lg hover:bg-[#AAB624]/90 transition-colors"
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

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/trips"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to All Trips
        </Link>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border-2 border-green-300 text-green-800 px-6 py-4 rounded-lg mb-6 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-semibold">{success}</p>
                  {selectedDraft && (
                    <Link
                      href={`/trips/build/${selectedDraft}`}
                      className="text-sm text-green-700 hover:text-green-900 underline mt-1 inline-block"
                    >
                      View your draft trip →
                    </Link>
                  )}
                </div>
              </div>
              <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800 ml-4">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Trip Header */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8 overflow-hidden">
            {trip.coverImageUrl && (
              <img
                src={trip.coverImageUrl}
                alt={trip.title}
                className="-mx-8 -mt-8 mb-6 w-[calc(100%+4rem)] max-w-none h-64 sm:h-80 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{trip.title}</h1>
                <div className="flex items-center text-gray-600 mb-4">
                  <User className="w-5 h-5 mr-2" />
                  <span>By {trip.user.name}</span>
                </div>
              </div>
            </div>

            {trip.description && (
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">{trip.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center text-gray-600 mb-2">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span className="font-medium">Travel Dates</span>
                </div>
                <p className="text-gray-900">
                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                </p>
              </div>
              <div>
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span className="font-medium">Destinations</span>
                </div>
                <p className="text-gray-900">
                  {parseCountries(trip.countries).join(', ')}
                </p>
                <p className="text-gray-600 text-sm">
                  {parseCities(trip.cities).join(', ')}
                </p>
              </div>
            </div>

            {/* Getting there: flights */}
            {(() => {
              const legs = cleanLegs(parseJson(trip.travelInfo, []));
              if (legs.length === 0) return null;
              return (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center text-gray-600 mb-2">
                    <span className="mr-2">✈️</span>
                    <span className="font-medium">Getting there</span>
                  </div>
                  {routeText(legs) && <p className="text-gray-900 font-semibold mb-2">{routeText(legs)}</p>}
                  <ul className="space-y-1 text-sm text-gray-700">
                    {legs.map((l, i) => (
                      <li key={i}>
                        <span className="font-medium">{[l.from, l.to].filter(Boolean).join(' → ')}</span>
                        {l.airline && <span> · {l.airline}</span>}
                        {l.flightNumber && <span className="text-gray-500"> · {l.flightNumber}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>

          {/* Cities, day by day */}
          {trip.cities_data && trip.cities_data.length > 0 && (
            <div className="space-y-8">
              {trip.cities_data.map((city) => {
                // Group restaurants and activities by the day they were entered on
                const dayNumbers = new Set<number>();
                city.restaurants.forEach((r) => r.dayNumber && dayNumbers.add(r.dayNumber));
                city.activities.forEach((a) => a.dayNumber && dayNumbers.add(a.dayNumber));
                const days = Array.from(dayNumbers).sort((a, b) => a - b);
                const noDayRestaurants = city.restaurants.filter((r) => !r.dayNumber);
                const noDayActivities = city.activities.filter((a) => !a.dayNumber);
                const totalDays = Math.max(city.numberOfDays || 0, days.length ? days[days.length - 1] : 0);

                return (
                  <div key={city.id} className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">{city.name}</h2>
                      <p className="text-gray-600">
                        {city.country}
                        {totalDays > 0 && ` · ${totalDays} ${totalDays === 1 ? 'day' : 'days'}`}
                      </p>
                      {(() => {
                        const a = cleanArrival(parseJson(city.arrival, null));
                        if (!a || !a.mode) return null;
                        const m = modeInfo(a.mode);
                        return (
                          <div className="mt-3 rounded-lg bg-[#F3F7F8] border border-[#C9D9DF] px-3 py-2 text-sm text-[#2F4A5C]">
                            <span className="font-medium">
                              {m?.icon} Arrived by {m?.label.toLowerCase()}
                              {a.from && ` from ${a.from}`}
                            </span>
                            {a.operator && <span> · {a.operator}</span>}
                            {a.details && <p className="mt-1 text-[#3F5B6A] whitespace-pre-line">{a.details}</p>}
                          </div>
                        );
                      })()}
                    </div>

                    {city.hotels.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">🏨 Where we stayed</h3>
                        <div className="space-y-4">
                          {city.hotels.map((hotel) => (
                            <PlaceCard key={hotel.id} place={hotel} />
                          ))}
                        </div>
                      </div>
                    )}

                    {days.map((dayNumber) => {
                      const rs = city.restaurants.filter((r) => r.dayNumber === dayNumber);
                      const as = city.activities.filter((a) => a.dayNumber === dayNumber);
                      return (
                        <div key={dayNumber} className="mb-8 last:mb-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Day {dayNumber}</h3>
                          {as.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-500 mb-2">🎯 Activities</p>
                              <div className="space-y-4">
                                {as.map((a) => <PlaceCard key={a.id} place={a} />)}
                              </div>
                            </div>
                          )}
                          {rs.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-500 mb-2">🍽️ Restaurants</p>
                              <div className="space-y-4">
                                {rs.map((r) => <PlaceCard key={r.id} place={r} />)}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {(noDayActivities.length > 0 || noDayRestaurants.length > 0) && (
                      <div className="mb-2">
                        {days.length > 0 && (
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">Also in {city.name}</h3>
                        )}
                        {noDayActivities.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-500 mb-2">🎯 Activities</p>
                            <div className="space-y-4">
                              {noDayActivities.map((a) => <PlaceCard key={a.id} place={a} />)}
                            </div>
                          </div>
                        )}
                        {noDayRestaurants.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-500 mb-2">🍽️ Restaurants</p>
                            <div className="space-y-4">
                              {noDayRestaurants.map((r) => <PlaceCard key={r.id} place={r} />)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </motion.div>
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
