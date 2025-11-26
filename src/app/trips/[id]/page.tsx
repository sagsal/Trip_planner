'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Calendar, Star, User, ArrowLeft, Heart, ThumbsUp, ThumbsDown, Copy, Plus, X } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchTrip } from '@/utils/api';

interface Trip {
  id: string;
  title: string;
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

        {/* Save to Draft Options - Only show if user is logged in */}
        {mounted && !user && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-8 shadow-md">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="font-semibold text-yellow-800 mb-1">Want to save items to your draft trip?</p>
                <p className="text-sm text-yellow-700">
                  <Link href="/login" className="underline font-medium">Log in</Link> or <Link href="/register" className="underline font-medium">create an account</Link> to save hotels, restaurants, and activities from this trip to your draft trips.
                </p>
              </div>
            </div>
          </div>
        )}
        {mounted && user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6 mb-8 shadow-md"
          >
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💡</span>
                <h3 className="text-xl font-bold text-gray-900">Save Items to Your Draft Trip</h3>
              </div>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 p-5 mb-4 rounded-lg">
                <p className="text-base text-gray-900 font-bold mb-3 flex items-center">
                  <span className="text-2xl mr-2">💡</span>
                  How to Save Items to Your Draft Trip:
                </p>
                <ol className="text-sm text-gray-800 list-decimal list-inside space-y-2 ml-2">
                  <li><strong className="text-green-700">Check the boxes</strong> next to hotels, restaurants, or activities you want to save (you can select multiple items)</li>
                  <li>Select your <strong className="text-blue-700">draft trip</strong> from the dropdown below</li>
                  <li>Select a <strong className="text-blue-700">city</strong> in your draft (and a <strong className="text-blue-700">day</strong> if you selected restaurants/activities)</li>
                  <li>Click <strong className="text-green-700">"Save X Selected"</strong> button to save all selected items at once!</li>
                </ol>
                <p className="text-sm text-gray-700 mt-3 italic">
                  ✨ <strong>Tip:</strong> You can select items first, then choose where to save them. The save button will guide you if anything is missing!
                </p>
              </div>
            </div>

            <div className="space-y-4">
                {draftTrips.length === 0 ? (
                  <div className="bg-white rounded-lg p-6 border-2 border-yellow-300 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">📝</span>
                      <div>
                        <p className="text-gray-800 font-semibold mb-1">You don't have any draft trips yet.</p>
                        <p className="text-gray-600 text-sm">Create a draft trip first to start saving items from shared trips!</p>
                      </div>
                    </div>
                    <Link
                      href="/trips/build"
                      className="inline-flex items-center px-6 py-3 bg-[#AAB624] text-white rounded-lg hover:bg-[#AAB624]/90 transition-colors text-sm font-semibold shadow-md"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Draft Trip
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-lg p-6 border-2 border-blue-300 shadow-lg">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <span className="text-2xl mr-2">📋</span>
                        Select Your Draft Trip & City
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            📋 Select Draft Trip *
                            {selectedDraft && <span className="ml-2 text-green-600">✓ Selected</span>}
                          </label>
                          <select
                            value={selectedDraft || ''}
                            onChange={(e) => {
                              const draftId = e.target.value || null;
                              console.log('🔄 Draft dropdown changed:', draftId, 'Total drafts:', draftTrips.length);
                              console.log('🔄 Available drafts:', draftTrips.map(d => ({ id: d.id, title: d.title })));
                              if (draftId) {
                                console.log('✅ Setting selected draft to:', draftId);
                                setSelectedDraft(draftId);
                                setSelectedCity(null);
                                setSelectedDay(null);
                                setSelectedItems({ hotels: new Set(), restaurants: new Set(), activities: new Set() });
                              } else {
                                console.log('❌ Clearing draft selection');
                                setSelectedDraft(null);
                                setSelectedCity(null);
                                setSelectedDay(null);
                                setSelectedItems({ hotels: new Set(), restaurants: new Set(), activities: new Set() });
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium cursor-pointer hover:border-blue-400 transition-colors"
                            style={{ pointerEvents: 'auto', zIndex: 10 }}
                          >
                            <option value="">Choose a draft trip...</option>
                            {draftTrips.length > 0 ? (
                              draftTrips.map(draft => (
                                <option key={draft.id} value={draft.id}>{draft.title}</option>
                              ))
                            ) : (
                              <option value="" disabled>No draft trips available</option>
                            )}
                          </select>
                        </div>
                        {selectedDraft && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                              🏙️ Select City *
                              {selectedCity && <span className="ml-2 text-green-600">✓ Selected</span>}
                            </label>
                            <select
                              value={selectedCity || ''}
                              onChange={(e) => {
                                const cityId = e.target.value || null;
                                console.log('🔄 City dropdown changed:', cityId);
                                const selectedDraftData = draftTrips.find(d => d.id === selectedDraft);
                                console.log('🔄 Available cities for selected draft:', selectedDraftData?.citiesData);
                                if (cityId) {
                                  console.log('✅ Setting selected city to:', cityId);
                                  setSelectedCity(cityId);
                                  setSelectedDay(null);
                                  setSelectedItems({ hotels: new Set(), restaurants: new Set(), activities: new Set() });
                                } else {
                                  console.log('❌ Clearing city selection');
                                  setSelectedCity(null);
                                  setSelectedDay(null);
                                  setSelectedItems({ hotels: new Set(), restaurants: new Set(), activities: new Set() });
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium cursor-pointer hover:border-blue-400 transition-colors"
                              style={{ pointerEvents: 'auto', zIndex: 10 }}
                            >
                              <option value="">Choose a city...</option>
                              {(() => {
                                const selectedDraftData = draftTrips.find(d => d.id === selectedDraft);
                                const cities = selectedDraftData?.citiesData || [];
                                console.log('Available cities for draft:', cities.length);
                                return cities.length > 0 ? (
                                  cities.map(city => (
                                    <option key={city.id} value={city.id}>{city.name}, {city.country}</option>
                                  ))
                                ) : (
                                  <option value="" disabled>No cities in this draft</option>
                                );
                              })()}
                            </select>
                          </div>
                        )}
                        {selectedCity && selectedDraft && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                              📅 Select Day (for restaurants/activities)
                              {selectedDay && <span className="ml-2 text-green-600">✓ Selected</span>}
                            </label>
                            <select
                              value={selectedDay || ''}
                              onChange={(e) => {
                                const dayId = e.target.value || null;
                                console.log('Day dropdown changed:', dayId);
                                setSelectedDay(dayId);
                                setSelectedItems({ hotels: new Set(), restaurants: new Set(), activities: new Set() });
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium cursor-pointer hover:border-blue-400 transition-colors"
                              style={{ pointerEvents: 'auto', zIndex: 10 }}
                            >
                              <option value="">Choose a day...</option>
                              {(() => {
                                const selectedDraftData = draftTrips.find(d => d.id === selectedDraft);
                                const selectedCityData = selectedDraftData?.citiesData.find(c => c.id === selectedCity);
                                const days = selectedCityData?.days || [];
                                console.log('Available days for city:', days.length);
                                return days.length > 0 ? (
                                  days.map(day => (
                                    <option key={day.id} value={day.id}>Day {day.dayNumber}</option>
                                  ))
                                ) : (
                                  <option value="" disabled>No days available</option>
                                );
                              })()}
                            </select>
                          </div>
                        )}
                      </div>
                      {/* Status indicator */}
                      {(selectedDraft || selectedCity || selectedDay) && (
                        <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                          <p className="text-sm font-semibold text-green-800 mb-2">✓ Selection Status:</p>
                          <ul className="text-sm text-green-700 space-y-1">
                            <li>{selectedDraft ? '✓ Draft trip selected' : '✗ No draft trip selected'}</li>
                            <li>{selectedCity ? '✓ City selected' : '✗ No city selected'}</li>
                            <li>{selectedDay ? '✓ Day selected (ready for restaurants/activities)' : '✗ No day selected (needed for restaurants/activities)'}</li>
                          </ul>
                          {selectedDraft && selectedCity && totalSelected > 0 && (
                            <p className="mt-3 text-sm font-bold text-green-800">
                              🎉 Ready to save! Click "Save X Selected" above to save all your selected items.
                            </p>
                          )}
                          {selectedDraft && selectedCity && totalSelected === 0 && (
                            <p className="mt-3 text-sm font-bold text-blue-800">
                              💡 Select items below using checkboxes, then click "Save X Selected" to save them.
                            </p>
                          )}
                        </div>
                      )}
                      {/* Debug info - remove in production */}
                      <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                        <p><strong>Debug:</strong> Drafts loaded: {draftTrips.length} | Selected Draft: {selectedDraft || 'none'} | Selected City: {selectedCity || 'none'} | Selected Day: {selectedDay || 'none'}</p>
                        {selectedDraft && (
                          <p className="mt-1">Draft cities: {draftTrips.find(d => d.id === selectedDraft)?.citiesData.length || 0}</p>
                        )}
                        {selectedCity && selectedDraft && (
                          <p className="mt-1">City days: {draftTrips.find(d => d.id === selectedDraft)?.citiesData.find(c => c.id === selectedCity)?.days.length || 0}</p>
                        )}
                      </div>
                    </div>
                      {totalSelected > 0 && (
                      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <span className="text-2xl">✅</span>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-green-800 mb-1">
                                {totalSelected} item{totalSelected !== 1 ? 's' : ''} selected
                              </p>
                              <div className="text-sm text-green-700 space-y-1">
                                {!selectedDraft && (
                                  <p>⚠️ Please select a draft trip above</p>
                                )}
                                {selectedDraft && !selectedCity && (
                                  <p>⚠️ Please select a city above</p>
                                )}
                                {selectedDraft && selectedCity && selectedItems.restaurants.size > 0 && !selectedDay && (
                                  <p>⚠️ Please select a day above (required for restaurants)</p>
                                )}
                                {selectedDraft && selectedCity && selectedItems.activities.size > 0 && !selectedDay && (
                                  <p>⚠️ Please select a day above (required for activities)</p>
                                )}
                                {selectedDraft && selectedCity && (selectedDay || selectedItems.hotels.size > 0) && (
                                  <p className="font-semibold">✓ Ready to save! Click the button to save all selected items.</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (handleCopySelected && typeof handleCopySelected === 'function') {
                                handleCopySelected();
                              }
                            }}
                            disabled={!selectedDraft || !selectedCity || (selectedItems.restaurants.size > 0 && !selectedDay) || (selectedItems.activities.size > 0 && !selectedDay)}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-base font-semibold transition-colors flex items-center shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-md whitespace-nowrap"
                          >
                            <Copy className="w-5 h-5 mr-2" />
                            Save {totalSelected} Selected
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Trip Header */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
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
          </div>

          {/* Cities and their details */}
          {trip.cities_data && trip.cities_data.length > 0 && (
            <div className="space-y-8">
              {trip.cities_data.map((city) => (
                <div key={city.id} className="bg-white rounded-lg shadow-lg p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{city.name}</h2>
                    <p className="text-gray-600">{city.country}</p>
                  </div>

                  {/* Hotels for this city */}
                  {city.hotels.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">🏨 Hotels</h3>
                      <div className="space-y-4">
                        {city.hotels.map((hotel) => {
                          const hotelId = hotel.id || `${city.id}-hotel-${hotel.name || 'unnamed'}`;
                          const isSelected = selectedItems.hotels.has(hotelId);
                          return (
                          <div 
                            key={hotel.id} 
                            className={`border rounded-lg p-4 transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-100 shadow-md'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center flex-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    if (toggleItemSelection && typeof toggleItemSelection === 'function') {
                                      toggleItemSelection('hotel', hotelId);
                                    }
                                  }}
                                  className="mr-3 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold text-gray-900">{hotel.name}</h4>
                                  {hotel.location && (
                                    <p className="text-gray-600 text-sm">{hotel.location}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                {hotel.rating && hotel.rating > 0 && renderStars(hotel.rating)}
                                {renderLikeButton(hotel.liked ?? null)}
                              </div>
                            </div>
                            {hotel.review && (
                              <p className="text-gray-700 text-sm leading-relaxed">{hotel.review}</p>
                            )}
                          </div>
                        );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Restaurants for this city */}
                  {city.restaurants.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">🍽️ Restaurants</h3>
                      <div className="space-y-4">
                        {city.restaurants.map((restaurant) => {
                          const restaurantId = restaurant.id || `${city.id}-restaurant-${restaurant.name || 'unnamed'}`;
                          const isSelected = selectedItems.restaurants.has(restaurantId);
                          return (
                          <div 
                            key={restaurant.id} 
                            className={`border rounded-lg p-4 transition-all ${
                              isSelected
                                ? 'border-green-500 bg-green-100 shadow-md'
                                : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center flex-1">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      if (toggleItemSelection && typeof toggleItemSelection === 'function') {
                                        toggleItemSelection('restaurant', restaurantId);
                                      }
                                    }}
                                    className="mr-3 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                                  />
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold text-gray-900">{restaurant.name}</h4>
                                  {restaurant.location && (
                                    <p className="text-gray-600 text-sm">{restaurant.location}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                {restaurant.rating && restaurant.rating > 0 && renderStars(restaurant.rating)}
                                {renderLikeButton(restaurant.liked ?? null)}
                              </div>
                            </div>
                            {restaurant.review && (
                              <p className="text-gray-700 text-sm leading-relaxed">{restaurant.review}</p>
                            )}
                          </div>
                        );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Activities for this city */}
                  {city.activities.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">🎯 Activities</h3>
                      <div className="space-y-4">
                        {city.activities.map((activity, activityIndex) => {
                          const activityId = activity.id || `${city.id || 'city'}-activity-${activityIndex}-${activity.name || 'unnamed'}`;
                          const isSelected = selectedItems.activities.has(activityId);
                          return (
                          <div 
                            key={activity.id} 
                            className={`border rounded-lg p-4 transition-all ${
                              isSelected
                                ? 'border-purple-500 bg-purple-100 shadow-md'
                                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center flex-1">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('🎯 Activity checkbox clicked:', { activityId, isSelected, activity });
                                      if (toggleItemSelection && typeof toggleItemSelection === 'function') {
                                        toggleItemSelection('activity', activityId);
                                      } else {
                                        console.error('toggleItemSelection is not a function:', typeof toggleItemSelection);
                                      }
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                    className="mr-3 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                                  />
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold text-gray-900">{activity.name}</h4>
                                  {activity.location && (
                                    <p className="text-gray-600 text-sm">{activity.location}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                {activity.rating && activity.rating > 0 && renderStars(activity.rating)}
                                {renderLikeButton(activity.liked ?? null)}
                              </div>
                            </div>
                            {activity.review && (
                              <p className="text-gray-700 text-sm leading-relaxed">{activity.review}</p>
                            )}
                          </div>
                        );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Call to Action */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Inspired by this trip?</h2>
            <p className="text-gray-600 mb-6">
              Build your own trip using ideas from this one, or share your own travel experiences with the community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/trips/build"
                className="inline-flex items-center px-8 py-4 bg-[#AAB624] text-white rounded-lg hover:bg-[#AAB624]/90 transition-colors text-lg font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Build Your Trip
              </Link>
              <Link
                href="/trips/new"
                className="inline-flex items-center px-8 py-4 bg-[#F13B13] text-white rounded-lg hover:bg-[#F13B13]/90 transition-colors text-lg font-semibold"
              >
                <Heart className="w-5 h-5 mr-2" />
                Share Your Trip
              </Link>
            </div>
          </div>
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
