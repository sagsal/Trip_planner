'use client';

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
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
  days: Day[];
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
    numberOfDays: '',
    countries: ['']
  });

  const [citiesData, setCitiesData] = useState<CityData[]>([]);

  // State for adding new city
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [customCityName, setCustomCityName] = useState('');
  const [selectedNumberOfDays, setSelectedNumberOfDays] = useState('');
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
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

  // All countries of the world with selected cities - memoized for performance
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

  const toggleSection = useCallback((cityId: string, section: string) => {
    const key = `${cityId}-${section}`;
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleArrayChange = useCallback((field: 'countries', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  }, []);

  const addCity = () => {
    const nameToAdd = selectedCity === 'custom' ? customCityName.trim() : selectedCity;
    if (!selectedCountry || !nameToAdd || !selectedNumberOfDays) return;
    
    const numberOfDays = parseInt(selectedNumberOfDays);
    if (isNaN(numberOfDays) || numberOfDays < 1) return;

    // Create days array
    const days: Day[] = Array.from({ length: numberOfDays }, (_, index) => ({
      id: `${Date.now()}-day-${index + 1}`,
      dayNumber: index + 1,
      restaurants: [],
      activities: []
    }));

    const newCity: CityData = {
      id: Date.now().toString(),
      name: nameToAdd,
      country: selectedCountry,
      numberOfDays: numberOfDays,
      hotel: selectedHotel,
      days: days
    };
    setCitiesData(prev => [...prev, newCity]);
    
    // Reset selections
    setSelectedCountry('');
    setSelectedCity('');
    setCustomCityName('');
    setSelectedNumberOfDays('');
    setSelectedHotel(null);
  };

  // Hotel management - now single hotel per city
  const updateHotel = (cityId: string, field: keyof Hotel, value: any) => {
    setCitiesData(prev => prev.map(city => {
      if (city.id === cityId) {
        const updatedHotel = city.hotel ? { ...city.hotel, [field]: value } : {
          id: Date.now().toString(),
          name: '',
          location: '',
          rating: 0,
          review: '',
          liked: null,
          [field]: value
        };
        return { ...city, hotel: updatedHotel };
      }
      return city;
    }));
  };

  const setHotelForCity = (cityId: string, hotel: Hotel | null) => {
    setCitiesData(prev => prev.map(city => 
      city.id === cityId ? { ...city, hotel } : city
    ));
  };

  const removeCity = (cityId: string) => {
    setCitiesData(prev => prev.filter(city => city.id !== cityId));
  };

  const updateCity = (cityId: string, field: keyof CityData, value: any) => {
    setCitiesData(prev => prev.map(city => 
      city.id === cityId ? { ...city, [field]: value } : city
    ));
  };

  // Restaurant management per day
  const addRestaurant = (cityId: string, dayId: string) => {
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
        ? { 
            ...city, 
            days: city.days.map(day => 
              day.id === dayId 
                ? { ...day, restaurants: [...day.restaurants, newRestaurant] }
                : day
            )
          }
        : city
    ));
  };

  const updateRestaurant = (cityId: string, dayId: string, restaurantId: string, field: keyof Restaurant, value: any) => {
    setCitiesData(prev => prev.map(city => 
      city.id === cityId 
        ? { 
            ...city, 
            days: city.days.map(day => 
              day.id === dayId
                ? {
                    ...day,
                    restaurants: day.restaurants.map(restaurant => 
                      restaurant.id === restaurantId ? { ...restaurant, [field]: value } : restaurant
                    )
                  }
                : day
            )
          }
        : city
    ));
  };

  const removeRestaurant = (cityId: string, dayId: string, restaurantId: string) => {
    setCitiesData(prev => prev.map(city => 
      city.id === cityId 
        ? { 
            ...city, 
            days: city.days.map(day => 
              day.id === dayId
                ? { ...day, restaurants: day.restaurants.filter(restaurant => restaurant.id !== restaurantId) }
                : day
            )
          }
        : city
    ));
  };

  // Activity management per day
  const addActivity = (cityId: string, dayId: string) => {
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
        ? { 
            ...city, 
            days: city.days.map(day => 
              day.id === dayId 
                ? { ...day, activities: [...day.activities, newActivity] }
                : day
            )
          }
        : city
    ));
  };

  const updateActivity = (cityId: string, dayId: string, activityId: string, field: keyof Activity, value: any) => {
    setCitiesData(prev => prev.map(city => 
      city.id === cityId 
        ? { 
            ...city, 
            days: city.days.map(day => 
              day.id === dayId
                ? {
                    ...day,
                    activities: day.activities.map(activity => 
                      activity.id === activityId ? { ...activity, [field]: value } : activity
                    )
                  }
                : day
            )
          }
        : city
    ));
  };

  const removeActivity = (cityId: string, dayId: string, activityId: string) => {
    setCitiesData(prev => prev.map(city => 
      city.id === cityId 
        ? { 
            ...city, 
            days: city.days.map(day => 
              day.id === dayId
                ? { ...day, activities: day.activities.filter(activity => activity.id !== activityId) }
                : day
            )
          }
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

      // Collect unique countries from cities (filter out empty strings)
      const uniqueCountries = Array.from(new Set(
        citiesData
          .map(city => city.country)
          .filter(country => country && country.trim() !== '')
      ));
      
      // Validate that we have at least one country
      if (uniqueCountries.length === 0) {
        setError('Please ensure at least one city has a valid country');
        setIsLoading(false);
        return;
      }

      // Transform new structure to API format
      // Flatten days: collect all restaurants and activities from all days
      // Hotels are already at city level
      const transformedCitiesData = citiesData.map(city => {
        const allRestaurants: Restaurant[] = [];
        const allActivities: Activity[] = [];
        
        city.days.forEach(day => {
          allRestaurants.push(...day.restaurants.filter(r => r.name.trim() !== ''));
          allActivities.push(...day.activities.filter(a => a.name.trim() !== ''));
        });

        return {
          name: city.name,
          country: city.country,
          numberOfDays: city.numberOfDays,
          hotels: city.hotel && city.hotel.name.trim() ? [city.hotel] : [],
          restaurants: allRestaurants,
          activities: allActivities,
          days: city.days.map(day => ({
            dayNumber: day.dayNumber,
            restaurants: day.restaurants.filter(r => r.name.trim() !== ''),
            activities: day.activities.filter(a => a.name.trim() !== '')
          }))
        };
      });

      // Hotels, restaurants, and activities are optional - no validation needed

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout for trip creation
      
      let response;
      try {
        response = await fetch('/api/trips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            countries: uniqueCountries, // Use countries from cities
            cities: JSON.stringify(citiesData.map(c => c.name)),
            citiesData: transformedCitiesData,
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            isDraft: false // This is a shared trip, not a draft
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          setError('Request timeout. Please try again.');
          setIsLoading(false);
          return;
        }
        throw fetchError;
      }

      if (response.ok) {
        router.push('/account');
      } else {
        let errorMessage = 'Failed to create trip';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            errorMessage = data.details ? `${data.error}: ${data.details}` : (data.error || errorMessage);
            console.error('Trip creation failed:', data);
          } else {
            const text = await response.text();
            errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
            console.error('Trip creation failed - non-JSON response:', text);
          }
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
          console.error('Error parsing response:', parseError);
        }
        setError(errorMessage);
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

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Days *
                </label>
                <select
                  name="numberOfDays"
                  value={formData.numberOfDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, numberOfDays: e.target.value }))}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <option value="">Select number of days</option>
                  {Array.from({ length: 90 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'day' : 'days'}</option>
                  ))}
                </select>
              </div>

                  </div>

            {/* Cities and their data */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Cities & Details</h2>
              </div>

              {/* Country & City Selection */}
              <div id="country-city-selection" className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-8 mb-8 border border-blue-200">
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
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Number of Days and Hotel for this city */}
                  {(selectedCity || (selectedCity === 'custom' && customCityName.trim())) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🏨 Hotel
                        </label>
                        <input
                          type="text"
                          placeholder="Hotel name (optional)"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-900"
                          style={{ color: '#000000' }}
                          value={selectedHotel?.name || ''}
                          onChange={(e) => {
                            setSelectedHotel({
                              id: selectedHotel?.id || Date.now().toString(),
                              name: e.target.value,
                              location: selectedHotel?.location || '',
                              rating: selectedHotel?.rating || 0,
                              review: selectedHotel?.review || '',
                              liked: selectedHotel?.liked || null
                            });
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center">
                <button
                  type="button"
                      onClick={addCity}
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
                        <p className="text-gray-600">📍 {city.country} • 📅 {city.numberOfDays} {city.numberOfDays === 1 ? 'day' : 'days'}</p>
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
                  
                  {/* Hotel Section - Single Hotel */}
                  <div className="mb-6">
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="text-2xl mr-2">🏨</span>
                        Hotel
                      </h4>
                      {city.hotel ? (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                              <input
                                type="text"
                                value={city.hotel.name}
                                onChange={(e) => updateHotel(city.id, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                placeholder="Hotel name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                              <input
                                type="text"
                                value={city.hotel.location}
                                onChange={(e) => updateHotel(city.id, 'location', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                placeholder="Address"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setHotelForCity(city.id, null)}
                            className="mt-3 text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove Hotel
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-600 mb-3">No hotel added</p>
                          <button
                            type="button"
                            onClick={() => updateHotel(city.id, 'name', '')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            <Plus className="w-4 h-4 inline mr-2" />
                            Add Hotel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Days Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      📅 Days ({city.numberOfDays} {city.numberOfDays === 1 ? 'day' : 'days'})
                    </h4>
                    {city.days.map((day) => (
                      <div key={day.id} className="border border-gray-200 rounded-lg">
                        <button
                          type="button"
                          onClick={() => toggleSection(`${city.id}-${day.id}`, 'day')}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">📅</span>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">Day {day.dayNumber}</h4>
                              <p className="text-sm text-gray-600">
                                {day.restaurants.length} restaurant{day.restaurants.length !== 1 ? 's' : ''}, {' '}
                                {day.activities.length} activit{day.activities.length !== 1 ? 'ies' : 'y'}
                              </p>
                            </div>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections[`${city.id}-${day.id}-day`] ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {expandedSections[`${city.id}-${day.id}-day`] && (
                          <div className="border-t border-gray-200 p-4 bg-gray-50">
                            {/* Restaurants for this day */}
                            <div className="mb-6">
                              <div className="flex items-center justify-between mb-4">
                                <h5 className="font-semibold text-gray-900 flex items-center">
                                  <span className="text-xl mr-2">🍽️</span>
                                  Restaurants
                                </h5>
                                <button
                                  type="button"
                                  onClick={() => addRestaurant(city.id, day.id)}
                                  className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Restaurant
                                </button>
                              </div>
                              {day.restaurants.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">No restaurants added for this day</p>
                              ) : (
                                day.restaurants.map((restaurant, index) => (
                                  <div key={restaurant.id} className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 mb-3 border border-green-200">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-lg">🍽️</span>
                                        <h6 className="font-semibold text-gray-800">Restaurant {index + 1}</h6>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeRestaurant(city.id, day.id, restaurant.id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                                        <input
                                          type="text"
                                          value={restaurant.name}
                                          onChange={(e) => updateRestaurant(city.id, day.id, restaurant.id, 'name', e.target.value)}
                                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm text-black"
                                          placeholder="Restaurant name"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                                        <input
                                          type="text"
                                          value={restaurant.location}
                                          onChange={(e) => updateRestaurant(city.id, day.id, restaurant.id, 'location', e.target.value)}
                                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm text-black"
                                          placeholder="Address"
                                        />
                                      </div>
                                    </div>
                                    <div className="mb-2">
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Rating</label>
                                      <div className="flex items-center space-x-1">
                                        {[1, 2, 3, 4, 5].map((rating) => (
                                          <button
                                            key={rating}
                                            type="button"
                                            onClick={() => updateRestaurant(city.id, day.id, restaurant.id, 'rating', rating)}
                                            className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                              restaurant.rating >= rating ? 'text-yellow-400' : 'text-gray-300'
                                            }`}
                                          >
                                            <Star className="w-3 h-3 fill-current" />
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Review</label>
                                      <textarea
                                        value={restaurant.review}
                                        onChange={(e) => updateRestaurant(city.id, day.id, restaurant.id, 'review', e.target.value)}
                                        rows={2}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm text-black"
                                        placeholder="Review"
                                      />
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Activities for this day */}
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h5 className="font-semibold text-gray-900 flex items-center">
                                  <span className="text-xl mr-2">🎯</span>
                                  Activities
                                </h5>
                                <button
                                  type="button"
                                  onClick={() => addActivity(city.id, day.id)}
                                  className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Activity
                                </button>
                              </div>
                              {day.activities.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">No activities added for this day</p>
                              ) : (
                                day.activities.map((activity, index) => (
                                  <div key={activity.id} className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 mb-3 border border-purple-200">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-lg">🎯</span>
                                        <h6 className="font-semibold text-gray-800">Activity {index + 1}</h6>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeActivity(city.id, day.id, activity.id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                                        <input
                                          type="text"
                                          value={activity.name}
                                          onChange={(e) => updateActivity(city.id, day.id, activity.id, 'name', e.target.value)}
                                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-black"
                                          placeholder="Activity name"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                                        <input
                                          type="text"
                                          value={activity.location}
                                          onChange={(e) => updateActivity(city.id, day.id, activity.id, 'location', e.target.value)}
                                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-black"
                                          placeholder="Address"
                                        />
                                      </div>
                                    </div>
                                    <div className="mb-2">
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Rating</label>
                                      <div className="flex items-center space-x-1">
                                        {[1, 2, 3, 4, 5].map((rating) => (
                                          <button
                                            key={rating}
                                            type="button"
                                            onClick={() => updateActivity(city.id, day.id, activity.id, 'rating', rating)}
                                            className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                              activity.rating >= rating ? 'text-yellow-400' : 'text-gray-300'
                                            }`}
                                          >
                                            <Star className="w-3 h-3 fill-current" />
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Review</label>
                                      <textarea
                                        value={activity.review}
                                        onChange={(e) => updateActivity(city.id, day.id, activity.id, 'review', e.target.value)}
                                        rows={2}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-black"
                                        placeholder="Review"
                                      />
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
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

export default function NewTripPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <NewTripContent />
    </Suspense>
  );
}
