'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Plus, X, ChevronDown } from 'lucide-react';
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
  cities_data: CityData[];
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

interface CityData {
  id: string;
  name: string;
  country: string;
  hotels: Hotel[];
  restaurants: Restaurant[];
  activities: Activity[];
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
    isPublic: true
  });

  const [citiesData, setCitiesData] = useState<CityData[]>([]);

  // State for adding new city
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});

  // Common countries and cities data
  const countriesData = {
    'Colombia': ['Medellín', 'Bogotá', 'Cartagena', 'Cali', 'Barranquilla'],
    'Spain': ['Madrid', 'Barcelona', 'Seville', 'Valencia', 'Bilbao'],
    'France': ['Paris', 'Lyon', 'Marseille', 'Nice', 'Toulouse'],
    'Italy': ['Rome', 'Milan', 'Florence', 'Venice', 'Naples'],
    'Japan': ['Tokyo', 'Osaka', 'Kyoto', 'Hiroshima', 'Nagoya'],
    'Thailand': ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Krabi'],
    'Mexico': ['Mexico City', 'Cancun', 'Guadalajara', 'Tijuana', 'Puebla'],
    'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza'],
    'India': ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'],
    'Germany': ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt'],
    'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Edinburgh'],
    'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
    'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
    'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
    'Other': []
  };

  const toggleSection = (cityId: string, section: string) => {
    const key = `${cityId}-${section}`;
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

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
        isPublic: tripData.isPublic !== false
      });

      // Parse and set related data
      setCitiesData(tripData.cities_data || []);
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

  const addCity = () => {
    if (!selectedCountry || !selectedCity) return;
    
    const newCity: CityData = {
      id: `temp-${Date.now()}`,
      name: selectedCity,
      country: selectedCountry,
      hotels: [],
      restaurants: [],
      activities: []
    };
    setCitiesData(prev => [...prev, newCity]);
    
    // Reset selections
    setSelectedCountry('');
    setSelectedCity('');
  };

  const removeCity = (cityId: string) => {
    setCitiesData(prev => prev.filter(city => city.id !== cityId));
  };

  const updateCity = (cityId: string, field: keyof CityData, value: any) => {
    setCitiesData(prev => prev.map(city => 
      city.id === cityId ? { ...city, [field]: value } : city
    ));
  };

  const addHotel = (cityId: string) => {
    const newHotel: Hotel = {
      id: `temp-${Date.now()}`,
      name: '',
      location: '',
      rating: undefined,
      review: '',
      liked: undefined
    };
    setCitiesData(prev => prev.map(city => 
      city.id === cityId 
        ? { ...city, hotels: [...city.hotels, newHotel] }
        : city
    ));
  };

  const addRestaurant = (cityId: string) => {
    const newRestaurant: Restaurant = {
      id: `temp-${Date.now()}`,
      name: '',
      location: '',
      rating: undefined,
      review: '',
      liked: undefined
    };
    setCitiesData(prev => prev.map(city => 
      city.id === cityId 
        ? { ...city, restaurants: [...city.restaurants, newRestaurant] }
        : city
    ));
  };

  const addActivity = (cityId: string) => {
    const newActivity: Activity = {
      id: `temp-${Date.now()}`,
      name: '',
      location: '',
      rating: undefined,
      review: '',
      liked: undefined
    };
    setCitiesData(prev => prev.map(city => 
      city.id === cityId 
        ? { ...city, activities: [...city.activities, newActivity] }
        : city
    ));
  };

  const removeHotel = (cityId: string, hotelId: string) => {
    setCitiesData(prev => prev.map(city => 
      city.id === cityId 
        ? { ...city, hotels: city.hotels.filter(hotel => hotel.id !== hotelId) }
        : city
    ));
  };

  const removeRestaurant = (cityId: string, restaurantId: string) => {
    setCitiesData(prev => prev.map(city => 
      city.id === cityId 
        ? { ...city, restaurants: city.restaurants.filter(restaurant => restaurant.id !== restaurantId) }
        : city
    ));
  };

  const removeActivity = (cityId: string, activityId: string) => {
    setCitiesData(prev => prev.map(city => 
      city.id === cityId 
        ? { ...city, activities: city.activities.filter(activity => activity.id !== activityId) }
        : city
    ));
  };

  const updateHotel = (cityId: string, hotelId: string, field: keyof Hotel, value: any) => {
    setCitiesData(prev => prev.map(city => 
      city.id === cityId 
        ? { 
            ...city, 
            hotels: city.hotels.map(hotel => 
              hotel.id === hotelId ? { ...hotel, [field]: value } : hotel
            )
          }
        : city
    ));
  };

  const updateRestaurant = (cityId: string, restaurantId: string, field: keyof Restaurant, value: any) => {
    setCitiesData(prev => prev.map(city => 
      city.id === cityId 
        ? { 
            ...city, 
            restaurants: city.restaurants.map(restaurant => 
              restaurant.id === restaurantId ? { ...restaurant, [field]: value } : restaurant
            )
          }
        : city
    ));
  };

  const updateActivity = (cityId: string, activityId: string, field: keyof Activity, value: any) => {
    setCitiesData(prev => prev.map(city => 
      city.id === cityId 
        ? { 
            ...city, 
            activities: city.activities.map(activity => 
              activity.id === activityId ? { ...activity, [field]: value } : activity
            )
          }
        : city
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
        citiesData: citiesData.map(city => ({
          name: city.name,
          country: city.country,
          hotels: city.hotels.filter(h => h.name.trim() !== ''),
          restaurants: city.restaurants.filter(r => r.name.trim() !== ''),
          activities: city.activities.filter(a => a.name.trim() !== '')
        })),
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

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Country *</label>
              <input
                type="text"
                name="countries"
                value={formData.countries}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Colombia"
              />
            </div>

            {/* Cities and their data */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Cities & Details</h3>
              </div>

              {/* Country & City Selection */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-8 mb-8 border border-blue-200">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">🌍</div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">Add More Cities</h3>
                  <p className="text-gray-600 text-lg">First choose a country, then select a city!</p>
                </div>
                
                <div className="max-w-2xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🌍 Country *
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-900"
                        value={selectedCountry}
                        onChange={(e) => {
                          setSelectedCountry(e.target.value);
                          setSelectedCity(''); // Reset city when country changes
                        }}
                      >
                        <option value="">Select a country...</option>
                        {Object.keys(countriesData).map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🏙️ City *
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-900"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        disabled={!selectedCountry}
                      >
                        <option value="">Select a city...</option>
                        {selectedCountry && countriesData[selectedCountry as keyof typeof countriesData]?.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                        {selectedCountry && (
                          <option value="custom">+ Add custom city</option>
                        )}
                      </select>
                    </div>
                  </div>
                  
                  {/* Custom city input */}
                  {selectedCity === 'custom' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🏙️ Custom City Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter custom city name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            if (input.value.trim()) {
                              setSelectedCity(input.value.trim());
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={addCity}
                      disabled={!selectedCountry || !selectedCity}
                      className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Add City ✨
                    </button>
                  </div>
                </div>
              </div>

              {/* Show message when no cities */}
              {citiesData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No cities added yet</p>
                  <p className="text-sm mb-6">Add your first city above to start adding hotels, restaurants, and activities!</p>
                  
                  {/* Preview of what they'll get */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <h4 className="font-medium text-blue-900 mb-2">After adding a city, you'll see:</h4>
                    <div className="text-left text-sm text-blue-800">
                      <div className="flex items-center mb-1">
                        <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                        <span>🔵 Add Hotel button</span>
                      </div>
                      <div className="flex items-center mb-1">
                        <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                        <span>🟢 Add Restaurant button</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
                        <span>🟣 Add Activity button</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {citiesData.map((city, cityIndex) => (
                <div key={city.id} className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
                  {/* City Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {cityIndex + 1}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{city.name}</h3>
                        <p className="text-gray-600">📍 {city.country}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCity(city.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Expandable Sections */}
                  <div className="space-y-4">

                  {/* Hotels for this city */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h5 className="font-medium text-gray-900">Hotels</h5>
                        <p className="text-xs text-gray-500">Click "Add Hotel" multiple times to add more hotels</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addHotel(city.id)}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                      >
                        Add Hotel
                      </button>
                    </div>
                    {city.hotels.map((hotel, index) => (
                      <div key={hotel.id} className="bg-gray-50 rounded-lg p-4 mb-3">
                        <div className="flex items-center justify-between mb-3">
                          <h6 className="font-medium text-gray-800">Hotel {index + 1}</h6>
                          <button
                            type="button"
                            onClick={() => removeHotel(city.id, hotel.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Hotel name"
                            value={hotel.name}
                            onChange={(e) => updateHotel(city.id, hotel.id, 'name', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            placeholder="Location"
                            value={hotel.location}
                            onChange={(e) => updateHotel(city.id, hotel.id, 'location', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <select
                            value={hotel.rating || ''}
                            onChange={(e) => updateHotel(city.id, hotel.id, 'rating', e.target.value ? parseInt(e.target.value) : undefined)}
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
                            onChange={(e) => updateHotel(city.id, hotel.id, 'liked', e.target.value === '' ? undefined : e.target.value === 'true')}
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
                          onChange={(e) => updateHotel(city.id, hotel.id, 'review', e.target.value)}
                          rows={2}
                          className="w-full mt-3 px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Restaurants for this city */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h5 className="font-medium text-gray-900">Restaurants</h5>
                        <p className="text-xs text-gray-500">Click "Add Restaurant" multiple times to add more restaurants</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addRestaurant(city.id)}
                        className="bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                      >
                        Add Restaurant
                      </button>
                    </div>
                    {city.restaurants.map((restaurant, index) => (
                      <div key={restaurant.id} className="bg-gray-50 rounded-lg p-4 mb-3">
                        <div className="flex items-center justify-between mb-3">
                          <h6 className="font-medium text-gray-800">Restaurant {index + 1}</h6>
                          <button
                            type="button"
                            onClick={() => removeRestaurant(city.id, restaurant.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Restaurant name"
                            value={restaurant.name}
                            onChange={(e) => updateRestaurant(city.id, restaurant.id, 'name', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            placeholder="Location"
                            value={restaurant.location}
                            onChange={(e) => updateRestaurant(city.id, restaurant.id, 'location', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <select
                            value={restaurant.rating || ''}
                            onChange={(e) => updateRestaurant(city.id, restaurant.id, 'rating', e.target.value ? parseInt(e.target.value) : undefined)}
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
                            onChange={(e) => updateRestaurant(city.id, restaurant.id, 'liked', e.target.value === '' ? undefined : e.target.value === 'true')}
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
                          onChange={(e) => updateRestaurant(city.id, restaurant.id, 'review', e.target.value)}
                          rows={2}
                          className="w-full mt-3 px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Activities for this city */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h5 className="font-medium text-gray-900">Activities</h5>
                        <p className="text-xs text-gray-500">Click "Add Activity" multiple times to add more activities</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addActivity(city.id)}
                        className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                      >
                        Add Activity
                      </button>
                    </div>
                    {city.activities.map((activity, index) => (
                      <div key={activity.id} className="bg-gray-50 rounded-lg p-4 mb-3">
                        <div className="flex items-center justify-between mb-3">
                          <h6 className="font-medium text-gray-800">Activity {index + 1}</h6>
                          <button
                            type="button"
                            onClick={() => removeActivity(city.id, activity.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Activity name"
                            value={activity.name}
                            onChange={(e) => updateActivity(city.id, activity.id, 'name', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            placeholder="Location"
                            value={activity.location}
                            onChange={(e) => updateActivity(city.id, activity.id, 'location', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <select
                            value={activity.rating || ''}
                            onChange={(e) => updateActivity(city.id, activity.id, 'rating', e.target.value ? parseInt(e.target.value) : undefined)}
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
                            onChange={(e) => updateActivity(city.id, activity.id, 'liked', e.target.value === '' ? undefined : e.target.value === 'true')}
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
                          onChange={(e) => updateActivity(city.id, activity.id, 'review', e.target.value)}
                          rows={2}
                          className="w-full mt-3 px-3 py-2 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                  </div>
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
