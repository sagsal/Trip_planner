'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Plus, Minus, MapPin, Calendar, Star, Save, X, ChevronDown } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Hotel {
  id: string;
  name: string;
  location: string;
  rating: number;
  review: string;
  liked: boolean | null;
}

interface Restaurant {
  id: string;
  name: string;
  location: string;
  rating: number;
  review: string;
  liked: boolean | null;
}

interface Activity {
  id: string;
  name: string;
  location: string;
  rating: number;
  review: string;
  liked: boolean | null;
}

interface CityData {
  id: string;
  name: string;
  country: string;
  hotels: Hotel[];
  restaurants: Restaurant[];
  activities: Activity[];
}

function NewTripContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    countries: ['']
  });

  const [citiesData, setCitiesData] = useState<CityData[]>([]);

  // State for adding new city
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});

  // Load user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // Redirect to login if no user data
      router.push('/login');
    }
  }, [router]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (field: 'countries', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addCity = () => {
    if (!selectedCountry || !selectedCity) return;
    
    const newCity: CityData = {
      id: Date.now().toString(),
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
      id: Date.now().toString(),
      name: '',
      location: '',
      rating: 0,
      review: '',
      liked: null
    };
    setCitiesData(prev => prev.map(city => 
      city.id === cityId 
        ? { ...city, hotels: [...city.hotels, newHotel] }
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

  const removeHotel = (cityId: string, hotelId: string) => {
    setCitiesData(prev => prev.map(city => 
      city.id === cityId 
        ? { ...city, hotels: city.hotels.filter(hotel => hotel.id !== hotelId) }
        : city
    ));
  };

  const addRestaurant = (cityId: string) => {
    const newRestaurant: Restaurant = {
      id: Date.now().toString(),
      name: '',
      location: '',
      rating: 0,
      review: '',
      liked: null
    };
    setCitiesData(prev => prev.map(city => 
      city.id === cityId 
        ? { ...city, restaurants: [...city.restaurants, newRestaurant] }
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

  const removeRestaurant = (cityId: string, restaurantId: string) => {
    setCitiesData(prev => prev.map(city => 
      city.id === cityId 
        ? { ...city, restaurants: city.restaurants.filter(restaurant => restaurant.id !== restaurantId) }
        : city
    ));
  };

  const addActivity = (cityId: string) => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      name: '',
      location: '',
      rating: 0,
      review: '',
      liked: null
    };
    setCitiesData(prev => prev.map(city => 
      city.id === cityId 
        ? { ...city, activities: [...city.activities, newActivity] }
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

  const removeActivity = (cityId: string, activityId: string) => {
    setCitiesData(prev => prev.map(city => 
      city.id === cityId 
        ? { ...city, activities: city.activities.filter(activity => activity.id !== activityId) }
        : city
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!user) {
      setError('Please log in to create a trip');
      setIsLoading(false);
      return;
    }

    try {

      // Debug: Log what we're sending
      console.log('Cities Data being sent:', citiesData);
      console.log('Filtered Cities Data:', citiesData.map(city => ({
        name: city.name,
        country: city.country,
        hotels: city.hotels.filter(h => h.name.trim() !== ''),
        restaurants: city.restaurants.filter(r => r.name.trim() !== ''),
        activities: city.activities.filter(a => a.name.trim() !== '')
      })));

      // Check if any cities have items but they're empty
      const hasEmptyItems = citiesData.some(city => 
        (city.hotels.length > 0 && city.hotels.every(h => h.name.trim() === '')) ||
        (city.restaurants.length > 0 && city.restaurants.every(r => r.name.trim() === '')) ||
        (city.activities.length > 0 && city.activities.every(a => a.name.trim() === ''))
      );

      if (hasEmptyItems) {
        setError('Please fill in the names for all hotels, restaurants, and activities before saving.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          countries: formData.countries.filter(c => c.trim() !== ''),
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
        }),
      });

      if (response.ok) {
        router.push('/account');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create trip');
      }
    } catch (error) {
      setError('An error occurred while creating the trip');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Trip</h1>
            <p className="text-gray-600">Document your travel experience with detailed reviews</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Trip Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Trip Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trip Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="e.g., Singapore Adventure 2024"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Tell us about your trip..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    min={new Date(new Date().setFullYear(new Date().getFullYear() - 3)).toISOString().split('T')[0]}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                    min={new Date(new Date().setFullYear(new Date().getFullYear() - 3)).toISOString().split('T')[0]}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>
              </div>

              {/* Country */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.countries[0] || ''}
                  onChange={(e) => handleArrayChange('countries', 0, e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Enter country name"
                />
              </div>
            </div>

            {/* Cities and their data */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Cities & Details</h2>
              </div>

              {/* Country & City Selection */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-8 mb-8 border border-blue-200">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">🌍</div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">Select Your Destination</h3>
                  <p className="text-gray-600 text-lg">First choose a country, then select a city!</p>
                </div>
                
                <div className="max-w-2xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🌍 Country *
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
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
                <div className="text-center py-12">
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-8 max-w-2xl mx-auto border border-gray-200">
                    <div className="text-6xl mb-4">🏙️</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Plan Your Trip?</h3>
                    <p className="text-gray-600 mb-6">Add your first city above to unlock all the planning features!</p>
                    
                    {/* Interactive Preview */}
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4">✨ What happens after adding a city:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-2xl mb-2">🏨</div>
                          <div className="font-medium text-blue-900">Hotels</div>
                          <div className="text-blue-700">Add multiple hotels</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-2xl mb-2">🍽️</div>
                          <div className="font-medium text-green-900">Restaurants</div>
                          <div className="text-green-700">Add multiple restaurants</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="text-2xl mb-2">🎯</div>
                          <div className="font-medium text-purple-900">Activities</div>
                          <div className="text-purple-700">Add multiple activities</div>
                        </div>
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
                    {/* Hotels Section */}
                    <div className="border border-gray-200 rounded-lg">
                      <button
                        type="button"
                        onClick={() => toggleSection(city.id, 'hotels')}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">🏨</span>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">Hotels</h4>
                            <p className="text-sm text-gray-600">{city.hotels.length} hotel{city.hotels.length !== 1 ? 's' : ''} added</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {city.hotels.length}
                          </span>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections[`${city.id}-hotels`] ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      
                      {expandedSections[`${city.id}-hotels`] && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-gray-600">Add hotels for {city.name}</p>
                            <button
                              type="button"
                              onClick={() => addHotel(city.id)}
                              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Hotel
                            </button>
                          </div>
                    {city.hotels.map((hotel, index) => (
                      <div key={hotel.id} className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-5 mb-4 border border-blue-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">🏨</span>
                            <h5 className="font-semibold text-gray-800">Hotel {index + 1}</h5>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeHotel(city.id, hotel.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                            <input
                              type="text"
                              value={hotel.name}
                              onChange={(e) => updateHotel(city.id, hotel.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0160D6] focus:border-transparent text-black"
                              placeholder="Hotel name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                              type="text"
                              value={hotel.location}
                              onChange={(e) => updateHotel(city.id, hotel.id, 'location', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0160D6] focus:border-transparent text-black"
                              placeholder="Address"
                            />
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                          <div className="flex items-center space-x-2">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                type="button"
                                onClick={() => updateHotel(city.id, hotel.id, 'rating', rating)}
                                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  hotel.rating >= rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              >
                                <Star className="w-4 h-4 fill-current" />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
                          <textarea
                            value={hotel.review}
                            onChange={(e) => updateHotel(city.id, hotel.id, 'review', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                            placeholder="What did you think about this hotel?"
                          />
                        </div>
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Overall Experience</label>
                          <div className="flex space-x-3">
                            <button
                              type="button"
                              onClick={() => updateHotel(city.id, hotel.id, 'liked', true)}
                              className={`px-3 py-1 rounded-lg text-sm ${
                                hotel.liked === true ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              Loved it
                            </button>
                            <button
                              type="button"
                              onClick={() => updateHotel(city.id, hotel.id, 'liked', false)}
                              className={`px-3 py-1 rounded-lg text-sm ${
                                hotel.liked === false ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              Not great
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                        </div>
                      )}
                    </div>

                    {/* Restaurants Section */}
                    <div className="border border-gray-200 rounded-lg">
                      <button
                        type="button"
                        onClick={() => toggleSection(city.id, 'restaurants')}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">🍽️</span>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">Restaurants</h4>
                            <p className="text-sm text-gray-600">{city.restaurants.length} restaurant{city.restaurants.length !== 1 ? 's' : ''} added</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            {city.restaurants.length}
                          </span>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections[`${city.id}-restaurants`] ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      
                      {expandedSections[`${city.id}-restaurants`] && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-gray-600">Add restaurants for {city.name}</p>
                            <button
                              type="button"
                              onClick={() => addRestaurant(city.id)}
                              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Restaurant
                            </button>
                          </div>
                          {city.restaurants.map((restaurant, index) => (
                            <div key={restaurant.id} className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-5 mb-4 border border-green-200">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <span className="text-xl">🍽️</span>
                                  <h5 className="font-semibold text-gray-800">Restaurant {index + 1}</h5>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeRestaurant(city.id, restaurant.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                  <input
                                    type="text"
                                    value={restaurant.name}
                                    onChange={(e) => updateRestaurant(city.id, restaurant.id, 'name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                                    placeholder="Restaurant name"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                  <input
                                    type="text"
                                    value={restaurant.location}
                                    onChange={(e) => updateRestaurant(city.id, restaurant.id, 'location', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                                    placeholder="Address"
                                  />
                                </div>
                              </div>
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                                <div className="flex items-center space-x-2">
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <button
                                      key={rating}
                                      type="button"
                                      onClick={() => updateRestaurant(city.id, restaurant.id, 'rating', rating)}
                                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                        restaurant.rating >= rating ? 'text-yellow-400' : 'text-gray-300'
                                      }`}
                                    >
                                      <Star className="w-4 h-4 fill-current" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
                                <textarea
                                  value={restaurant.review}
                                  onChange={(e) => updateRestaurant(city.id, restaurant.id, 'review', e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                                  placeholder="What did you think about this restaurant?"
                                />
                              </div>
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Overall Experience</label>
                                <div className="flex space-x-3">
                                  <button
                                    type="button"
                                    onClick={() => updateRestaurant(city.id, restaurant.id, 'liked', true)}
                                    className={`px-3 py-1 rounded-lg text-sm ${
                                      restaurant.liked === true ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    Loved it
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateRestaurant(city.id, restaurant.id, 'liked', false)}
                                    className={`px-3 py-1 rounded-lg text-sm ${
                                      restaurant.liked === false ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    Not great
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Activities Section */}
                    <div className="border border-gray-200 rounded-lg">
                      <button
                        type="button"
                        onClick={() => toggleSection(city.id, 'activities')}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">🎯</span>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">Activities</h4>
                            <p className="text-sm text-gray-600">{city.activities.length} activit{city.activities.length !== 1 ? 'ies' : 'y'} added</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                            {city.activities.length}
                          </span>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections[`${city.id}-activities`] ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      
                      {expandedSections[`${city.id}-activities`] && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-gray-600">Add activities for {city.name}</p>
                            <button
                              type="button"
                              onClick={() => addActivity(city.id)}
                              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Activity
                            </button>
                          </div>
                          {city.activities.map((activity, index) => (
                            <div key={activity.id} className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-5 mb-4 border border-purple-200">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <span className="text-xl">🎯</span>
                                  <h5 className="font-semibold text-gray-800">Activity {index + 1}</h5>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeActivity(city.id, activity.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                  <input
                                    type="text"
                                    value={activity.name}
                                    onChange={(e) => updateActivity(city.id, activity.id, 'name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                                    placeholder="Activity name"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                  <input
                                    type="text"
                                    value={activity.location}
                                    onChange={(e) => updateActivity(city.id, activity.id, 'location', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                                    placeholder="Address"
                                  />
                                </div>
                              </div>
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                                <div className="flex items-center space-x-2">
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <button
                                      key={rating}
                                      type="button"
                                      onClick={() => updateActivity(city.id, activity.id, 'rating', rating)}
                                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                        activity.rating >= rating ? 'text-yellow-400' : 'text-gray-300'
                                      }`}
                                    >
                                      <Star className="w-4 h-4 fill-current" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
                                <textarea
                                  value={activity.review}
                                  onChange={(e) => updateActivity(city.id, activity.id, 'review', e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                                  placeholder="What did you think about this activity?"
                                />
                              </div>
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Overall Experience</label>
                                <div className="flex space-x-3">
                                  <button
                                    type="button"
                                    onClick={() => updateActivity(city.id, activity.id, 'liked', true)}
                                    className={`px-3 py-1 rounded-lg text-sm ${
                                      activity.liked === true ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    Loved it
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateActivity(city.id, activity.id, 'liked', false)}
                                    className={`px-3 py-1 rounded-lg text-sm ${
                                      activity.liked === false ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    Not great
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Another City Button */}
              {citiesData.length > 0 && (
                <div className="text-center mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      // Scroll to top to show the country/city selection
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-semibold text-lg shadow-lg"
                  >
                    🌍 Add Another City
                  </button>
                  <p className="text-sm text-gray-600 mt-2">Click to add more cities to your trip</p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center px-6 py-3 bg-[#F13B13] text-white rounded-lg hover:bg-[#F13B13]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving Trip...' : 'Save Trip'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default function NewTripPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <NewTripContent />
    </Suspense>
  );
}
