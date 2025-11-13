'use client';

import { useState, useEffect, Suspense } from 'react';
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

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      loadDraftTrips();
    }
    if (params.id) {
      fetchTripData(params.id as string);
    }
  }, [params.id]);

  const fetchTripData = async (id: string) => {
    try {
      const result = await fetchTrip(id);
      if (result.data) {
        setTrip(result.data.trip);
      } else {
        setError(result.error || 'Trip not found');
      }
    } catch (error) {
      setError('Error loading trip');
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

  const loadDraftTrips = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      const response = await fetch(`/api/trips?drafts=true&userId=${user.id}`);
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
            citiesData: trip.cities_data.map((city: any) => {
              const numberOfDays = city.numberOfDays || 1;
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
      }
    } catch (err) {
      console.error('Error loading draft trips:', err);
    }
  };

  const handleCopyItem = async (itemType: 'hotel' | 'restaurant' | 'activity', item: any, targetCityId: string, targetDayId?: string) => {
    if (!selectedDraft) {
      setError('Please select a draft trip first');
      return;
    }

    try {
      setError(null);
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

      if (response.ok) {
        const successMsg = `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} "${item.name}" saved to your draft!`;
        setSuccess(successMsg);
        setTimeout(() => setSuccess(null), 5000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save item to draft');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      setError('An error occurred while saving the item');
      setTimeout(() => setError(null), 5000);
    }
  };

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

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Trip Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The trip you are looking for does not exist.'}</p>
            <Link
              href="/trips"
              className="inline-flex items-center px-6 py-3 bg-[#0160D6] text-white rounded-lg hover:bg-[#0160D6]/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Trips
            </Link>
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
        {!user && (
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
        {user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6 mb-8 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💡</span>
                  <h3 className="text-xl font-bold text-gray-900">Save Items to Your Draft Trip</h3>
                </div>
                <p className="text-sm text-gray-700 ml-8">
                  Select a draft trip, city, and day (for restaurants/activities) to save items from this trip to your draft. This is your sandbox to collect ideas!
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSaveOptions(!showSaveOptions);
                  if (!showSaveOptions) {
                    loadDraftTrips();
                  }
                }}
                className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
              >
                {showSaveOptions ? 'Hide' : 'Show'} Options
              </button>
            </div>

            {showSaveOptions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 mt-4"
              >
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
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            📋 Select Draft Trip *
                          </label>
                          <select
                            value={selectedDraft || ''}
                            onChange={(e) => {
                              setSelectedDraft(e.target.value);
                              setSelectedCity(null);
                              setSelectedDay(null);
                            }}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
                          >
                            <option value="">Choose a draft trip...</option>
                            {draftTrips.map(draft => (
                              <option key={draft.id} value={draft.id}>{draft.title}</option>
                            ))}
                          </select>
                        </div>
                        {selectedDraft && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                              🏙️ Select City *
                            </label>
                            <select
                              value={selectedCity || ''}
                              onChange={(e) => {
                                setSelectedCity(e.target.value);
                                setSelectedDay(null);
                              }}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
                            >
                              <option value="">Choose a city...</option>
                              {draftTrips.find(d => d.id === selectedDraft)?.citiesData.map(city => (
                                <option key={city.id} value={city.id}>{city.name}, {city.country}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {selectedCity && selectedDraft && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                              📅 Select Day (for restaurants/activities)
                            </label>
                            <select
                              value={selectedDay || ''}
                              onChange={(e) => setSelectedDay(e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
                            >
                              <option value="">Choose a day...</option>
                              {draftTrips.find(d => d.id === selectedDraft)?.citiesData.find(c => c.id === selectedCity)?.days.map(day => (
                                <option key={day.id} value={day.id}>Day {day.dayNumber}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedDraft && (
                      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">✅</span>
                          <div>
                            <p className="text-sm font-semibold text-green-800 mb-1">Ready to save!</p>
                            <p className="text-sm text-green-700">
                              Click on any hotel, restaurant, or activity below to save it to your draft trip.
                              {selectedCity && selectedDay && ' Restaurants and activities will be saved to the selected day.'}
                              {selectedCity && !selectedDay && ' Select a day to save restaurants and activities.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
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
                        {city.hotels.map((hotel) => (
                          <div 
                            key={hotel.id} 
                            className={`border rounded-lg p-4 transition-all ${
                              selectedDraft && selectedCity
                                ? 'border-blue-300 bg-blue-50 hover:bg-blue-100 cursor-pointer'
                                : 'border-gray-200'
                            }`}
                            onClick={() => {
                              if (selectedDraft && selectedCity) {
                                handleCopyItem('hotel', hotel, selectedCity);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900">{hotel.name}</h4>
                                {hotel.location && (
                                  <p className="text-gray-600 text-sm">{hotel.location}</p>
                                )}
                              </div>
                              <div className="flex items-center space-x-3">
                                {hotel.rating && hotel.rating > 0 && renderStars(hotel.rating)}
                                {renderLikeButton(hotel.liked ?? null)}
                                {selectedDraft && selectedCity && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyItem('hotel', hotel, selectedCity);
                                    }}
                                    className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold flex items-center transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                                  >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Save to Draft
                                  </button>
                                )}
                              </div>
                            </div>
                            {hotel.review && (
                              <p className="text-gray-700 text-sm leading-relaxed">{hotel.review}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Restaurants for this city */}
                  {city.restaurants.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">🍽️ Restaurants</h3>
                      <div className="space-y-4">
                        {city.restaurants.map((restaurant) => (
                          <div 
                            key={restaurant.id} 
                            className={`border rounded-lg p-4 transition-all ${
                              selectedDraft && selectedCity && selectedDay
                                ? 'border-green-300 bg-green-50 hover:bg-green-100 cursor-pointer'
                                : 'border-gray-200'
                            }`}
                            onClick={() => {
                              if (selectedDraft && selectedCity && selectedDay) {
                                handleCopyItem('restaurant', restaurant, selectedCity, selectedDay);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900">{restaurant.name}</h4>
                                {restaurant.location && (
                                  <p className="text-gray-600 text-sm">{restaurant.location}</p>
                                )}
                              </div>
                              <div className="flex items-center space-x-3">
                                {restaurant.rating && restaurant.rating > 0 && renderStars(restaurant.rating)}
                                {renderLikeButton(restaurant.liked ?? null)}
                                {selectedDraft && selectedCity && selectedDay && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyItem('restaurant', restaurant, selectedCity, selectedDay);
                                    }}
                                    className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold flex items-center transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                                  >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Save to Draft
                                  </button>
                                )}
                              </div>
                            </div>
                            {restaurant.review && (
                              <p className="text-gray-700 text-sm leading-relaxed">{restaurant.review}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activities for this city */}
                  {city.activities.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">🎯 Activities</h3>
                      <div className="space-y-4">
                        {city.activities.map((activity) => (
                          <div 
                            key={activity.id} 
                            className={`border rounded-lg p-4 transition-all ${
                              selectedDraft && selectedCity && selectedDay
                                ? 'border-purple-300 bg-purple-50 hover:bg-purple-100 cursor-pointer'
                                : 'border-gray-200'
                            }`}
                            onClick={() => {
                              if (selectedDraft && selectedCity && selectedDay) {
                                handleCopyItem('activity', activity, selectedCity, selectedDay);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900">{activity.name}</h4>
                                {activity.location && (
                                  <p className="text-gray-600 text-sm">{activity.location}</p>
                                )}
                              </div>
                              <div className="flex items-center space-x-3">
                                {activity.rating && activity.rating > 0 && renderStars(activity.rating)}
                                {renderLikeButton(activity.liked ?? null)}
                                {selectedDraft && selectedCity && selectedDay && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyItem('activity', activity, selectedCity, selectedDay);
                                    }}
                                    className="ml-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-semibold flex items-center transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                                  >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Save to Draft
                                  </button>
                                )}
                              </div>
                            </div>
                            {activity.review && (
                              <p className="text-gray-700 text-sm leading-relaxed">{activity.review}</p>
                            )}
                          </div>
                        ))}
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
