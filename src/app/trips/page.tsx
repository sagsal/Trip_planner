'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin, Calendar, Star, User, Heart, Filter, Search } from 'lucide-react';
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
  isDraft?: boolean; // Add isDraft to interface
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

function TripsContent() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    fetchTripsData();
  }, []);

  const fetchTripsData = async () => {
    try {
      // Fetch public trips (non-drafts)
      const result = await fetchTrips();
      
      if (result.data) {
        // Filter to only show public, non-draft trips
        // Handle cases where isDraft might be undefined/null
        // Exclude template trips and database trips (used for suggestions only)
        const publicTrips = result.data.trips.filter((trip: any) => {
          const isPublic = trip.isPublic === true;
          const isNotDraft = trip.isDraft === false || trip.isDraft === undefined || trip.isDraft === null;
          const isNotTemplate = !trip.title?.includes('TEMPLATE') && !trip.title?.includes('DATABASE:');
          return isPublic && isNotDraft && isNotTemplate;
        });
        
        setTrips(publicTrips);
        
        // Extract unique countries for filter
        const uniqueCountries = new Set<string>();
        publicTrips.forEach((trip: Trip) => {
          try {
            const tripCountries = JSON.parse(trip.countries);
            tripCountries.forEach((country: string) => uniqueCountries.add(country));
          } catch (e) {
            // Handle parsing error
          }
        });
        setCountries(Array.from(uniqueCountries).sort());
      } else if (result.error) {
        console.error('Error fetching trips:', result.error);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setIsLoading(false);
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

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         parseCountries(trip.countries).some((country: string) => 
                           country.toLowerCase().includes(searchTerm.toLowerCase())
                         ) ||
                         parseCities(trip.cities).some((city: string) => 
                           city.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesCountry = !filterCountry || parseCountries(trip.countries).includes(filterCountry);
    
    return matchesSearch && matchesCountry;
  });

  if (isLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden pt-16">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/sea-side-beach-0e.jpg)',
          }}
        >
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 backdrop-blur-sm rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white/20 backdrop-blur-sm rounded-lg shadow p-6">
                  <div className="h-4 bg-white/30 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-white/30 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-white/30 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden pt-16">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/sea-side-beach-0e.jpg)',
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Amazing Trips</h1>
          <p className="text-gray-600">
            Explore travel experiences shared by fellow adventurers
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white/20 backdrop-blur-sm rounded-lg shadow p-6 mb-8 border border-white/30">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search trips, countries, cities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0160D6] focus:border-transparent text-black bg-white/90"
                />
              </div>
            </div>
            <div className="md:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0160D6] focus:border-transparent appearance-none text-black bg-white/90"
                >
                  <option value="" className="text-gray-900">All Countries</option>
                  {countries.map((country) => (
                    <option key={country} value={country} className="text-gray-900">
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredTrips.length} of {trips.length} trips
          </p>
        </div>

        {/* Trips Grid */}
        {filteredTrips.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterCountry 
                ? 'Try adjusting your search or filter criteria'
                : 'Be the first to share your travel experience!'
              }
            </p>
            <Link
              href="/trips/new"
              className="inline-flex items-center px-6 py-3 bg-[#F13B13] text-white rounded-lg hover:bg-[#F13B13]/90 transition-colors"
            >
              <Heart className="w-5 h-5 mr-2" />
              Share Your Trip
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip, index) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/20 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-white/30"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">{trip.title}</h3>
                    <div className="flex items-center text-sm text-gray-500 ml-2">
                      <User className="w-4 h-4 mr-1" />
                      {trip.user.name}
                    </div>
                  </div>
                  
                  {trip.description && (
                    <p className="text-gray-600 mb-4 line-clamp-3">{trip.description}</p>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {parseCountries(trip.countries).join(', ')}
                    </div>
                    {trip.cities_data && trip.cities_data.length > 0 && (
                      <div className="ml-5">
                        {trip.cities_data.map((city, index) => (
                          <div key={city.id} className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">{city.name}</span>
                            <span className="text-gray-500 ml-2">
                              ({city.hotels.length} hotels, {city.restaurants.length} restaurants, {city.activities.length} activities)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-400" />
                      <span>{trip.cities_data?.reduce((total, city) => total + city.hotels.length, 0) || 0} hotels</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-green-400" />
                      <span>{trip.cities_data?.reduce((total, city) => total + city.restaurants.length, 0) || 0} restaurants</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-purple-400" />
                      <span>{trip.cities_data?.reduce((total, city) => total + city.activities.length, 0) || 0} activities</span>
                    </div>
                  </div>
                  
                  <Link
                    href={`/trips/${trip.id}`}
                    className="block w-full bg-[#0160D6] text-white px-4 py-3 rounded-lg text-center hover:bg-[#0160D6]/90 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg shadow p-8 border border-white/30">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Share Your Adventure</h2>
            <p className="text-gray-600 mb-6">
              Have an amazing trip to share? Help other travelers discover new destinations and experiences.
            </p>
            <Link
              href="/trips/new"
              className="inline-flex items-center px-8 py-4 bg-[#F13B13] text-white rounded-lg hover:bg-[#F13B13]/90 transition-colors text-lg font-semibold"
            >
              <Heart className="w-5 h-5 mr-2" />
              Share Your Trip
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TripsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TripsContent />
    </Suspense>
  );
}
