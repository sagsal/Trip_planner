'use client';

import { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Copy, Save, Share2, Eye, X, ChevronDown, ChevronUp, Star } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import TripAdvisorSearch from '@/components/TripAdvisorSearch';
import Link from 'next/link';

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

interface Day {
  id: string;
  dayNumber: number;
  restaurants: Restaurant[];
  activities: Activity[];
}

interface CityData {
  id: string;
  name: string;
  country: string;
  numberOfDays: number;
  hotel: Hotel | null;
  hotels: Hotel[];
  days: Day[];
}

interface DraftTrip {
  id: string;
  title: string;
  description?: string;
  countries: string[];
  citiesData: CityData[];
  createdAt: string;
}

interface SharedTrip {
  id: string;
  title: string;
  description?: string;
  user: {
    name: string;
  };
  cities_data: {
    id: string;
    name: string;
    country: string;
    hotels: Hotel[];
    restaurants: Restaurant[];
    activities: Activity[];
  }[];
}

function DraftEditContent() {
  const router = useRouter();
  const params = useParams();
  const draftId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [draftTrip, setDraftTrip] = useState<DraftTrip | null>(null);
  const [sharedTrips, setSharedTrips] = useState<SharedTrip[]>([]);
  const [otherDraftTrips, setOtherDraftTrips] = useState<DraftTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showBrowseTrips, setShowBrowseTrips] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [addingRestaurant, setAddingRestaurant] = useState<{cityId: string, dayId: string} | null>(null);
  const [addingActivity, setAddingActivity] = useState<{cityId: string, dayId: string} | null>(null);
  const [addingHotel, setAddingHotel] = useState<string | null>(null);
  const [newRestaurantName, setNewRestaurantName] = useState('');
  const [newActivityName, setNewActivityName] = useState('');
  const [newHotelName, setNewHotelName] = useState('');
  const [selectedHotelData, setSelectedHotelData] = useState<any>(null);
  const [selectedRestaurantData, setSelectedRestaurantData] = useState<any>(null);
  const [selectedActivityData, setSelectedActivityData] = useState<any>(null);

  // State for adding new city to existing draft
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [customCityName, setCustomCityName] = useState('');
  const [selectedNumberOfDays, setSelectedNumberOfDays] = useState('');

  // Draft trip form state (same as share trip)
  const [draftData, setDraftData] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      loadDraftTrip();
      loadSharedTrips();
      loadOtherDraftTrips();
    } else {
      router.push('/login');
    }
  }, [draftId, router]);

  const loadDraftTrip = async () => {
    try {
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      if (!user) {
        setError('User not found. Please log in again.');
        return;
      }
      const userIdParam = `?userId=${user.id}`;
      const response = await fetch(`/api/trips/${draftId}${userIdParam}`);
      
      if (!response.ok) {
        const errorData = await response.json();
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
      
      // Verify it's a draft trip
      if (!data.isDraft) {
        setError('This trip is not a draft trip');
        return;
      }
      
      // Parse countries safely
      let countries: string[] = [];
      try {
        if (typeof data.countries === 'string') {
          const parsed = JSON.parse(data.countries);
          countries = Array.isArray(parsed) ? parsed : (typeof parsed === 'string' ? JSON.parse(parsed) : []);
        } else if (Array.isArray(data.countries)) {
          countries = data.countries;
        }
      } catch (e) {
        console.error('Error parsing countries:', e);
        countries = [];
      }
      
      // Transform the data to match our interface
      const transformed: DraftTrip = {
        id: data.id,
        title: data.title,
        description: data.description,
        countries,
          citiesData: data.cities_data.map((city: any) => {
            // Group restaurants and activities by day (for now, we'll distribute them)
            // In a full implementation, we'd store day info in DB
            const days: Day[] = [];
            const restaurants = city.restaurants || [];
            const activities = city.activities || [];
            // Calculate numberOfDays from stored data or default to 1
            // If we have items, estimate days based on typical distribution (3-5 items per day)
            // Otherwise default to 1 day
            const totalItems = restaurants.length + activities.length;
            const estimatedDays = totalItems > 0 ? Math.max(1, Math.ceil(totalItems / 4)) : 1;
            const numberOfDays = city.numberOfDays || estimatedDays;

            // Distribute items across days (simple round-robin)
            for (let i = 0; i < numberOfDays; i++) {
              days.push({
                id: `day-${i + 1}`,
                dayNumber: i + 1,
                restaurants: restaurants.filter((_: any, idx: number) => idx % numberOfDays === i),
                activities: activities.filter((_: any, idx: number) => idx % numberOfDays === i)
              });
            }

            return {
              id: city.id,
              name: city.name,
              country: city.country,
              numberOfDays: numberOfDays,
              hotel: city.hotels && city.hotels.length > 0 ? city.hotels[0] : null,
              hotels: city.hotels || [],
              days
            };
          }),
          createdAt: data.createdAt
        };
        setDraftTrip(transformed);
        
        // Load existing draft data if available
        setDraftData({
          startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
          endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : ''
        });
        setError(null);
    } catch (err) {
      console.error('Error loading draft trip:', err);
      setError('An error occurred while loading the draft trip');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSharedTrips = async () => {
    try {
      const response = await fetch('/api/trips?public=true');
      if (response.ok) {
        const data = await response.json();
        // Filter out database trips (used for suggestions only, not for browsing)
        const filteredTrips = (data.trips || []).filter((trip: any) => 
          !trip.title?.includes('DATABASE:') && !trip.title?.includes('TEMPLATE')
        );
        setSharedTrips(filteredTrips);
      }
    } catch (err) {
      console.error('Error loading shared trips:', err);
    }
  };

  const loadOtherDraftTrips = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      const response = await fetch(`/api/trips?drafts=true&userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        // Filter out the current draft trip
        const filtered = (data.trips || []).filter((trip: any) => trip.id !== draftId);
        
        // Transform to match DraftTrip interface
        const transformed: DraftTrip[] = filtered.map((trip: any) => {
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
            description: trip.description,
            countries,
            citiesData: (trip.cities_data || []).map((city: any) => {
              const numberOfDays = city.numberOfDays || 1;
              const days: Day[] = Array.from({ length: numberOfDays }, (_, index) => ({
                id: `day-${index + 1}`,
                dayNumber: index + 1,
                restaurants: [],
                activities: []
              }));
              
              // Distribute restaurants and activities across days
              const restaurants = city.restaurants || [];
              const activities = city.activities || [];
              restaurants.forEach((r: any, idx: number) => {
                const dayIndex = idx % numberOfDays;
                if (days[dayIndex]) {
                  days[dayIndex].restaurants.push({
                    id: r.id,
                    name: r.name || '',
                    location: r.location || '',
                    rating: r.rating || 0,
                    review: r.review || '',
                    liked: r.liked ?? null
                  });
                }
              });
              activities.forEach((a: any, idx: number) => {
                const dayIndex = idx % numberOfDays;
                if (days[dayIndex]) {
                  days[dayIndex].activities.push({
                    id: a.id,
                    name: a.name || '',
                    location: a.location || '',
                    rating: a.rating || 0,
                    review: a.review || '',
                    liked: a.liked ?? null
                  });
                }
              });

              return {
                id: city.id,
                name: city.name,
                country: city.country,
                numberOfDays,
                hotel: city.hotels && city.hotels.length > 0 ? {
                  id: city.hotels[0].id,
                  name: city.hotels[0].name || '',
                  location: city.hotels[0].location || '',
                  rating: city.hotels[0].rating || 0,
                  review: city.hotels[0].review || '',
                  liked: city.hotels[0].liked ?? null
                } : null,
                hotels: city.hotels || [],
                days
              };
            }),
            createdAt: trip.createdAt
          };
        });
        setOtherDraftTrips(transformed);
      }
    } catch (err) {
      console.error('Error loading other draft trips:', err);
    }
  };

  const handleCopyItemToDraft = async (itemType: 'hotel' | 'restaurant' | 'activity', item: any, targetCityId: string, targetDayId?: string) => {
    if (!targetCityId) {
      setError('Please select a city');
      return;
    }

    if ((itemType === 'restaurant' || itemType === 'activity') && !targetDayId) {
      setError('Please select a day for restaurants and activities');
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/trips/${draftId}`, {
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
        await loadDraftTrip();
        setSuccess(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} "${item.name}" added to your draft!`);
        setTimeout(() => setSuccess(null), 5000);
      } else {
        const data = await response.json();
        const errorMsg = data.error || data.details || 'Failed to add item to draft';
        setError(errorMsg);
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('Error copying item:', err);
      setError('An error occurred while adding the item');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleAddHotel = (cityId: string) => {
    setAddingHotel(cityId);
    setNewHotelName('');
  };

  const handleSaveHotel = async () => {
    if (!addingHotel || !newHotelName.trim()) {
      setAddingHotel(null);
      return;
    }

    try {
      setError(null);
      
      // Build location string from TripAdvisor data if available
      let location = '';
      let rating = null;
      let review = '';
      
      if (selectedHotelData) {
        const addr = selectedHotelData.address_obj;
        if (addr) {
          const parts = [
            addr.street1,
            addr.city,
            addr.state,
            addr.country
          ].filter(Boolean);
          location = parts.join(', ');
        }
        
        if (selectedHotelData.rating) {
          rating = Math.round(parseFloat(selectedHotelData.rating));
        }
        
        // Fetch full location details to get web_url if not already available
        let webUrl = selectedHotelData.web_url || null;
        if (selectedHotelData.location_id && !webUrl) {
          try {
            const detailsResponse = await fetch(`/api/tripadvisor/search?locationId=${selectedHotelData.location_id}`);
            if (detailsResponse.ok) {
              const detailsData = await detailsResponse.json();
              webUrl = detailsData.location?.web_url || null;
            }
          } catch (e) {
            console.log('Could not fetch full location details:', e);
          }
        }
        
        // Store TripAdvisor data as JSON in review field (image URL, etc.)
        const tripadvisorData = {
          locationId: selectedHotelData.location_id,
          imageUrl: selectedHotelData.photos?.[0]?.images?.large?.url || 
                   selectedHotelData.photos?.[0]?.images?.medium?.url || 
                   selectedHotelData.photos?.[0]?.images?.original?.url || null,
          numReviews: selectedHotelData.num_reviews,
          webUrl: webUrl
        };
        review = JSON.stringify(tripadvisorData);
      }
      
      const response = await fetch(`/api/trips/${draftId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'hotel',
          item: { 
            name: newHotelName.trim(), 
            location: location,
            rating: rating,
            review: review || null
          },
          cityId: addingHotel
        })
      });

      if (response.ok) {
        loadDraftTrip();
        setSuccess('Hotel added successfully');
        setTimeout(() => setSuccess(null), 3000);
        setAddingHotel(null);
        setNewHotelName('');
        setSelectedHotelData(null);
      } else {
        let errorData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
          }
        } else {
          const text = await response.text();
          errorData = { error: text || `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('Add hotel error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: `/api/trips/${draftId}`
        });
        setError(errorData.error || errorData.message || `Failed to add hotel (${response.status})`);
      }
    } catch (err) {
      console.error('Add hotel exception:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while adding the hotel');
    }
  };

  const handleCancelHotel = () => {
    setAddingHotel(null);
    setNewHotelName('');
    setSelectedHotelData(null);
  };

  const handleHotelSelect = (result: any) => {
    setSelectedHotelData(result);
    // Optionally auto-save or just update the name
  };

  const handleUpdateHotel = async (hotelId: string, field: string, value: any) => {
    try {
      setError(null);
      // Get the hotel to update
      const hotel = draftTrip?.citiesData
        .flatMap(city => city.hotels)
        .find(h => h.id === hotelId);
      
      if (!hotel) {
        setError('Hotel not found');
        return;
      }

      const updatedHotel = {
        ...hotel,
        [field]: value
      };

      const response = await fetch(`/api/hotels/${hotelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedHotel)
      });

      if (response.ok) {
        loadDraftTrip();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update hotel');
      }
    } catch (err) {
      console.error('Error updating hotel:', err);
      setError('An error occurred while updating the hotel');
    }
  };

  const handleDeleteHotel = async (cityId: string, hotelId: string) => {
    if (!confirm('Are you sure you want to delete this hotel?')) return;

    try {
      const response = await fetch(`/api/hotels/${hotelId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadDraftTrip();
        setSuccess('Hotel deleted successfully');
      } else {
        setError('Failed to delete hotel');
      }
    } catch (err) {
      setError('An error occurred while deleting the hotel');
    }
  };

  const handleAddRestaurant = (cityId: string, dayId: string) => {
    setAddingRestaurant({ cityId, dayId });
    setNewRestaurantName('');
  };

  const handleSaveRestaurant = async () => {
    if (!addingRestaurant || !newRestaurantName.trim()) {
      setAddingRestaurant(null);
      return;
    }

    try {
      setError(null);
      
      // Build location string from TripAdvisor data if available
      let location = '';
      let rating = null;
      let review = '';
      
      if (selectedRestaurantData) {
        const addr = selectedRestaurantData.address_obj;
        if (addr) {
          const parts = [
            addr.street1,
            addr.city,
            addr.state,
            addr.country
          ].filter(Boolean);
          location = parts.join(', ');
        }
        
        if (selectedRestaurantData.rating) {
          rating = Math.round(parseFloat(selectedRestaurantData.rating));
        }
        
        // Store TripAdvisor data as JSON in review field
        const tripadvisorData = {
          locationId: selectedRestaurantData.location_id,
          imageUrl: selectedRestaurantData.photos?.[0]?.images?.large?.url || 
                   selectedRestaurantData.photos?.[0]?.images?.medium?.url || 
                   selectedRestaurantData.photos?.[0]?.images?.original?.url || null,
          numReviews: selectedRestaurantData.num_reviews,
          webUrl: selectedRestaurantData.web_url || null
        };
        review = JSON.stringify(tripadvisorData);
      }
      
      const response = await fetch(`/api/trips/${draftId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'restaurant',
          item: { 
            name: newRestaurantName.trim(), 
            location: location,
            rating: rating,
            review: review || null
          },
          cityId: addingRestaurant.cityId,
          dayId: addingRestaurant.dayId
        })
      });

      if (response.ok) {
        loadDraftTrip();
        setSuccess('Restaurant added successfully');
        setTimeout(() => setSuccess(null), 3000);
        setAddingRestaurant(null);
        setNewRestaurantName('');
        setSelectedRestaurantData(null);
      } else {
        let errorData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
          }
        } else {
          const text = await response.text();
          errorData = { error: text || `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('Add restaurant error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: `/api/trips/${draftId}`
        });
        setError(errorData.error || errorData.message || `Failed to add restaurant (${response.status})`);
      }
    } catch (err) {
      console.error('Add restaurant exception:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while adding the restaurant');
    }
  };

  const handleCancelRestaurant = () => {
    setAddingRestaurant(null);
    setNewRestaurantName('');
    setSelectedRestaurantData(null);
  };

  const handleRestaurantSelect = (result: any) => {
    setSelectedRestaurantData(result);
  };

  const handleUpdateRestaurant = async (restaurantId: string, field: string, value: any) => {
    try {
      setError(null);
      // Get the restaurant to update
      const restaurant = draftTrip?.citiesData
        .flatMap(city => city.days.flatMap(day => day.restaurants))
        .find(r => r.id === restaurantId);
      
      if (!restaurant) {
        setError('Restaurant not found');
        return;
      }

      const updatedRestaurant = {
        ...restaurant,
        [field]: value
      };

      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRestaurant)
      });

      if (response.ok) {
        loadDraftTrip();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update restaurant');
      }
    } catch (err) {
      console.error('Error updating restaurant:', err);
      setError('An error occurred while updating the restaurant');
    }
  };

  const handleDeleteRestaurant = async (restaurantId: string) => {
    if (!confirm('Are you sure you want to delete this restaurant?')) return;

    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadDraftTrip();
        setSuccess('Restaurant deleted successfully');
      } else {
        setError('Failed to delete restaurant');
      }
    } catch (err) {
      setError('An error occurred while deleting the restaurant');
    }
  };

  const handleAddActivity = (cityId: string, dayId: string) => {
    setAddingActivity({ cityId, dayId });
    setNewActivityName('');
  };

  const handleSaveActivity = async () => {
    if (!addingActivity || !newActivityName.trim()) {
      setAddingActivity(null);
      return;
    }

    try {
      setError(null);
      
      // Build location string from TripAdvisor data if available
      let location = '';
      let rating = null;
      let review = '';
      
      if (selectedActivityData) {
        const addr = selectedActivityData.address_obj;
        if (addr) {
          const parts = [
            addr.street1,
            addr.city,
            addr.state,
            addr.country
          ].filter(Boolean);
          location = parts.join(', ');
        }
        
        if (selectedActivityData.rating) {
          rating = Math.round(parseFloat(selectedActivityData.rating));
        }
        
        // Store TripAdvisor data as JSON in review field
        const tripadvisorData = {
          locationId: selectedActivityData.location_id,
          imageUrl: selectedActivityData.photos?.[0]?.images?.large?.url || 
                   selectedActivityData.photos?.[0]?.images?.medium?.url || 
                   selectedActivityData.photos?.[0]?.images?.original?.url || null,
          numReviews: selectedActivityData.num_reviews,
          webUrl: selectedActivityData.web_url || null
        };
        review = JSON.stringify(tripadvisorData);
      }
      
      const response = await fetch(`/api/trips/${draftId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'activity',
          item: { 
            name: newActivityName.trim(), 
            location: location,
            rating: rating,
            review: review || null
          },
          cityId: addingActivity.cityId,
          dayId: addingActivity.dayId
        })
      });

      if (response.ok) {
        loadDraftTrip();
        setSuccess('Activity added successfully');
        setTimeout(() => setSuccess(null), 3000);
        setAddingActivity(null);
        setNewActivityName('');
        setSelectedActivityData(null);
      } else {
        let errorData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
          }
        } else {
          const text = await response.text();
          errorData = { error: text || `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('Add activity error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: `/api/trips/${draftId}`
        });
        setError(errorData.error || errorData.message || `Failed to add activity (${response.status})`);
      }
    } catch (err) {
      console.error('Add activity exception:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while adding the activity');
    }
  };

  const handleCancelActivity = () => {
    setAddingActivity(null);
    setNewActivityName('');
    setSelectedActivityData(null);
  };

  const handleActivitySelect = (result: any) => {
    setSelectedActivityData(result);
  };

  const handleUpdateActivity = async (activityId: string, field: string, value: any) => {
    try {
      setError(null);
      // Get the activity to update
      const activity = draftTrip?.citiesData
        .flatMap(city => city.days.flatMap(day => day.activities))
        .find(a => a.id === activityId);
      
      if (!activity) {
        setError('Activity not found');
        return;
      }

      const updatedActivity = {
        ...activity,
        [field]: value
      };

      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedActivity)
      });

      if (response.ok) {
        loadDraftTrip();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update activity');
      }
    } catch (err) {
      console.error('Error updating activity:', err);
      setError('An error occurred while updating the activity');
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadDraftTrip();
        setSuccess('Activity deleted successfully');
      } else {
        setError('Failed to delete activity');
      }
    } catch (err) {
      setError('An error occurred while deleting the activity');
    }
  };

  const handleCopyItem = async (itemType: 'hotel' | 'restaurant' | 'activity', item: any, targetCityId: string, targetDayId?: string) => {
    try {
      const response = await fetch(`/api/trips/${draftId}`, {
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
        loadDraftTrip();
        setSuccess(`${itemType} copied successfully!`);
      } else {
        setError('Failed to copy item');
      }
    } catch (err) {
      setError('An error occurred while copying the item');
    }
  };

  const handleSaveDraft = async () => {
    if (!draftTrip) {
      setError('Draft trip not loaded');
      return;
    }

    try {
      setError(null);
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
      const citiesData = draftTrip.citiesData.map(city => {
        const allRestaurants: any[] = [];
        const allActivities: any[] = [];
        
        city.days.forEach(day => {
          allRestaurants.push(...(day.restaurants || []).filter((r: any) => r.name && r.name.trim() !== ''));
          allActivities.push(...(day.activities || []).filter((a: any) => a.name && a.name.trim() !== ''));
        });

        return {
          name: city.name,
          country: city.country,
          numberOfDays: city.numberOfDays,
          hotels: city.hotel && city.hotel.name && city.hotel.name.trim() ? [city.hotel] : [],
          restaurants: allRestaurants,
          activities: allActivities,
          days: city.days.map(day => ({
            dayNumber: day.dayNumber,
            restaurants: (day.restaurants || []).filter((r: any) => r.name && r.name.trim() !== ''),
            activities: (day.activities || []).filter((a: any) => a.name && a.name.trim() !== '')
          }))
        };
      });

      // Save draft with dates, ratings, and comments - include required fields
      const response = await fetch(`/api/trips/${draftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draftTrip.title,
          description: draftTrip.description || '',
          countries: JSON.stringify(countries),
          cities: JSON.stringify(draftTrip.citiesData.map(c => c.name)),
          citiesData: citiesData,
          startDate: draftData.startDate || null,
          endDate: draftData.endDate || null,
          isDraft: true,
          isPublic: false,
          userId: user.id
        })
      });

      if (response.ok) {
        setSuccess('Draft saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
        // Reload to get updated data
        loadDraftTrip();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save draft');
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      setError('Error saving draft');
    }
  };

  const handleFinalize = async () => {
    if (!draftTrip) {
      setError('Draft trip not loaded');
      return;
    }

    if (!confirm('Are you sure you want to finalize this draft trip? It will become a private trip in your profile (not published).')) {
      return;
    }

    try {
      setError(null);
      
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
      const citiesData = draftTrip.citiesData.map(city => {
        const allRestaurants: any[] = [];
        const allActivities: any[] = [];
        
        city.days.forEach(day => {
          allRestaurants.push(...(day.restaurants || []).filter((r: any) => r.name && r.name.trim() !== ''));
          allActivities.push(...(day.activities || []).filter((a: any) => a.name && a.name.trim() !== ''));
        });

        return {
          name: city.name,
          country: city.country,
          numberOfDays: city.numberOfDays,
          hotels: city.hotel && city.hotel.name && city.hotel.name.trim() ? [city.hotel] : [],
          restaurants: allRestaurants,
          activities: allActivities,
          days: city.days.map(day => ({
            dayNumber: day.dayNumber,
            restaurants: (day.restaurants || []).filter((r: any) => r.name && r.name.trim() !== ''),
            activities: (day.activities || []).filter((a: any) => a.name && a.name.trim() !== '')
          }))
        };
      });

      // Finalize the trip - set isDraft to false and isPublic to false (private)
      const response = await fetch(`/api/trips/${draftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draftTrip.title,
          description: draftTrip.description || '',
          countries: JSON.stringify(countries),
          cities: JSON.stringify(draftTrip.citiesData.map(c => c.name)),
          citiesData: citiesData,
          startDate: draftData.startDate || null,
          endDate: draftData.endDate || null,
          isDraft: false, // Convert from draft to finalized
          isPublic: false, // Keep it private (not published)
          userId: user.id
        })
      });

      if (response.ok) {
        setSuccess('Trip finalized successfully! It is now a private trip in your profile.');
        setTimeout(() => {
          router.push('/account');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to finalize trip');
      }
    } catch (err) {
      console.error('Error finalizing trip:', err);
      setError('An error occurred while finalizing the trip');
    }
  };

  const handleShareTrip = async () => {
    if (!draftTrip) {
      setError('Draft trip not loaded');
      return;
    }

    // Check if dates are provided - required for sharing
    if (!draftData.startDate || !draftData.endDate) {
      setError('Please fill in Start Date and End Date in the Trip Details section before sharing');
      return;
    }

    try {
      setError(null);
      
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
      const citiesData = draftTrip.citiesData.map(city => {
        const allRestaurants: any[] = [];
        const allActivities: any[] = [];
        
        city.days.forEach(day => {
          allRestaurants.push(...(day.restaurants || []).filter((r: any) => r.name && r.name.trim() !== ''));
          allActivities.push(...(day.activities || []).filter((a: any) => a.name && a.name.trim() !== ''));
        });

        return {
          name: city.name,
          country: city.country,
          numberOfDays: city.numberOfDays,
          hotels: city.hotel && city.hotel.name && city.hotel.name.trim() ? [city.hotel] : [],
          restaurants: allRestaurants,
          activities: allActivities,
          days: city.days.map(day => ({
            dayNumber: day.dayNumber,
            restaurants: (day.restaurants || []).filter((r: any) => r.name && r.name.trim() !== ''),
            activities: (day.activities || []).filter((a: any) => a.name && a.name.trim() !== '')
          }))
        };
      });

      // Share the trip directly - set isDraft to false and isPublic to true
      const response = await fetch(`/api/trips/${draftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draftTrip.title,
          description: draftTrip.description || '',
          countries: JSON.stringify(countries),
          cities: JSON.stringify(draftTrip.citiesData.map(c => c.name)),
          citiesData: citiesData,
          startDate: draftData.startDate,
          endDate: draftData.endDate,
          isDraft: false, // Convert from draft to shared
          isPublic: true, // Make it public so all users can see it
          userId: user.id
        })
      });

      if (response.ok) {
        setSuccess('Trip shared successfully! It is now published and visible to all users.');
        setTimeout(() => {
          router.push(`/trips/${draftId}`);
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

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // All countries of the world with selected cities - same as build page
  const countriesData = useMemo(() => ({
    'Afghanistan': ['Kabul', 'Herat', 'Kandahar', 'Mazar-i-Sharif'],
    'Albania': ['Tirana', 'Durrës', 'Vlorë', 'Shkodër'],
    'Algeria': ['Algiers', 'Oran', 'Constantine', 'Annaba'],
    'Andorra': ['Andorra la Vella'],
    'Angola': ['Luanda', 'Huambo', 'Lobito', 'Benguela'],
    'Antigua and Barbuda': ['St. John\'s'],
    'Argentina': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza'],
    'Armenia': ['Yerevan', 'Gyumri', 'Vanadzor'],
    'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
    'Austria': ['Vienna', 'Graz', 'Linz', 'Salzburg'],
    'Azerbaijan': ['Baku', 'Ganja', 'Sumqayit'],
    'Bahamas': ['Nassau', 'Freeport'],
    'Bahrain': ['Manama'],
    'Bangladesh': ['Dhaka', 'Chittagong', 'Khulna', 'Sylhet'],
    'Barbados': ['Bridgetown'],
    'Belarus': ['Minsk', 'Gomel', 'Mogilev'],
    'Belgium': ['Brussels', 'Antwerp', 'Ghent', 'Bruges'],
    'Belize': ['Belize City', 'San Ignacio'],
    'Benin': ['Cotonou', 'Porto-Novo', 'Parakou'],
    'Bhutan': ['Thimphu', 'Phuntsholing'],
    'Bolivia': ['La Paz', 'Santa Cruz', 'Cochabamba'],
    'Bosnia and Herzegovina': ['Sarajevo', 'Banja Luka', 'Tuzla'],
    'Botswana': ['Gaborone', 'Francistown', 'Maun'],
    'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza'],
    'Brunei': ['Bandar Seri Begawan'],
    'Bulgaria': ['Sofia', 'Plovdiv', 'Varna', 'Burgas'],
    'Burkina Faso': ['Ouagadougou', 'Bobo-Dioulasso'],
    'Burundi': ['Bujumbura', 'Gitega'],
    'Cambodia': ['Phnom Penh', 'Siem Reap', 'Battambang'],
    'Cameroon': ['Douala', 'Yaoundé', 'Garoua'],
    'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
    'Cape Verde': ['Praia', 'Mindelo'],
    'Central African Republic': ['Bangui'],
    'Chad': ['N\'Djamena', 'Moundou'],
    'Chile': ['Santiago', 'Valparaíso', 'Concepción'],
    'China': ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu'],
    'Colombia': ['Medellín', 'Bogotá', 'Cartagena', 'Cali', 'Barranquilla'],
    'Comoros': ['Moroni'],
    'Congo': ['Brazzaville', 'Pointe-Noire'],
    'Costa Rica': ['San José', 'Cartago', 'Alajuela'],
    'Croatia': ['Zagreb', 'Split', 'Rijeka', 'Dubrovnik'],
    'Cuba': ['Havana', 'Santiago de Cuba', 'Camagüey'],
    'Cyprus': ['Nicosia', 'Limassol', 'Larnaca'],
    'Czech Republic': ['Prague', 'Brno', 'Ostrava'],
    'Denmark': ['Copenhagen', 'Aarhus', 'Odense'],
    'Djibouti': ['Djibouti'],
    'Dominica': ['Roseau'],
    'Dominican Republic': ['Santo Domingo', 'Santiago', 'La Romana'],
    'East Timor': ['Dili'],
    'Ecuador': ['Quito', 'Guayaquil', 'Cuenca'],
    'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Luxor'],
    'El Salvador': ['San Salvador', 'Santa Ana', 'San Miguel'],
    'Equatorial Guinea': ['Malabo', 'Bata'],
    'Eritrea': ['Asmara', 'Massawa'],
    'Estonia': ['Tallinn', 'Tartu', 'Narva'],
    'Eswatini': ['Mbabane', 'Manzini'],
    'Ethiopia': ['Addis Ababa', 'Dire Dawa', 'Mekelle'],
    'Fiji': ['Suva', 'Lautoka'],
    'Finland': ['Helsinki', 'Tampere', 'Turku'],
    'France': ['Paris', 'Lyon', 'Marseille', 'Nice', 'Toulouse'],
    'Gabon': ['Libreville', 'Port-Gentil'],
    'Gambia': ['Banjul', 'Serekunda'],
    'Georgia': ['Tbilisi', 'Batumi', 'Kutaisi'],
    'Germany': ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt'],
    'Ghana': ['Accra', 'Kumasi', 'Tamale'],
    'Greece': ['Athens', 'Thessaloniki', 'Patras', 'Heraklion'],
    'Grenada': ['St. George\'s'],
    'Guatemala': ['Guatemala City', 'Quetzaltenango'],
    'Guinea': ['Conakry', 'Nzérékoré'],
    'Guinea-Bissau': ['Bissau'],
    'Guyana': ['Georgetown', 'New Amsterdam'],
    'Haiti': ['Port-au-Prince', 'Cap-Haïtien'],
    'Honduras': ['Tegucigalpa', 'San Pedro Sula'],
    'Hungary': ['Budapest', 'Debrecen', 'Szeged'],
    'Iceland': ['Reykjavik', 'Akureyri'],
    'India': ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'],
    'Indonesia': ['Jakarta', 'Surabaya', 'Bandung', 'Medan'],
    'Iran': ['Tehran', 'Mashhad', 'Isfahan', 'Shiraz'],
    'Iraq': ['Baghdad', 'Mosul', 'Basra', 'Erbil'],
    'Ireland': ['Dublin', 'Cork', 'Limerick', 'Galway'],
    'Israel': ['Jerusalem', 'Tel Aviv', 'Haifa', 'Beersheba'],
    'Italy': ['Rome', 'Milan', 'Florence', 'Venice', 'Naples'],
    'Jamaica': ['Kingston', 'Montego Bay'],
    'Japan': ['Tokyo', 'Osaka', 'Kyoto', 'Hiroshima', 'Nagoya'],
    'Jordan': ['Amman', 'Irbid', 'Zarqa'],
    'Kazakhstan': ['Almaty', 'Nur-Sultan', 'Shymkent'],
    'Kenya': ['Nairobi', 'Mombasa', 'Kisumu'],
    'Kiribati': ['Tarawa'],
    'Kosovo': ['Pristina', 'Prizren'],
    'Kuwait': ['Kuwait City', 'Al Ahmadi'],
    'Kyrgyzstan': ['Bishkek', 'Osh'],
    'Laos': ['Vientiane', 'Luang Prabang'],
    'Latvia': ['Riga', 'Daugavpils', 'Liepāja'],
    'Lebanon': ['Beirut', 'Tripoli', 'Sidon'],
    'Lesotho': ['Maseru'],
    'Liberia': ['Monrovia', 'Gbarnga'],
    'Libya': ['Tripoli', 'Benghazi', 'Misrata'],
    'Liechtenstein': ['Vaduz'],
    'Lithuania': ['Vilnius', 'Kaunas', 'Klaipėda'],
    'Luxembourg': ['Luxembourg City'],
    'Madagascar': ['Antananarivo', 'Toamasina'],
    'Malawi': ['Lilongwe', 'Blantyre'],
    'Malaysia': ['Kuala Lumpur', 'George Town', 'Ipoh', 'Johor Bahru'],
    'Maldives': ['Malé'],
    'Mali': ['Bamako', 'Sikasso'],
    'Malta': ['Valletta', 'Sliema'],
    'Marshall Islands': ['Majuro'],
    'Mauritania': ['Nouakchott', 'Nouadhibou'],
    'Mauritius': ['Port Louis'],
    'Mexico': ['Mexico City', 'Cancun', 'Guadalajara', 'Tijuana', 'Puebla'],
    'Micronesia': ['Palikir'],
    'Moldova': ['Chișinău', 'Tiraspol'],
    'Monaco': ['Monaco'],
    'Mongolia': ['Ulaanbaatar', 'Darkhan'],
    'Montenegro': ['Podgorica', 'Nikšić'],
    'Morocco': ['Casablanca', 'Rabat', 'Fez', 'Marrakech'],
    'Mozambique': ['Maputo', 'Beira', 'Nampula'],
    'Myanmar': ['Yangon', 'Mandalay', 'Naypyidaw'],
    'Namibia': ['Windhoek', 'Swakopmund'],
    'Nauru': ['Yaren'],
    'Nepal': ['Kathmandu', 'Pokhara', 'Lalitpur'],
    'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht'],
    'New Zealand': ['Auckland', 'Wellington', 'Christchurch', 'Hamilton'],
    'Nicaragua': ['Managua', 'León', 'Granada'],
    'Niger': ['Niamey', 'Zinder'],
    'Nigeria': ['Lagos', 'Abuja', 'Kano', 'Ibadan'],
    'North Korea': ['Pyongyang', 'Hamhung'],
    'North Macedonia': ['Skopje', 'Bitola'],
    'Norway': ['Oslo', 'Bergen', 'Trondheim', 'Stavanger'],
    'Oman': ['Muscat', 'Salalah'],
    'Pakistan': ['Karachi', 'Lahore', 'Islamabad', 'Faisalabad'],
    'Palau': ['Ngerulmud'],
    'Palestine': ['Jerusalem', 'Ramallah', 'Gaza'],
    'Panama': ['Panama City', 'Colón'],
    'Papua New Guinea': ['Port Moresby', 'Lae'],
    'Paraguay': ['Asunción', 'Ciudad del Este'],
    'Peru': ['Lima', 'Arequipa', 'Cusco', 'Trujillo'],
    'Philippines': ['Manila', 'Quezon City', 'Cebu', 'Davao'],
    'Poland': ['Warsaw', 'Kraków', 'Wrocław', 'Gdańsk'],
    'Portugal': ['Lisbon', 'Porto', 'Coimbra', 'Braga'],
    'Qatar': ['Doha', 'Al Rayyan'],
    'Romania': ['Bucharest', 'Cluj-Napoca', 'Timișoara'],
    'Russia': ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg'],
    'Rwanda': ['Kigali'],
    'Saint Kitts and Nevis': ['Basseterre'],
    'Saint Lucia': ['Castries'],
    'Saint Vincent and the Grenadines': ['Kingstown'],
    'Samoa': ['Apia'],
    'San Marino': ['San Marino'],
    'São Tomé and Príncipe': ['São Tomé'],
    'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina'],
    'Senegal': ['Dakar', 'Thiès'],
    'Serbia': ['Belgrade', 'Novi Sad', 'Niš'],
    'Seychelles': ['Victoria'],
    'Sierra Leone': ['Freetown'],
    'Singapore': ['Singapore'],
    'Slovakia': ['Bratislava', 'Košice'],
    'Slovenia': ['Ljubljana', 'Maribor'],
    'Solomon Islands': ['Honiara'],
    'Somalia': ['Mogadishu', 'Hargeisa'],
    'South Africa': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria'],
    'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu'],
    'South Sudan': ['Juba'],
    'Spain': ['Madrid', 'Barcelona', 'Seville', 'Valencia', 'Bilbao'],
    'Sri Lanka': ['Colombo', 'Kandy', 'Galle'],
    'Sudan': ['Khartoum', 'Omdurman'],
    'Suriname': ['Paramaribo'],
    'Sweden': ['Stockholm', 'Gothenburg', 'Malmö'],
    'Switzerland': ['Zurich', 'Geneva', 'Basel', 'Bern'],
    'Syria': ['Damascus', 'Aleppo', 'Homs'],
    'Taiwan': ['Taipei', 'Kaohsiung', 'Taichung'],
    'Tajikistan': ['Dushanbe', 'Khujand'],
    'Tanzania': ['Dar es Salaam', 'Dodoma', 'Arusha'],
    'Thailand': ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Krabi'],
    'Togo': ['Lomé', 'Sokodé'],
    'Tonga': ['Nuku\'alofa'],
    'Trinidad and Tobago': ['Port of Spain', 'San Fernando'],
    'Tunisia': ['Tunis', 'Sfax', 'Sousse'],
    'Turkey': ['Istanbul', 'Ankara', 'Izmir', 'Antalya'],
    'Turkmenistan': ['Ashgabat', 'Türkmenabat'],
    'Tuvalu': ['Funafuti'],
    'Uganda': ['Kampala', 'Entebbe'],
    'Ukraine': ['Kyiv', 'Kharkiv', 'Odesa', 'Lviv'],
    'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah'],
    'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Edinburgh'],
    'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
    'Uruguay': ['Montevideo', 'Salto'],
    'Uzbekistan': ['Tashkent', 'Samarkand', 'Bukhara'],
    'Vanuatu': ['Port Vila'],
    'Vatican City': ['Vatican City'],
    'Venezuela': ['Caracas', 'Maracaibo', 'Valencia'],
    'Vietnam': ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hai Phong'],
    'Yemen': ['Sana\'a', 'Aden'],
    'Zambia': ['Lusaka', 'Kitwe'],
    'Zimbabwe': ['Harare', 'Bulawayo']
  }), []);

  const handleAddCity = useCallback(async () => {
    const nameToAdd = selectedCity === 'custom' ? customCityName.trim() : selectedCity;
    if (!selectedCountry || !nameToAdd || !selectedNumberOfDays) {
      setError('Please fill in all fields');
      return;
    }
    
    const numberOfDays = parseInt(selectedNumberOfDays);
    if (isNaN(numberOfDays) || numberOfDays < 1) {
      setError('Please enter a valid number of days');
      return;
    }

    if (!draftTrip) {
      setError('Draft trip not loaded');
      return;
    }

    try {
      setError(null);
      // Prepare the new city data
      const newCityData = {
        name: nameToAdd,
        country: selectedCountry,
        numberOfDays: numberOfDays,
        hotels: [],
        restaurants: [],
        activities: [],
        days: Array.from({ length: numberOfDays }, (_, index) => ({
          dayNumber: index + 1,
          restaurants: [],
          activities: []
        }))
      };

      // Get existing cities data
      const existingCitiesData = draftTrip.citiesData.map(city => {
        const allRestaurants: any[] = [];
        const allActivities: any[] = [];
        
        city.days.forEach(day => {
          allRestaurants.push(...(day.restaurants || []).filter((r: any) => r.name && r.name.trim() !== ''));
          allActivities.push(...(day.activities || []).filter((a: any) => a.name && a.name.trim() !== ''));
        });

        return {
          name: city.name,
          country: city.country,
          numberOfDays: city.numberOfDays,
          hotels: city.hotel && city.hotel.name && city.hotel.name.trim() ? [city.hotel] : [],
          restaurants: allRestaurants,
          activities: allActivities,
          days: city.days.map(day => ({
            dayNumber: day.dayNumber,
            restaurants: (day.restaurants || []).filter((r: any) => r.name && r.name.trim() !== ''),
            activities: (day.activities || []).filter((a: any) => a.name && a.name.trim() !== '')
          }))
        };
      });

      // Add the new city
      const updatedCitiesData = [...existingCitiesData, newCityData];

      // Update countries list
      const existingCountries = typeof draftTrip.countries === 'string' 
        ? JSON.parse(draftTrip.countries) 
        : (Array.isArray(draftTrip.countries) ? draftTrip.countries : []);
      const uniqueCountries = Array.from(new Set([...existingCountries, selectedCountry]));

      // Update the trip via API
      const response = await fetch(`/api/trips/${draftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draftTrip.title,
          description: draftTrip.description,
          countries: JSON.stringify(uniqueCountries),
          cities: JSON.stringify([...draftTrip.citiesData.map(c => c.name), nameToAdd]),
          citiesData: updatedCitiesData,
          isDraft: true,
          isPublic: false,
          userId: user.id
        })
      });

      if (response.ok) {
        setSuccess('City added successfully!');
        setTimeout(() => setSuccess(null), 3000);
        // Reset form
        setSelectedCountry('');
        setSelectedCity('');
        setCustomCityName('');
        setSelectedNumberOfDays('');
        // Reload the draft trip
        loadDraftTrip();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add city');
      }
    } catch (err) {
      console.error('Error adding city:', err);
      setError('An error occurred while adding the city');
    }
  }, [selectedCountry, selectedCity, customCityName, selectedNumberOfDays, draftTrip, draftId, user, loadDraftTrip]);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/trips/build"
            className="inline-flex items-center text-[#0160D6] hover:text-[#0160D6]/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Build Trip
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{draftTrip.title}</h1>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                  📝 DRAFT
                </span>
              </div>
              <p className="text-gray-600">{draftTrip.countries.join(', ')}</p>
              <p className="text-sm text-gray-500 mt-2">
                💡 This is your draft trip. Add items from shared trips, then click "Share Trip" when ready to publish.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSaveDraft}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center font-semibold shadow-md"
              >
                <Save className="w-5 h-5 mr-2" />
                Save Draft
              </button>
              <button
                onClick={handleFinalize}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-semibold shadow-md"
              >
                <Eye className="w-5 h-5 mr-2" />
                Finalize Trip
              </button>
              <p className="text-xs text-gray-500 text-center">
                Finalize to save as private trip in your profile
              </p>
              <button
                onClick={handleShareTrip}
                className="px-6 py-3 bg-[#AAB624] text-white rounded-lg hover:bg-[#AAB624]/90 transition-colors flex items-center justify-center font-semibold shadow-md text-lg"
              >
                <Share2 className="w-6 h-6 mr-2" />
                Share Trip Now
              </button>
              <p className="text-xs text-gray-500 text-center mt-1">
                Share to publish for all users to see
              </p>
            </div>
          </div>
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
            <button onClick={() => setSuccess(null)} className="ml-4 text-green-500 hover:text-green-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Trip Details Form (same as share trip) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8 border-2 border-blue-200"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Trip Details</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              Optional - Fill anytime
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Add dates to your draft. You can fill these in now or later before sharing.
          </p>

          <div className="space-y-6">
            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={draftData.startDate}
                  onChange={(e) => setDraftData({ ...draftData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={draftData.endDate}
                  onChange={(e) => setDraftData({ ...draftData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

          </div>
        </motion.div>

        {/* Browse Trips Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowBrowseTrips(!showBrowseTrips)}
            className="flex items-center px-6 py-3 bg-[#0160D6] text-white rounded-lg hover:bg-[#0160D6]/90 transition-colors font-semibold"
          >
            <Eye className="w-5 h-5 mr-2" />
            {showBrowseTrips ? 'Hide' : 'Browse'} Old Trips & Shared Trips
          </button>
        </div>

        {/* Browse Trips */}
        {showBrowseTrips && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 mb-8"
          >
            {/* Your Other Draft Trips Section */}
            {otherDraftTrips.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Reuse from Your Other Draft Trips</h2>
                  <p className="text-gray-600 text-sm">
                    💡 <strong>How it works:</strong> Select a city (and day for restaurants/activities) from your current draft below, then click items from your other draft trips to copy them!
                  </p>
                </div>
                <div className="space-y-6">
                  {otherDraftTrips.map((trip) => (
                    <DraftTripCard
                      key={trip.id}
                      draftTrip={trip}
                      currentDraftCities={draftTrip?.citiesData || []}
                      onCopyItemToDraft={handleCopyItemToDraft}
                      expandedSections={expandedSections}
                      toggleSection={toggleSection}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Shared Trips Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse Shared Trips</h2>
                <p className="text-gray-600 text-sm">
                  💡 <strong>How it works:</strong> Select a city (and day for restaurants/activities) from your current draft below, then click items from shared trips to add them to your draft!
                </p>
              </div>
              {sharedTrips.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No shared trips available yet.</p>
              ) : (
                <div className="space-y-6">
                  {sharedTrips.map((trip) => (
                    <SharedTripCard
                      key={trip.id}
                      trip={trip}
                      draftTrip={draftTrip}
                      onCopyItem={handleCopyItem}
                      expandedSections={expandedSections}
                      toggleSection={toggleSection}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Draft Trip Details */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Draft Trip</h2>
          
          {/* Select Your Destination Section - Add More Cities */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-8 mb-8 border border-blue-200">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🌍</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Add More Destinations</h3>
              <p className="text-gray-600 text-lg">Add more countries and cities to your trip!</p>
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
                      setSelectedCity('');
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
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedCity(value);
                      if (value !== 'custom') {
                        setCustomCityName('');
                      }
                    }}
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
                  <label className="block text-sm font-bold mb-2 text-gray-900">
                    🏙️ Custom City Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter custom city name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-900"
                    value={customCityName}
                    onChange={(e) => setCustomCityName(e.target.value)}
                  />
                </div>
              )}

              {/* Number of Days for this city */}
              {(selectedCity || (selectedCity === 'custom' && customCityName.trim())) && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📅 Number of Days *
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-900"
                    value={selectedNumberOfDays}
                    onChange={(e) => setSelectedNumberOfDays(e.target.value)}
                  >
                    <option value="">Select days...</option>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'day' : 'days'}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleAddCity}
                  disabled={
                    !selectedCountry ||
                    !selectedCity ||
                    (selectedCity === 'custom' && customCityName.trim() === '') ||
                    !selectedNumberOfDays
                  }
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add City ✨
                </button>
              </div>
            </div>
          </div>
          
          {draftTrip.citiesData.map((city) => (
            <div key={city.id} className="mb-8 border-b border-gray-200 pb-8 last:border-b-0">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {city.name}, {city.country} ({city.numberOfDays} days)
              </h3>

              {/* Hotel Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-800">🏨 Hotels</h4>
                  {addingHotel === city.id ? null : (
                    <button
                      onClick={() => handleAddHotel(city.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Hotel
                    </button>
                  )}
                </div>
                {addingHotel === city.id ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                    <TripAdvisorSearch
                      value={newHotelName}
                      onChange={setNewHotelName}
                      onSelect={handleHotelSelect}
                      placeholder={`Search hotels in ${city.name}...`}
                      category="hotels"
                      className="mb-2"
                      cityName={city.name}
                      countryName={city.country}
                    />
                    {selectedHotelData && (
                      <div className="mb-2 p-2 bg-white rounded border border-yellow-300">
                        <p className="text-xs text-gray-600">
                          ✓ Selected: {selectedHotelData.name}
                          {selectedHotelData.rating && (
                            <span className="ml-2">⭐ {selectedHotelData.rating}</span>
                          )}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveHotel}
                        disabled={!newHotelName.trim()}
                        className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelHotel}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
                {city.hotels.length === 0 && addingHotel !== city.id ? (
                  <p className="text-gray-500 text-sm">No hotels added yet</p>
                ) : (
                  <div className="space-y-3">
                    {city.hotels.map((hotel) => {
                      // Parse TripAdvisor data from review field if available
                      let tripadvisorData: any = null;
                      let imageUrl: string | null = null;
                      let tripadvisorWebUrl: string | null = null;
                      let numReviews: string | null = null;
                      try {
                        if (hotel.review) {
                          tripadvisorData = JSON.parse(hotel.review);
                          imageUrl = tripadvisorData.imageUrl || null;
                          tripadvisorWebUrl = tripadvisorData.webUrl || null;
                          numReviews = tripadvisorData.numReviews || null;
                        }
                      } catch (e) {
                        // review is not JSON, treat as regular review text
                      }
                      
                      return (
                        <div key={hotel.id} className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">🏨</span>
                              <h6 className="font-semibold text-gray-800">Hotel</h6>
                            </div>
                            <button
                              onClick={() => handleDeleteHotel(city.id, hotel.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {imageUrl && (
                            <div className="mb-3">
                              <img
                                src={imageUrl}
                                alt={hotel.name}
                                className="w-full h-48 object-cover rounded-lg"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          
                          {/* TripAdvisor Information */}
                          {(hotel.rating || numReviews || tripadvisorWebUrl) && (
                            <div className="mb-3 p-3 bg-white rounded-lg border border-yellow-300">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                {hotel.rating && hotel.rating > 0 && (
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`w-4 h-4 ${
                                            star <= hotel.rating! 
                                              ? 'text-yellow-400 fill-yellow-400' 
                                              : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                      {hotel.rating}/5
                                    </span>
                                  </div>
                                )}
                                {numReviews && (
                                  <span className="text-xs text-gray-600">
                                    {numReviews} reviews on TripAdvisor
                                  </span>
                                )}
                                {tripadvisorWebUrl && (
                                  <a
                                    href={tripadvisorWebUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                                  >
                                    View on TripAdvisor
                                    <Eye className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                              <input
                                type="text"
                                value={hotel.name || ''}
                                onChange={(e) => handleUpdateHotel(hotel.id, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm text-gray-900"
                                placeholder="Hotel name"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                              <input
                                type="text"
                                value={hotel.location || ''}
                                onChange={(e) => handleUpdateHotel(hotel.id, 'location', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm text-gray-900"
                                placeholder="Address"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Days with Restaurants and Activities */}
              {city.days.map((day) => (
                <div key={day.id} className="mb-6 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Day {day.dayNumber}</h4>

                  {/* Restaurants */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-md font-medium text-gray-700">🍽️ Restaurants</h5>
                      {addingRestaurant?.cityId === city.id && addingRestaurant?.dayId === day.id ? null : (
                        <button
                          onClick={() => handleAddRestaurant(city.id, day.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </button>
                      )}
                    </div>
                    {addingRestaurant?.cityId === city.id && addingRestaurant?.dayId === day.id ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                        <TripAdvisorSearch
                          value={newRestaurantName}
                          onChange={setNewRestaurantName}
                          onSelect={handleRestaurantSelect}
                          placeholder="Search for a restaurant..."
                          category="restaurants"
                          className="mb-2"
                        />
                        {selectedRestaurantData && (
                          <div className="mb-2 p-2 bg-white rounded border border-blue-300">
                            <p className="text-xs text-gray-600">
                              ✓ Selected: {selectedRestaurantData.name}
                              {selectedRestaurantData.rating && (
                                <span className="ml-2">⭐ {selectedRestaurantData.rating}</span>
                              )}
                            </p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveRestaurant}
                            disabled={!newRestaurantName.trim()}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelRestaurant}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                    {day.restaurants.length === 0 && (!addingRestaurant || addingRestaurant.cityId !== city.id || addingRestaurant.dayId !== day.id) ? (
                      <p className="text-gray-500 text-sm">No restaurants added yet</p>
                    ) : (
                      <div className="space-y-3">
                        {day.restaurants.map((restaurant, index) => {
                          // Parse TripAdvisor data from review field if available
                          let tripadvisorData: any = null;
                          let imageUrl: string | null = null;
                          try {
                            if (restaurant.review) {
                              tripadvisorData = JSON.parse(restaurant.review);
                              imageUrl = tripadvisorData.imageUrl || null;
                            }
                          } catch (e) {
                            // review is not JSON, treat as regular review text
                          }
                          
                          return (
                            <div key={restaurant.id} className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">🍽️</span>
                                  <h6 className="font-semibold text-gray-800">Restaurant {index + 1}</h6>
                                </div>
                                <button
                                  onClick={() => handleDeleteRestaurant(restaurant.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              {imageUrl && (
                                <div className="mb-3">
                                  <img
                                    src={imageUrl}
                                    alt={restaurant.name}
                                    className="w-full h-48 object-cover rounded-lg"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                                  <input
                                    type="text"
                                    value={restaurant.name || ''}
                                    onChange={(e) => handleUpdateRestaurant(restaurant.id, 'name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm text-gray-900"
                                    placeholder="Restaurant name"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                                  <input
                                    type="text"
                                    value={restaurant.location || ''}
                                    onChange={(e) => handleUpdateRestaurant(restaurant.id, 'location', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm text-gray-900"
                                    placeholder="Address"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Activities */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-md font-medium text-gray-700">🎯 Activities</h5>
                      {addingActivity?.cityId === city.id && addingActivity?.dayId === day.id ? null : (
                        <button
                          onClick={() => handleAddActivity(city.id, day.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </button>
                      )}
                    </div>
                    {addingActivity?.cityId === city.id && addingActivity?.dayId === day.id ? (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
                        <TripAdvisorSearch
                          value={newActivityName}
                          onChange={setNewActivityName}
                          onSelect={handleActivitySelect}
                          placeholder="Search for an activity..."
                          category="attractions"
                          className="mb-2"
                        />
                        {selectedActivityData && (
                          <div className="mb-2 p-2 bg-white rounded border border-purple-300">
                            <p className="text-xs text-gray-600">
                              ✓ Selected: {selectedActivityData.name}
                              {selectedActivityData.rating && (
                                <span className="ml-2">⭐ {selectedActivityData.rating}</span>
                              )}
                            </p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveActivity}
                            disabled={!newActivityName.trim()}
                            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelActivity}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                    {day.activities.length === 0 && (!addingActivity || addingActivity.cityId !== city.id || addingActivity.dayId !== day.id) ? (
                      <p className="text-gray-500 text-sm">No activities added yet</p>
                    ) : (
                      <div className="space-y-3">
                        {day.activities.map((activity, index) => {
                          // Parse TripAdvisor data from review field if available
                          let tripadvisorData: any = null;
                          let imageUrl: string | null = null;
                          try {
                            if (activity.review) {
                              tripadvisorData = JSON.parse(activity.review);
                              imageUrl = tripadvisorData.imageUrl || null;
                            }
                          } catch (e) {
                            // review is not JSON, treat as regular review text
                          }
                          
                          return (
                            <div key={activity.id} className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">🎯</span>
                                  <h6 className="font-semibold text-gray-800">Activity {index + 1}</h6>
                                </div>
                                <button
                                  onClick={() => handleDeleteActivity(activity.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              {imageUrl && (
                                <div className="mb-3">
                                  <img
                                    src={imageUrl}
                                    alt={activity.name}
                                    className="w-full h-48 object-cover rounded-lg"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                                  <input
                                    type="text"
                                    value={activity.name || ''}
                                    onChange={(e) => handleUpdateActivity(activity.id, 'name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-900"
                                    placeholder="Activity name"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                                  <input
                                    type="text"
                                    value={activity.location || ''}
                                    onChange={(e) => handleUpdateActivity(activity.id, 'location', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-900"
                                    placeholder="Address"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Draft Trip Card Component - for reusing items from your own drafts
function DraftTripCard({
  draftTrip,
  currentDraftCities,
  onCopyItemToDraft,
  expandedSections,
  toggleSection
}: {
  draftTrip: DraftTrip;
  currentDraftCities: CityData[];
  onCopyItemToDraft: (itemType: 'hotel' | 'restaurant' | 'activity', item: any, targetCityId: string, targetDayId?: string) => void;
  expandedSections: {[key: string]: boolean};
  toggleSection: (key: string) => void;
}) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<{
    hotels: Set<string>;
    restaurants: Set<string>;
    activities: Set<string>;
  }>({
    hotels: new Set(),
    restaurants: new Set(),
    activities: new Set()
  });
  
  const tripKey = `draft-${draftTrip.id}`;
  
  // Get available days for selected city
  const selectedCityData = currentDraftCities.find(c => c.id === selectedCity);
  const availableDays = selectedCityData?.days || [];

  const toggleItemSelection = (itemType: 'hotel' | 'restaurant' | 'activity', itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev[`${itemType}s` as keyof typeof prev]);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return {
        ...prev,
        [`${itemType}s`]: newSet
      };
    });
  };

  const handleCopySelected = () => {
    if (!selectedCity) {
      alert('Please select a target city first');
      return;
    }

    const hasRestaurants = selectedItems.restaurants.size > 0;
    const hasActivities = selectedItems.activities.size > 0;
    if ((hasRestaurants || hasActivities) && !selectedDay) {
      alert('Please select a day for restaurants and activities');
      return;
    }

    // Copy selected hotels
    draftTrip.citiesData.forEach(city => {
      if (city.hotel && selectedItems.hotels.has(city.hotel.id || '')) {
        onCopyItemToDraft('hotel', city.hotel, selectedCity);
      }
    });

    // Copy selected restaurants
    if (selectedDay) {
      draftTrip.citiesData.forEach(city => {
        city.days.forEach(day => {
          day.restaurants.forEach(restaurant => {
            if (selectedItems.restaurants.has(restaurant.id || '')) {
              onCopyItemToDraft('restaurant', restaurant, selectedCity, selectedDay);
            }
          });
        });
      });
    }

    // Copy selected activities
    if (selectedDay) {
      draftTrip.citiesData.forEach(city => {
        city.days.forEach((day) => {
          day.activities.forEach((activity) => {
            const activityId = activity.id || `${city.id}-${day.id}-${activity.name || 'unnamed'}`;
            if (selectedItems.activities.has(activityId)) {
              onCopyItemToDraft('activity', activity, selectedCity, selectedDay);
            }
          });
        });
      });
    }

    setSelectedItems({ hotels: new Set(), restaurants: new Set(), activities: new Set() });
  };

  const totalSelected = selectedItems.hotels.size + selectedItems.restaurants.size + selectedItems.activities.size;

  return (
    <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <span className="text-2xl mr-2">📝</span>
            {draftTrip.title}
          </h3>
          <p className="text-gray-600 text-sm">
            {Array.isArray(draftTrip.countries) && draftTrip.countries.length > 0
              ? draftTrip.countries.join(', ')
              : 'No countries specified'}
          </p>
        </div>
        <button
          onClick={() => toggleSection(tripKey)}
          className="text-gray-500 hover:text-gray-700"
        >
          {expandedSections[tripKey] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {expandedSections[tripKey] && (
        <div className="space-y-4">
          {/* Select City and Day from Current Draft */}
          <div className="bg-white p-4 rounded-lg border border-green-300">
            <p className="text-sm font-medium text-gray-700 mb-2">Copy items to your current draft:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
              <select
                value={selectedCity || ''}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setSelectedDay(null);
                  setSelectedItems({ hotels: new Set(), restaurants: new Set(), activities: new Set() });
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
              >
                <option value="">Select City from Current Draft</option>
                {currentDraftCities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}, {city.country}</option>
                ))}
              </select>
              {selectedCity && (
                <select
                  value={selectedDay || ''}
                  onChange={(e) => {
                    setSelectedDay(e.target.value);
                    setSelectedItems({ hotels: new Set(), restaurants: new Set(), activities: new Set() });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                >
                  <option value="">Select Day (for restaurants/activities)</option>
                  {availableDays.map(day => (
                    <option key={day.id} value={day.id}>Day {day.dayNumber}</option>
                  ))}
                </select>
              )}
            </div>
            {selectedCity && (
              <div className="flex items-center justify-between bg-green-100 p-3 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  {totalSelected > 0 ? `${totalSelected} item${totalSelected !== 1 ? 's' : ''} selected` : 'Select items below to copy'}
                </span>
                {totalSelected > 0 && (
                  <button
                    onClick={handleCopySelected}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors flex items-center"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy {totalSelected} Selected
                  </button>
                )}
              </div>
            )}
            {currentDraftCities.length === 0 && (
              <p className="text-xs text-orange-600 mt-2">⚠️ Add at least one city to your current draft first!</p>
            )}
          </div>

          {/* Cities with items from this draft */}
          {draftTrip.citiesData.map((city) => {
            const totalItems = (city.hotel ? 1 : 0) + 
              city.days.reduce((sum, day) => sum + day.restaurants.length + day.activities.length, 0);
            
            return (
            <div key={city.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <h4 className="font-semibold text-gray-900 mb-3">{city.name}, {city.country}</h4>
              
              {/* Hotels */}
              {city.hotel && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">🏨 Hotels</h5>
                  <div className="space-y-2">
                    <div 
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        selectedCity 
                          ? selectedItems.hotels.has(city.hotel.id || '') 
                            ? 'bg-blue-100 border-blue-500' 
                            : 'bg-blue-50 border-blue-300 hover:bg-blue-100 cursor-pointer'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => {
                        if (selectedCity) {
                          toggleItemSelection('hotel', city.hotel?.id || '');
                        }
                      }}
                    >
                      <div className="flex items-center flex-1">
                        {selectedCity && (
                          <input
                            type="checkbox"
                            checked={selectedItems.hotels.has(city.hotel?.id || '')}
                            onChange={() => toggleItemSelection('hotel', city.hotel?.id || '')}
                            onClick={(e) => e.stopPropagation()}
                            className="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        )}
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">{city.hotel.name}</span>
                          {city.hotel.location && (
                            <p className="text-xs text-gray-500 mt-1">{city.hotel.location}</p>
                          )}
                        </div>
                      </div>
                      {selectedCity && !selectedItems.hotels.has(city.hotel.id || '') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopyItemToDraft('hotel', city.hotel, selectedCity);
                          }}
                          className="ml-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center transition-colors shadow-sm"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Restaurants */}
              {city.days.some(day => day.restaurants.length > 0) && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">🍽️ Restaurants</h5>
                  <div className="space-y-2">
                    {city.days.map(day => 
                      day.restaurants.map(restaurant => {
                        const isSelected = selectedItems.restaurants.has(restaurant.id || '');
                        return (
                        <div 
                          key={restaurant.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            selectedCity && selectedDay
                              ? isSelected
                                ? 'bg-green-100 border-green-500'
                                : 'bg-green-50 border-green-300 hover:bg-green-100 cursor-pointer'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                          onClick={() => {
                            if (selectedCity && selectedDay) {
                              toggleItemSelection('restaurant', restaurant.id || '');
                            }
                          }}
                        >
                          <div className="flex items-center flex-1">
                            {selectedCity && selectedDay && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleItemSelection('restaurant', restaurant.id || '')}
                                onClick={(e) => e.stopPropagation()}
                                className="mr-3 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                              />
                            )}
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">{restaurant.name}</span>
                              {restaurant.location && (
                                <p className="text-xs text-gray-500 mt-1">{restaurant.location}</p>
                              )}
                            </div>
                          </div>
                          {selectedCity && selectedDay && !isSelected && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCopyItemToDraft('restaurant', restaurant, selectedCity, selectedDay);
                              }}
                              className="ml-3 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center transition-colors shadow-sm"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </button>
                          )}
                        </div>
                      )})
                    )}
                  </div>
                </div>
              )}

              {/* Activities */}
              {city.days.some(day => day.activities.length > 0) && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">🎯 Activities</h5>
                  <div className="space-y-2">
                    {city.days.map(day => 
                      day.activities.map((activity) => {
                        const activityId = activity.id || `${city.id}-${day.id}-${activity.name || 'unnamed'}`;
                        const isSelected = selectedItems.activities.has(activityId);
                        return (
                        <div 
                          key={activityId}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            selectedCity && selectedDay
                              ? isSelected
                                ? 'bg-purple-100 border-purple-500'
                                : 'bg-purple-50 border-purple-300 hover:bg-purple-100 cursor-pointer'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                          onClick={() => {
                            if (selectedCity && selectedDay) {
                              toggleItemSelection('activity', activityId);
                            }
                          }}
                        >
                          <div className="flex items-center flex-1">
                            {selectedCity && selectedDay && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleItemSelection('activity', activityId)}
                                onClick={(e) => e.stopPropagation()}
                                className="mr-3 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              />
                            )}
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">{activity.name}</span>
                              {activity.location && (
                                <p className="text-xs text-gray-500 mt-1">{activity.location}</p>
                              )}
                            </div>
                          </div>
                          {selectedCity && selectedDay && !isSelected && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCopyItemToDraft('activity', activity, selectedCity, selectedDay);
                              }}
                              className="ml-3 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center transition-colors shadow-sm"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </button>
                          )}
                        </div>
                      )})
                    )}
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Shared Trip Card Component (same as in build page)
function SharedTripCard({ 
  trip, 
  draftTrip, 
  onCopyItem, 
  expandedSections, 
  toggleSection 
}: { 
  trip: SharedTrip; 
  draftTrip: DraftTrip;
  onCopyItem: (itemType: 'hotel' | 'restaurant' | 'activity', item: any, targetCityId: string, targetDayId?: string) => void;
  expandedSections: {[key: string]: boolean};
  toggleSection: (key: string) => void;
}) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const tripKey = `trip-${trip.id}`;

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{trip.title}</h3>
          <p className="text-gray-600 text-sm">by {trip.user.name}</p>
        </div>
        <button
          onClick={() => toggleSection(tripKey)}
          className="text-gray-500 hover:text-gray-700"
        >
          {expandedSections[tripKey] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {expandedSections[tripKey] && (
        <div className="space-y-4">
          {/* Select City and Day */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Copy items to:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <select
                value={selectedCity || ''}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setSelectedDay(null);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
              >
                <option value="">Select City</option>
                {draftTrip?.citiesData.map(city => (
                  <option key={city.id} value={city.id}>{city.name}, {city.country}</option>
                ))}
              </select>
              {selectedCity && (
                <select
                  value={selectedDay || ''}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                >
                  <option value="">Select Day (for restaurants/activities)</option>
                  {draftTrip?.citiesData.find(c => c.id === selectedCity)?.days.map(day => (
                    <option key={day.id} value={day.id}>Day {day.dayNumber}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Cities with items */}
          {trip.cities_data.map((city) => (
            <div key={city.id} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">{city.name}, {city.country}</h4>
              
              {/* Hotels */}
              {city.hotels.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">🏨 Hotels</h5>
                  <div className="space-y-2">
                    {city.hotels.map((hotel) => (
                      <div 
                        key={hotel.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          selectedCity 
                            ? 'bg-blue-50 border-blue-300 hover:bg-blue-100 cursor-pointer' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => {
                          if (selectedCity) {
                            onCopyItem('hotel', hotel, selectedCity);
                          }
                        }}
                      >
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">{hotel.name}</span>
                          {hotel.location && (
                            <p className="text-xs text-gray-500 mt-1">{hotel.location}</p>
                          )}
                          {hotel.rating && hotel.rating > 0 && (
                            <div className="flex items-center mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= hotel.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        {selectedCity ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCopyItem('hotel', hotel, selectedCity);
                            }}
                            className="ml-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center transition-colors shadow-sm"
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Save to Draft
                          </button>
                        ) : (
                          <span className="ml-3 text-xs text-gray-400">Select city to save</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Restaurants */}
              {city.restaurants.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">🍽️ Restaurants</h5>
                  <div className="space-y-2">
                    {city.restaurants.map((restaurant) => (
                      <div 
                        key={restaurant.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          selectedCity && selectedDay
                            ? 'bg-green-50 border-green-300 hover:bg-green-100 cursor-pointer' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => {
                          if (selectedCity && selectedDay) {
                            onCopyItem('restaurant', restaurant, selectedCity, selectedDay);
                          }
                        }}
                      >
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">{restaurant.name}</span>
                          {restaurant.location && (
                            <p className="text-xs text-gray-500 mt-1">{restaurant.location}</p>
                          )}
                          {restaurant.rating && restaurant.rating > 0 && (
                            <div className="flex items-center mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= restaurant.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        {selectedCity && selectedDay ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCopyItem('restaurant', restaurant, selectedCity, selectedDay);
                            }}
                            className="ml-3 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center transition-colors shadow-sm"
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Save to Draft
                          </button>
                        ) : (
                          <span className="ml-3 text-xs text-gray-400">Select city & day to save</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activities */}
              {city.activities.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">🎯 Activities</h5>
                  <div className="space-y-2">
                    {city.activities.map((activity) => (
                      <div 
                        key={activity.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          selectedCity && selectedDay
                            ? 'bg-purple-50 border-purple-300 hover:bg-purple-100 cursor-pointer' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => {
                          if (selectedCity && selectedDay) {
                            onCopyItem('activity', activity, selectedCity, selectedDay);
                          }
                        }}
                      >
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">{activity.name}</span>
                          {activity.location && (
                            <p className="text-xs text-gray-500 mt-1">{activity.location}</p>
                          )}
                          {activity.rating && activity.rating > 0 && (
                            <div className="flex items-center mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= activity.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        {selectedCity && selectedDay ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCopyItem('activity', activity, selectedCity, selectedDay);
                            }}
                            className="ml-3 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center transition-colors shadow-sm"
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Save to Draft
                          </button>
                        ) : (
                          <span className="ml-3 text-xs text-gray-400">Select city & day to save</span>
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
    </div>
  );
}

export default function DraftEditPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DraftEditContent />
    </Suspense>
  );
}

