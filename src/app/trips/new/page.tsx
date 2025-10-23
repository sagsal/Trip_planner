'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Plus, Minus, MapPin, Calendar, Star, Save, X } from 'lucide-react';

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

export default function NewTripPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    countries: [''],
    cities: ['']
  });

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (field: 'countries' | 'cities', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'countries' | 'cities') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'countries' | 'cities', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const addHotel = () => {
    setHotels(prev => [...prev, {
      id: Date.now().toString(),
      name: '',
      location: '',
      rating: 0,
      review: '',
      liked: null
    }]);
  };

  const updateHotel = (id: string, field: keyof Hotel, value: any) => {
    setHotels(prev => prev.map(hotel => 
      hotel.id === id ? { ...hotel, [field]: value } : hotel
    ));
  };

  const removeHotel = (id: string) => {
    setHotels(prev => prev.filter(hotel => hotel.id !== id));
  };

  const addRestaurant = () => {
    setRestaurants(prev => [...prev, {
      id: Date.now().toString(),
      name: '',
      location: '',
      rating: 0,
      review: '',
      liked: null
    }]);
  };

  const updateRestaurant = (id: string, field: keyof Restaurant, value: any) => {
    setRestaurants(prev => prev.map(restaurant => 
      restaurant.id === id ? { ...restaurant, [field]: value } : restaurant
    ));
  };

  const removeRestaurant = (id: string) => {
    setRestaurants(prev => prev.filter(restaurant => restaurant.id !== id));
  };

  const addActivity = () => {
    setActivities(prev => [...prev, {
      id: Date.now().toString(),
      name: '',
      location: '',
      rating: 0,
      review: '',
      liked: null
    }]);
  };

  const updateActivity = (id: string, field: keyof Activity, value: any) => {
    setActivities(prev => prev.map(activity => 
      activity.id === id ? { ...activity, [field]: value } : activity
    ));
  };

  const removeActivity = (id: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          countries: formData.countries.filter(c => c.trim() !== ''),
          cities: formData.cities.filter(c => c.trim() !== ''),
          hotels: hotels.filter(h => h.name.trim() !== ''),
          restaurants: restaurants.filter(r => r.name.trim() !== ''),
          activities: activities.filter(a => a.name.trim() !== '')
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Countries */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Countries Visited *
                </label>
                {formData.countries.map((country, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => handleArrayChange('countries', index, e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter country name"
                    />
                    {formData.countries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('countries', index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('countries')}
                  className="flex items-center text-blue-600 hover:text-blue-700 mt-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Country
                </button>
              </div>

              {/* Cities */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cities Visited *
                </label>
                {formData.cities.map((city, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => handleArrayChange('cities', index, e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter city name"
                    />
                    {formData.cities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('cities', index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('cities')}
                  className="flex items-center text-blue-600 hover:text-blue-700 mt-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add City
                </button>
              </div>
            </div>

            {/* Hotels */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Hotels</h2>
                <button
                  type="button"
                  onClick={addHotel}
                  className="flex items-center px-4 py-2 bg-[#AAB624] text-white rounded-lg hover:bg-[#AAB624]/90 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Hotel
                </button>
              </div>

              {hotels.map((hotel) => (
                <div key={hotel.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">Hotel Details</h3>
                    <button
                      type="button"
                      onClick={() => removeHotel(hotel.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={hotel.name}
                        onChange={(e) => updateHotel(hotel.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0160D6] focus:border-transparent"
                        placeholder="Hotel name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={hotel.location}
                        onChange={(e) => updateHotel(hotel.id, 'location', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0160D6] focus:border-transparent"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => updateHotel(hotel.id, 'rating', rating)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            hotel.rating >= rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          <Star className="w-5 h-5 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
                    <textarea
                      value={hotel.review}
                      onChange={(e) => updateHotel(hotel.id, 'review', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="What did you think about this hotel?"
                    />
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Overall Experience</label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => updateHotel(hotel.id, 'liked', true)}
                        className={`px-4 py-2 rounded-lg ${
                          hotel.liked === true ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        Loved it
                      </button>
                      <button
                        type="button"
                        onClick={() => updateHotel(hotel.id, 'liked', false)}
                        className={`px-4 py-2 rounded-lg ${
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

            {/* Restaurants */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Restaurants</h2>
                <button
                  type="button"
                  onClick={addRestaurant}
                  className="flex items-center px-4 py-2 bg-[#AAB624] text-white rounded-lg hover:bg-[#AAB624]/90 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Restaurant
                </button>
              </div>

              {restaurants.map((restaurant) => (
                <div key={restaurant.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">Restaurant Details</h3>
                    <button
                      type="button"
                      onClick={() => removeRestaurant(restaurant.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={restaurant.name}
                        onChange={(e) => updateRestaurant(restaurant.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0160D6] focus:border-transparent"
                        placeholder="Restaurant name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={restaurant.location}
                        onChange={(e) => updateRestaurant(restaurant.id, 'location', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0160D6] focus:border-transparent"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => updateRestaurant(restaurant.id, 'rating', rating)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            restaurant.rating >= rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          <Star className="w-5 h-5 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
                    <textarea
                      value={restaurant.review}
                      onChange={(e) => updateRestaurant(restaurant.id, 'review', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="What did you think about this restaurant?"
                    />
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Overall Experience</label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => updateRestaurant(restaurant.id, 'liked', true)}
                        className={`px-4 py-2 rounded-lg ${
                          restaurant.liked === true ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        Loved it
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRestaurant(restaurant.id, 'liked', false)}
                        className={`px-4 py-2 rounded-lg ${
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

            {/* Activities */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Activities</h2>
                <button
                  type="button"
                  onClick={addActivity}
                  className="flex items-center px-4 py-2 bg-[#AAB624] text-white rounded-lg hover:bg-[#AAB624]/90 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Activity
                </button>
              </div>

              {activities.map((activity) => (
                <div key={activity.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">Activity Details</h3>
                    <button
                      type="button"
                      onClick={() => removeActivity(activity.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={activity.name}
                        onChange={(e) => updateActivity(activity.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0160D6] focus:border-transparent"
                        placeholder="Activity name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={activity.location}
                        onChange={(e) => updateActivity(activity.id, 'location', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0160D6] focus:border-transparent"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => updateActivity(activity.id, 'rating', rating)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            activity.rating >= rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          <Star className="w-5 h-5 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
                    <textarea
                      value={activity.review}
                      onChange={(e) => updateActivity(activity.id, 'review', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="What did you think about this activity?"
                    />
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Overall Experience</label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => updateActivity(activity.id, 'liked', true)}
                        className={`px-4 py-2 rounded-lg ${
                          activity.liked === true ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        Loved it
                      </button>
                      <button
                        type="button"
                        onClick={() => updateActivity(activity.id, 'liked', false)}
                        className={`px-4 py-2 rounded-lg ${
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
