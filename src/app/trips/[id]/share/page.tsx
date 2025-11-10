'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Star, X } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

interface DraftTrip {
  id: string;
  title: string;
  description?: string;
  countries: string;
  cities: string;
  cities_data: {
    id: string;
    name: string;
    country: string;
    hotels: any[];
    restaurants: any[];
    activities: any[];
  }[];
}

function ShareTripContent() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [draftTrip, setDraftTrip] = useState<DraftTrip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Share trip form state
  const [shareData, setShareData] = useState({
    startDate: '',
    endDate: '',
    tripRating: 0,
    tripReview: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      loadDraftTrip();
    } else {
      router.push('/login');
    }
  }, [tripId, router]);

  const loadDraftTrip = async () => {
    try {
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      if (!user) {
        setError('User not found. Please log in again.');
        return;
      }
      const userIdParam = `?userId=${user.id}`;
      const response = await fetch(`/api/trips/${tripId}${userIdParam}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load draft trip' }));
        setError(errorData.error || 'Draft trip not found');
        return;
      }
      
      const result = await response.json();
      // API returns { trip: {...} }
      const data = result.trip || result;
      
      if (!data) {
        setError('Draft trip not found');
        return;
      }
      
      if (!data.isDraft) {
        setError('This trip is already shared');
        return;
      }
      
      setDraftTrip(data);
      
      // Load existing data if available
      if (data.startDate) {
        setShareData({
          startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
          endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '',
          tripRating: 0, // Rating is not stored separately
          tripReview: data.description?.includes('Review:') 
            ? (data.description.match(/Review:\s*(.+)/s)?.[1]?.trim() || '')
            : ''
        });
      }
      setError(null);
    } catch (err) {
      console.error('Error loading draft trip:', err);
      setError('An error occurred while loading the draft trip');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareTrip = async () => {
    if (!shareData.startDate || !shareData.endDate) {
      setError('Please provide start and end dates for your trip');
      return;
    }

    if (!draftTrip) {
      setError('Draft trip not loaded');
      return;
    }

    try {
      // Prepare countries - ensure it's always an array
      let countries: string[] = [];
      if (typeof draftTrip.countries === 'string') {
        try {
          const parsed = JSON.parse(draftTrip.countries);
          countries = Array.isArray(parsed) ? parsed : (typeof parsed === 'string' ? JSON.parse(parsed) : []);
        } catch (e) {
          countries = [];
        }
      } else if (Array.isArray(draftTrip.countries)) {
        countries = draftTrip.countries;
      }

      // Prepare cities data for the update
      const citiesData = draftTrip.cities_data.map((city: any) => {
        const allRestaurants: any[] = [];
        const allActivities: any[] = [];
        
        // Since restaurants and activities are at city level in DB, we need to distribute them across days
        const restaurants = city.restaurants || [];
        const activities = city.activities || [];
        const numberOfDays = 1; // Default, or we could calculate from existing data

        return {
          name: city.name,
          country: city.country,
          numberOfDays: numberOfDays,
          hotels: city.hotels || [],
          restaurants: restaurants.filter((r: any) => r.name && r.name.trim() !== ''),
          activities: activities.filter((a: any) => a.name && a.name.trim() !== ''),
          days: Array.from({ length: numberOfDays }, (_, index) => ({
            dayNumber: index + 1,
            restaurants: restaurants.filter((r: any) => r.name && r.name.trim() !== ''),
            activities: activities.filter((a: any) => a.name && a.name.trim() !== '')
          }))
        };
      });

      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draftTrip.title,
          description: draftTrip.description || '',
          countries: JSON.stringify(countries),
          cities: JSON.stringify(draftTrip.cities_data.map((c: any) => c.name)),
          citiesData: citiesData,
          startDate: shareData.startDate,
          endDate: shareData.endDate,
          isDraft: false, // Convert from draft to shared
          isPublic: true, // Make it public so all users can see it
          tripRating: shareData.tripRating,
          tripReview: shareData.tripReview,
          userId: user.id
        })
      });

      if (response.ok) {
        setSuccess('Trip shared successfully! It is now visible to all users.');
        setTimeout(() => {
          router.push(`/trips/${tripId}`);
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to share trip');
      }
    } catch (err) {
      console.error('Error sharing trip:', err);
      setError('An error occurred while sharing the trip');
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!draftTrip) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Draft trip not found</p>
          <Link href="/trips/build" className="text-blue-600 hover:text-blue-800">
            Back to Build Trip
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/trips/build/${tripId}`}
            className="inline-flex items-center text-[#0160D6] hover:text-[#0160D6]/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Draft
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Share Your Trip</h1>
          <p className="text-gray-600">Convert your draft trip to a shared trip for others to see</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
            <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Trip Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{draftTrip.title}</h2>
          {draftTrip.description && (
            <p className="text-gray-600 mb-4">{draftTrip.description}</p>
          )}
          <p className="text-gray-600 mb-6">
            <strong>Countries:</strong> {(() => {
              try {
                let countries: string[] = [];
                if (typeof draftTrip.countries === 'string') {
                  const parsed = JSON.parse(draftTrip.countries);
                  countries = Array.isArray(parsed) ? parsed : (typeof parsed === 'string' ? JSON.parse(parsed) : []);
                } else if (Array.isArray(draftTrip.countries)) {
                  countries = draftTrip.countries;
                }
                return countries.length > 0 ? countries.join(', ') : 'No countries specified';
              } catch (e) {
                return 'No countries specified';
              }
            })()}
          </p>

          {/* Cities Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Places Visited:</h3>
            <div className="space-y-2">
              {draftTrip.cities_data.map((city) => (
                <div key={city.id} className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{city.name}, {city.country}</p>
                  <div className="text-sm text-gray-600 mt-1">
                    {city.hotels.length > 0 && <span>{city.hotels.length} hotel(s) • </span>}
                    {city.restaurants.length > 0 && <span>{city.restaurants.length} restaurant(s) • </span>}
                    {city.activities.length > 0 && <span>{city.activities.length} activity(ies)</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Share Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Trip Details</h2>

          <div className="space-y-6">
            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={shareData.startDate}
                  onChange={(e) => setShareData({ ...shareData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={shareData.endDate}
                  onChange={(e) => setShareData({ ...shareData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                />
              </div>
            </div>

            {/* Trip Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Trip Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setShareData({ ...shareData, tripRating: rating })}
                    className={`p-2 rounded-lg transition-colors ${
                      shareData.tripRating >= rating
                        ? 'text-yellow-400 bg-yellow-50'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
                {shareData.tripRating > 0 && (
                  <span className="text-gray-600 ml-2">{shareData.tripRating} / 5</span>
                )}
              </div>
            </div>

            {/* Trip Review */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trip Review / Comments
              </label>
              <textarea
                value={shareData.tripReview}
                onChange={(e) => setShareData({ ...shareData, tripReview: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Share your experience, highlights, tips, and any recommendations..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                onClick={handleShareTrip}
                className="flex-1 px-6 py-3 bg-[#AAB624] text-white rounded-lg hover:bg-[#AAB624]/90 transition-colors font-semibold flex items-center justify-center"
              >
                <Save className="w-5 h-5 mr-2" />
                Share Trip
              </button>
              <Link
                href={`/trips/build/${tripId}`}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center"
              >
                Cancel
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ShareTripPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ShareTripContent />
    </Suspense>
  );
}

