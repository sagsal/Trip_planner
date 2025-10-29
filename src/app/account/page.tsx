'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, MapPin, Calendar, Star, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

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

function AccountContent() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [deletingTrip, setDeletingTrip] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user data from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // Fetch user's trips from API
          const response = await fetch(`/api/trips?t=${Date.now()}`);
          if (response.ok) {
            const data = await response.json();
            // Filter trips to show only the current user's trips
            const userTrips = data.trips.filter((trip: any) => trip.user.id === parsedUser.id);
            setTrips(userTrips);
          } else {
            console.error('Failed to fetch trips:', response.status, response.statusText);
            setTrips([]);
          }
        } else {
          setUser(null);
          setTrips([]);
          // Redirect to login if no user found
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser(null);
        setTrips([]);
        // Redirect to login on error
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleDeleteTrip = async (tripId: string, tripTitle: string) => {
    if (!user || deletingTrip) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete "${tripTitle}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingTrip(tripId);
    
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // If trip not found, it might already be deleted, so just remove from UI
        if (response.status === 404) {
          setTrips(prevTrips => prevTrips.filter(trip => trip.id !== tripId));
          alert('Trip was already deleted.');
          return;
        }
        
        throw new Error(errorData.error || 'Failed to delete trip');
      }

      // Remove the trip from the local state
      setTrips(prevTrips => prevTrips.filter(trip => trip.id !== tripId));
      
      alert('Trip deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete trip');
    } finally {
      setDeletingTrip(null);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Manage your trips and share your travel experiences
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Link
            href="/trips/new"
            className="inline-flex items-center px-6 py-3 bg-[#F13B13] text-white rounded-lg hover:bg-[#F13B13]/90 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Trip
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <MapPin className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Trips</p>
                <p className="text-2xl font-bold text-gray-900">{trips.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Hotels Reviewed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trips.reduce((acc, trip) => acc + (trip.cities_data?.reduce((cityTotal, city) => cityTotal + city.hotels.length, 0) || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Restaurants</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trips.reduce((acc, trip) => acc + (trip.cities_data?.reduce((cityTotal, city) => cityTotal + city.restaurants.length, 0) || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Activities</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trips.reduce((acc, trip) => acc + (trip.cities_data?.reduce((cityTotal, city) => cityTotal + city.activities.length, 0) || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* My Trips */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Trips</h2>
          {trips.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No trips yet</h3>
              <p className="text-gray-600 mb-6">Start documenting your travel adventures!</p>
              <Link
                href="/trips/new"
                className="inline-flex items-center px-6 py-3 bg-[#F13B13] text-white rounded-lg hover:bg-[#F13B13]/90 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Trip
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">{trip.title}</h3>
                      <div className="flex space-x-2">
                        <Link
                          href={`/trips/${trip.id}/edit`}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDeleteTrip(trip.id, trip.title)}
                          disabled={deletingTrip === trip.id || deletingTrip !== null}
                          className="text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={deletingTrip === trip.id ? "Deleting..." : "Delete trip"}
                        >
                          {deletingTrip === trip.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {trip.description && (
                      <p className="text-gray-600 mb-4 line-clamp-2">{trip.description}</p>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">Countries: {parseCountries(trip.countries).join(', ')}</p>
                      <p className="text-sm text-gray-600">Cities: {parseCities(trip.cities).join(', ')}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{trip.cities_data?.reduce((total, city) => total + city.hotels.length, 0) || 0} hotels</span>
                      <span>{trip.cities_data?.reduce((total, city) => total + city.restaurants.length, 0) || 0} restaurants</span>
                      <span>{trip.cities_data?.reduce((total, city) => total + city.activities.length, 0) || 0} activities</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link
                        href={`/trips/${trip.id}`}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-center hover:bg-blue-700 transition-colors flex items-center justify-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                      <Link
                        href={`/trips/${trip.id}/edit`}
                        className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-center hover:bg-gray-50 transition-colors flex items-center justify-center"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* All Trips Link */}
        <div className="text-center">
          <Link
            href="/trips"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MapPin className="w-5 h-5 mr-2" />
            View All Public Trips
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AccountContent />
    </Suspense>
  );
}
