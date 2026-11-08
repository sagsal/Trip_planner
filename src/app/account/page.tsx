'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, MapPin, Calendar, Edit, Trash2, Eye, Loader2, RefreshCw, AlertCircle, Share2, Compass } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
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
  isDraft?: boolean;
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
  const [draftTrips, setDraftTrips] = useState<Trip[]>([]);
  const [privateTrips, setPrivateTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [deletingTrip, setDeletingTrip] = useState<string | null>(null);
  const [deletingDraft, setDeletingDraft] = useState<string | null>(null);
  const router = useRouter();

  const fetchUserTrips = async (showRetryState = false) => {
    try {
      if (showRetryState) {
        setIsRetrying(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      // Get user data from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        router.push('/login');
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Fetch user's trips from API (shared/public, drafts, and private finalized trips)
      try {
        const [sharedResult, draftsResult, privateResult] = await Promise.all([
          fetchTrips(), // Shared/public trips
          fetch(`/api/trips?drafts=true&userId=${parsedUser.id}`).then(r => r.json()).catch(() => ({ trips: [] })), // Draft trips
          fetch(`/api/trips?private=true&userId=${parsedUser.id}`).then(r => r.json()).catch(() => ({ trips: [] })) // Private finalized trips
        ]);
        
        if (sharedResult.data) {
          // Filter shared trips to show only the current user's public trips
          // Exclude database trips (used for suggestions only)
          const userSharedTrips = sharedResult.data.trips.filter((trip: any) => 
            trip.user.id === parsedUser.id && 
            (!trip.isDraft || trip.isDraft === false) && 
            trip.isPublic === true &&
            !trip.title?.includes('DATABASE:') &&
            !trip.title?.includes('TEMPLATE')
          );
          setTrips(userSharedTrips);
        } else if (sharedResult.error) {
          setError(sharedResult.error);
        }
        
        // Set draft trips
        if (draftsResult.trips) {
          setDraftTrips(draftsResult.trips);
        }
        
        // Set private finalized trips
        if (privateResult.trips) {
          setPrivateTrips(privateResult.trips);
        }
        
        setError(null);
      } catch (fetchError) {
        // If all fail, try to at least get shared trips
        const result = await fetchTrips();
        if (result.data) {
          const userTrips = result.data.trips.filter((trip: any) => 
            trip.user.id === parsedUser.id &&
            !trip.title?.includes('DATABASE:') &&
            !trip.title?.includes('TEMPLATE')
          );
          const drafts = userTrips.filter((trip: any) => trip.isDraft === true);
          const shared = userTrips.filter((trip: any) => (!trip.isDraft || trip.isDraft === false) && trip.isPublic === true);
          setDraftTrips(drafts);
          setTrips(shared);
        } else if (result.error) {
          setError(result.error);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Only redirect to login if it's an authentication issue, not a network issue
      if (error instanceof Error && !error.message.includes('Network') && !error.message.includes('fetch') && !error.message.includes('ERR_NETWORK')) {
        router.push('/login');
      } else {
        setError('Unable to load trips. Please check your connection and try again.');
        // Keep existing trips if available
        if (trips.length === 0) {
          setTrips([]);
        }
      }
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    fetchUserTrips();
  }, []);

  const handleDeleteTrip = async (tripId: string, tripTitle: string) => {
    if (!user || deletingTrip) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete "${tripTitle}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingTrip(tripId);
    
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      let response;
      try {
        response = await fetch(`/api/trips/${tripId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout. Please try again.');
        }
        throw fetchError;
      }

      if (!response.ok) {
        const errorData = await response.json();
        
        // If trip not found, it might already be deleted, so just remove from UI
        if (response.status === 404) {
          setTrips(prevTrips => prevTrips.filter(trip => trip.id !== tripId));
          setPrivateTrips(prev => prev.filter(trip => trip.id !== tripId));
          alert('Trip was already deleted.');
          return;
        }
        
        throw new Error(errorData.error || 'Failed to delete trip');
      }

      // Remove the trip from the local state
      setTrips(prevTrips => prevTrips.filter(trip => trip.id !== tripId));
          setPrivateTrips(prev => prev.filter(trip => trip.id !== tripId));
      
      alert('Trip deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete trip');
    } finally {
      setDeletingTrip(null);
    }
  };

  const handleDeleteDraft = async (draftId: string, draftTitle: string) => {
    if (!user || deletingDraft) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete "${draftTitle}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingDraft(draftId);
    
    try {
      const response = await fetch(`/api/trips/${draftId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete draft trip');
      }

      // Remove the draft from the local state
      setDraftTrips(prevDrafts => prevDrafts.filter(draft => draft.id !== draftId));
      
      alert('Draft trip deleted successfully!');
    } catch (error) {
      console.error('Delete draft error:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete draft trip');
    } finally {
      setDeletingDraft(null);
    }
  };

  // Every trip the user has made, newest first, tagged with its status
  type TripStatus = 'Draft' | 'Private' | 'Shared';
  const allMyTrips: { trip: Trip; status: TripStatus }[] = [
    ...draftTrips.map((trip) => ({ trip, status: 'Draft' as TripStatus })),
    ...privateTrips.map((trip) => ({ trip, status: 'Private' as TripStatus })),
    ...trips.map((trip) => ({ trip, status: 'Shared' as TripStatus })),
  ]
    .filter((item, i, arr) => arr.findIndex((x) => x.trip.id === item.trip.id) === i)
    .sort((a, b) => new Date(b.trip.createdAt || 0).getTime() - new Date(a.trip.createdAt || 0).getTime());

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
    <div className="min-h-screen bg-[#F6F2EC] pt-16">
      {/* Welcome + main actions */}
      <div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-semibold text-[#2F4A5C] mb-3"
          >
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </motion.h1>
          <p className="text-lg text-[#5B6B75] mb-10">
            What would you like to do today?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Link
                href="/trips/new"
                className="group flex flex-col items-center justify-center h-full rounded-xl bg-[#4A6878] text-white px-6 py-10 shadow-sm hover:bg-[#3F5B6A] transition-colors duration-200"
              >
                <span className="flex items-center justify-center w-14 h-14 rounded-full bg-white/15 mb-4 group-hover:bg-white/25 transition-colors">
                  <Plus className="w-7 h-7" />
                </span>
                <span className="text-xl font-medium">Add your trip</span>
                <span className="mt-2 text-white/80 text-sm sm:text-base">
                  Share where you went, where you stayed and what you loved
                </span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link
                href="/trips"
                className="group flex flex-col items-center justify-center h-full rounded-xl bg-white text-[#2F4A5C] border border-[#D9D2C7] px-6 py-10 shadow-sm hover:bg-[#FBF9F5] transition-colors duration-200"
              >
                <span className="flex items-center justify-center w-14 h-14 rounded-full bg-[#E9E3DA] mb-4 group-hover:bg-[#E2DBD0] transition-colors">
                  <Compass className="w-7 h-7" />
                </span>
                <span className="text-xl font-medium">Browse trips</span>
                <span className="mt-2 text-[#6B7A83] text-sm sm:text-base">
                  Get ideas from fellow travelers
                </span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
            <button
              onClick={() => fetchUserTrips(true)}
              disabled={isRetrying}
              className="ml-4 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        )}

        {/* My Trips: one list of every trip the user has made */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-[#2F4A5C] mb-4">My Trips</h2>

          {error && allMyTrips.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E4DED4] p-8 text-center">
              <AlertCircle className="w-10 h-10 text-red-300 mx-auto mb-3" />
              <p className="text-[#2F4A5C] font-medium mb-1">Unable to load your trips</p>
              <p className="text-[#6B7A83] text-sm mb-5">{error}</p>
              <button
                onClick={() => fetchUserTrips(true)}
                disabled={isRetrying}
                className="inline-flex items-center px-5 py-2 bg-[#4A6878] text-white rounded-lg hover:bg-[#3F5B6A] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Try again'}
              </button>
            </div>
          ) : allMyTrips.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-[#D9D2C7] p-8 text-center">
              <p className="text-[#2F4A5C] font-medium mb-1">No trips yet</p>
              <p className="text-[#6B7A83] text-sm mb-5">Trips you add will be listed here.</p>
              <Link
                href="/trips/new"
                className="inline-flex items-center px-5 py-2 bg-[#4A6878] text-white rounded-lg hover:bg-[#3F5B6A] transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add your trip
              </Link>
            </div>
          ) : (
            <ul className="bg-white rounded-xl border border-[#E4DED4] divide-y divide-[#EEE8DF] overflow-hidden">
              {allMyTrips.map(({ trip, status }) => {
                const places = [...parseCities(trip.cities), ...parseCountries(trip.countries)]
                  .filter(Boolean)
                  .slice(0, 4)
                  .join(', ');
                const hasDates = !!(trip.startDate && trip.endDate);
                const openHref = status === 'Draft' ? `/trips/build/${trip.id}` : `/trips/${trip.id}`;
                const editHref = status === 'Draft' ? `/trips/build/${trip.id}` : `/trips/${trip.id}/edit`;
                const isDeleting = status === 'Draft' ? deletingDraft === trip.id : deletingTrip === trip.id;
                const badge =
                  status === 'Draft'
                    ? 'bg-[#F3EBDD] text-[#8A6D3B]'
                    : status === 'Private'
                    ? 'bg-[#ECEAE6] text-[#5B6B75]'
                    : 'bg-[#E3ECEF] text-[#3F5B6A]';
                return (
                  <li key={trip.id} className="flex items-center gap-4 px-4 sm:px-5 py-4 hover:bg-[#FBF9F5] transition-colors">
                    <Link href={openHref} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-[#2F4A5C] truncate">{trip.title || 'Untitled trip'}</span>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${badge}`}>{status}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 text-sm text-[#6B7A83]">
                        {hasDates && (
                          <span className="inline-flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1" />
                            {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                          </span>
                        )}
                        {places && (
                          <span className="inline-flex items-center truncate">
                            <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
                            <span className="truncate">{places}</span>
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="flex items-center gap-1 shrink-0">
                      {status === 'Draft' ? (
                        <Link
                          href={`/trips/${trip.id}/share`}
                          className="p-2 rounded-lg text-[#6B7A83] hover:text-[#2F4A5C] hover:bg-[#F1ECE4]"
                          title="Share trip"
                        >
                          <Share2 className="w-4 h-4" />
                        </Link>
                      ) : (
                        <Link
                          href={`/trips/${trip.id}`}
                          className="p-2 rounded-lg text-[#6B7A83] hover:text-[#2F4A5C] hover:bg-[#F1ECE4]"
                          title="View trip"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      )}
                      <Link
                        href={editHref}
                        className="p-2 rounded-lg text-[#6B7A83] hover:text-[#2F4A5C] hover:bg-[#F1ECE4]"
                        title="Edit trip"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() =>
                          status === 'Draft'
                            ? handleDeleteDraft(trip.id, trip.title)
                            : handleDeleteTrip(trip.id, trip.title)
                        }
                        disabled={deletingTrip !== null || deletingDraft !== null}
                        className="p-2 rounded-lg text-[#6B7A83] hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete trip"
                      >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
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
