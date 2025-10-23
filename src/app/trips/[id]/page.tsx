'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Calendar, Star, User, ArrowLeft, Heart, ThumbsUp, ThumbsDown } from 'lucide-react';

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
  hotels: any[];
  restaurants: any[];
  activities: any[];
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function TripDetailPage() {
  const params = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchTrip(params.id as string);
    }
  }, [params.id]);

  const fetchTrip = async (id: string) => {
    try {
      const response = await fetch(`/api/trips/${id}`);
      if (response.ok) {
        const data = await response.json();
        setTrip(data.trip);
      } else {
        setError('Trip not found');
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
      return JSON.parse(countriesJson);
    } catch {
      return [];
    }
  };

  const parseCities = (citiesJson: string) => {
    try {
      return JSON.parse(citiesJson);
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

          {/* Hotels */}
          {trip.hotels.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Hotels</h2>
              <div className="space-y-6">
                {trip.hotels.map((hotel) => (
                  <div key={hotel.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{hotel.name}</h3>
                        {hotel.location && (
                          <p className="text-gray-600">{hotel.location}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        {hotel.rating > 0 && renderStars(hotel.rating)}
                        {renderLikeButton(hotel.liked)}
                      </div>
                    </div>
                    {hotel.review && (
                      <p className="text-gray-700 leading-relaxed">{hotel.review}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Restaurants */}
          {trip.restaurants.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Restaurants</h2>
              <div className="space-y-6">
                {trip.restaurants.map((restaurant) => (
                  <div key={restaurant.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{restaurant.name}</h3>
                        {restaurant.location && (
                          <p className="text-gray-600">{restaurant.location}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        {restaurant.rating > 0 && renderStars(restaurant.rating)}
                        {renderLikeButton(restaurant.liked)}
                      </div>
                    </div>
                    {restaurant.review && (
                      <p className="text-gray-700 leading-relaxed">{restaurant.review}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activities */}
          {trip.activities.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Activities</h2>
              <div className="space-y-6">
                {trip.activities.map((activity) => (
                  <div key={activity.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{activity.name}</h3>
                        {activity.location && (
                          <p className="text-gray-600">{activity.location}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        {activity.rating > 0 && renderStars(activity.rating)}
                        {renderLikeButton(activity.liked)}
                      </div>
                    </div>
                    {activity.review && (
                      <p className="text-gray-700 leading-relaxed">{activity.review}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Inspired by this trip?</h2>
            <p className="text-gray-600 mb-6">
              Share your own travel experiences and help other travelers discover amazing destinations.
            </p>
            <Link
              href="/trips/new"
              className="inline-flex items-center px-8 py-4 bg-[#F13B13] text-white rounded-lg hover:bg-[#F13B13]/90 transition-colors text-lg font-semibold"
            >
              <Heart className="w-5 h-5 mr-2" />
              Share Your Trip
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
