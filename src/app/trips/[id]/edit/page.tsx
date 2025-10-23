'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Trip {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  countries: string;
  cities: string;
  isPublic: boolean;
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
  city: string;
}

interface Restaurant {
  id: string;
  name: string;
  location: string;
  rating?: number;
  review?: string;
  liked?: boolean;
  city: string;
}

interface Activity {
  id: string;
  name: string;
  location: string;
  rating?: number;
  review?: string;
  liked?: boolean;
  city: string;
}

function EditTripContent() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    countries: '',
    cities: '',
    isPublic: true
  });

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (tripId) {
      fetchTrip();
    }
  }, [tripId]);

  const fetchTrip = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trip');
      }
      const tripData = await response.json();
      setTrip(tripData);
      
      // Populate form data
      setFormData({
        title: tripData.title || '',
        description: tripData.description || '',
        startDate: tripData.startDate ? new Date(tripData.startDate).toISOString().split('T')[0] : '',
        endDate: tripData.endDate ? new Date(tripData.endDate).toISOString().split('T')[0] : '',
        countries: tripData.countries || '',
        cities: tripData.cities || '',
        isPublic: tripData.isPublic !== false
      });

      // Parse and set related data
      setHotels(tripData.hotels || []);
      setRestaurants(tripData.restaurants || []);
      setActivities(tripData.activities || []);
    } catch (err) {
      setError('Failed to load trip data');
      console.error('Error fetching trip:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const addHotel = (city: string) => {
    const newHotel: Hotel = {
      id: `temp-${Date.now()}`,
      name: '',
      location: '',
      city: city || '',
      rating: undefined,
      review: '',
      liked: undefined
    };
    setHotels(prev => [...prev, newHotel]);
  };

  const addRestaurant = (city: string) => {
    const newRestaurant: Restaurant = {
      id: `temp-${Date.now()}`,
      name: '',
      location: '',
      city: city || '',
      rating: undefined,
      review: '',
      liked: undefined
    };
    setRestaurants(prev => [...prev, newRestaurant]);
  };

  const addActivity = (city: string) => {
    const newActivity: Activity = {
      id: `temp-${Date.now()}`,
      name: '',
      location: '',
      city: city || '',
      rating: undefined,
      review: '',
      liked: undefined
    };
    setActivities(prev => [...prev, newActivity]);
  };

  const removeHotel = (id: string) => {
    setHotels(prev => prev.filter(hotel => hotel.id !== id));
  };

  const removeRestaurant = (id: string) => {
    setRestaurants(prev => prev.filter(restaurant => restaurant.id !== id));
  };

  const removeActivity = (id: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== id));
  };

  const updateHotel = (id: string, field: keyof Hotel, value: any) => {
    setHotels(prev => prev.map(hotel => 
      hotel.id === id ? { ...hotel, [field]: value } : hotel
    ));
  };

  const updateRestaurant = (id: string, field: keyof Restaurant, value: any) => {
    setRestaurants(prev => prev.map(restaurant => 
      restaurant.id === id ? { ...restaurant, [field]: value } : restaurant
    ));
  };

  const updateActivity = (id: string, field: keyof Activity, value: any) => {
    setActivities(prev => prev.map(activity => 
      activity.id === id ? { ...activity, [field]: value } : activity
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User not logged in');
      }

      const user = JSON.parse(userData);
      
      const tripData = {
        ...formData,
        hotels: hotels.filter(h => h.name.trim() !== ''),
        restaurants: restaurants.filter(r => r.name.trim() !== ''),
        activities: activities.filter(a => a.name.trim() !== ''),
        userId: user.id,
        userName: user.name,
        userEmail: user.email
      };

      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update trip');
      }

      setSuccess('Trip updated successfully!');
      setTimeout(() => {
        router.push('/account');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update trip');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0160D6] to-[#00AAF8] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0160D6] to-[#00AAF8] flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Trip Not Found</h1>
          <p className="mb-4">The trip you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/account')}
            className="bg-[#F13B13] text-white px-6 py-2 rounded-full hover:bg-[#F13B13]/90 transition-colors"
          >
            Back to My Trips
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Edit Trip</h1>
            <button
              onClick={() => router.push('/account')}
              className="bg-[#F13B13] text-white px-4 py-2 rounded-lg hover:bg-[#F13B13]/90 transition-colors"
            >
              Back to My Trips
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Trip Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Trip Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter trip title"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Public Trip</label>
                <select
                  name="isPublic"
                  value={formData.isPublic.toString()}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="true">Yes, share with everyone</option>
                  <option value="false">No, keep private</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your trip..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                  min={new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                  min={formData.startDate}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Countries Visited *</label>
                <input
                  type="text"
                  name="countries"
                  value={formData.countries}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Colombia, Peru"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Cities Visited *</label>
                <input
                  type="text"
                  name="cities"
                  value={formData.cities}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Bogotá, Medellín, Lima"
                />
              </div>
            </div>

            {/* Hotels Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Hotels</h3>
                <button
                  type="button"
                  onClick={() => addHotel('')}
                  className="bg-[#AAB624] text-white px-4 py-2 rounded-lg hover:bg-[#AAB624]/90 transition-colors"
                >
                  Add Hotel
                </button>
              </div>

              {hotels.map((hotel, index) => (
                <div key={hotel.id} className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-gray-900 font-semibold">Hotel {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeHotel(hotel.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Hotel name"
                      value={hotel.name}
                      onChange={(e) => updateHotel(hotel.id, 'name', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={hotel.location}
                      onChange={(e) => updateHotel(hotel.id, 'location', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={hotel.city}
                      onChange={(e) => updateHotel(hotel.id, 'city', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={hotel.rating || ''}
                      onChange={(e) => updateHotel(hotel.id, 'rating', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Rating</option>
                      <option value="1">1 Star</option>
                      <option value="2">2 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="5">5 Stars</option>
                    </select>
                    <select
                      value={hotel.liked === undefined ? '' : hotel.liked.toString()}
                      onChange={(e) => updateHotel(hotel.id, 'liked', e.target.value === '' ? undefined : e.target.value === 'true')}
                      className="px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Overall Experience</option>
                      <option value="true">Liked</option>
                      <option value="false">Disliked</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Review (optional)"
                    value={hotel.review || ''}
                    onChange={(e) => updateHotel(hotel.id, 'review', e.target.value)}
                    rows={2}
                    className="w-full mt-3 px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>

            {/* Restaurants Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Restaurants</h3>
                <button
                  type="button"
                  onClick={() => addRestaurant('')}
                  className="bg-[#AAB624] text-white px-4 py-2 rounded-lg hover:bg-[#AAB624]/90 transition-colors"
                >
                  Add Restaurant
                </button>
              </div>

              {restaurants.map((restaurant, index) => (
                <div key={restaurant.id} className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-gray-900 font-semibold">Restaurant {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeRestaurant(restaurant.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Restaurant name"
                      value={restaurant.name}
                      onChange={(e) => updateRestaurant(restaurant.id, 'name', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={restaurant.location}
                      onChange={(e) => updateRestaurant(restaurant.id, 'location', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={restaurant.city}
                      onChange={(e) => updateRestaurant(restaurant.id, 'city', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={restaurant.rating || ''}
                      onChange={(e) => updateRestaurant(restaurant.id, 'rating', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Rating</option>
                      <option value="1">1 Star</option>
                      <option value="2">2 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="5">5 Stars</option>
                    </select>
                    <select
                      value={restaurant.liked === undefined ? '' : restaurant.liked.toString()}
                      onChange={(e) => updateRestaurant(restaurant.id, 'liked', e.target.value === '' ? undefined : e.target.value === 'true')}
                      className="px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Overall Experience</option>
                      <option value="true">Liked</option>
                      <option value="false">Disliked</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Review (optional)"
                    value={restaurant.review || ''}
                    onChange={(e) => updateRestaurant(restaurant.id, 'review', e.target.value)}
                    rows={2}
                    className="w-full mt-3 px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>

            {/* Activities Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Activities</h3>
                <button
                  type="button"
                  onClick={() => addActivity('')}
                  className="bg-[#AAB624] text-white px-4 py-2 rounded-lg hover:bg-[#AAB624]/90 transition-colors"
                >
                  Add Activity
                </button>
              </div>

              {activities.map((activity, index) => (
                <div key={activity.id} className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-gray-900 font-semibold">Activity {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeActivity(activity.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Activity name"
                      value={activity.name}
                      onChange={(e) => updateActivity(activity.id, 'name', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={activity.location}
                      onChange={(e) => updateActivity(activity.id, 'location', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={activity.city}
                      onChange={(e) => updateActivity(activity.id, 'city', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={activity.rating || ''}
                      onChange={(e) => updateActivity(activity.id, 'rating', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Rating</option>
                      <option value="1">1 Star</option>
                      <option value="2">2 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="5">5 Stars</option>
                    </select>
                    <select
                      value={activity.liked === undefined ? '' : activity.liked.toString()}
                      onChange={(e) => updateActivity(activity.id, 'liked', e.target.value === '' ? undefined : e.target.value === 'true')}
                      className="px-3 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Overall Experience</option>
                      <option value="true">Liked</option>
                      <option value="false">Disliked</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Review (optional)"
                    value={activity.review || ''}
                    onChange={(e) => updateActivity(activity.id, 'review', e.target.value)}
                    rows={2}
                    className="w-full mt-3 px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/account')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-[#F13B13] text-white rounded-lg hover:bg-[#F13B13]/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Updating...' : 'Update Trip'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function EditTripPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <EditTripContent />
    </Suspense>
  );
}
