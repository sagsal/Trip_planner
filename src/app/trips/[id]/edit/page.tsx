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
  const [customCityName, setCustomCityName] = useState('');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});

  // All countries of the world with selected cities
  const countriesData = {
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
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      let response;
      try {
        response = await fetch(`/api/trips/${tripId}`, {
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
    const nameToAdd = selectedCity === 'custom' ? customCityName.trim() : selectedCity;
    if (!selectedCountry || !nameToAdd) return;
    
    const newCity: CityData = {
      id: `temp-${Date.now()}`,
      name: nameToAdd,
      country: selectedCountry,
      hotels: [],
      restaurants: [],
      activities: []
    };
    setCitiesData(prev => [...prev, newCity]);
    
    // Reset selections
    setSelectedCountry('');
    setSelectedCity('');
    setCustomCityName('');
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

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout for update
      
      let response;
      try {
        response = await fetch(`/api/trips/${tripId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tripData),
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
                      <label className="block text-sm font-bold mb-2" style={{ color: '#000000', fontWeight: 'bold', fontSize: '14px' }}>
                        🏙️ Custom City Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter custom city name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-900"
                        style={{ color: '#000000' }}
                        value={customCityName}
                        onChange={(e) => setCustomCityName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (customCityName.trim()) {
                              addCity();
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
                      disabled={
                        !selectedCountry ||
                        !selectedCity ||
                        (selectedCity === 'custom' && customCityName.trim() === '')
                      }
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
