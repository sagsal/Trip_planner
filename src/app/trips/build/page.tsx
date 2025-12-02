'use client';

import { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Plus, MapPin, Calendar, Star, Edit, Trash2, Copy, Save, Eye, X, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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
  countries: string;
  cities: string;
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

function BuildTripContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [draftTrips, setDraftTrips] = useState<DraftTrip[]>([]);
  const [sharedTrips, setSharedTrips] = useState<SharedTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateDraft, setShowCreateDraft] = useState(false);
  const [showBrowseTrips, setShowBrowseTrips] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);

  // New draft form state (same as share trip)
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


  const addCity = useCallback(() => {
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
      hotel: null,
      days: days
    };
    setCitiesData(prev => [...prev, newCity]);
    
    // Reset selections
    setSelectedCountry('');
    setSelectedCity('');
    setCustomCityName('');
    setSelectedNumberOfDays('');
  }, [selectedCountry, selectedCity, customCityName, selectedNumberOfDays]);

  const removeCity = useCallback((cityId: string) => {
    setCitiesData(prev => prev.filter(city => city.id !== cityId));
  }, []);

  // Hotel management
  const updateHotel = useCallback((cityId: string, field: keyof Hotel, value: any) => {
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
  }, []);

  const setHotelForCity = useCallback((cityId: string, hotel: Hotel | null) => {
    setCitiesData(prev => prev.map(city => 
      city.id === cityId ? { ...city, hotel } : city
    ));
  }, []);

  // Restaurant management per day
  const addRestaurant = useCallback((cityId: string, dayId: string) => {
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
  }, []);

  const updateRestaurant = useCallback((cityId: string, dayId: string, restaurantId: string, field: keyof Restaurant, value: any) => {
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
  }, []);

  const removeRestaurant = useCallback((cityId: string, dayId: string, restaurantId: string) => {
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
  }, []);

  // Activity management per day
  const addActivity = useCallback((cityId: string, dayId: string) => {
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
  }, []);

  const updateActivity = useCallback((cityId: string, dayId: string, activityId: string, field: keyof Activity, value: any) => {
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
  }, []);

  const removeActivity = useCallback((cityId: string, dayId: string, activityId: string) => {
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
  }, []);

  const toggleSection = useCallback((cityId: string, dayId: string, section: string) => {
    const key = `${cityId}-${dayId}-${section}`;
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);


  // Load user and data
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      loadDraftTrips();
      loadSharedTrips();
    } else {
      router.push('/login');
    }
  }, [router]);

  const loadDraftTrips = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      const response = await fetch(`/api/trips?drafts=true&userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Draft trips API response:', data);
        // Transform the data to match our interface
        const transformed: DraftTrip[] = (data.trips || []).map((trip: any) => {
          // Parse countries safely
          let countries: string[] = [];
          try {
            if (typeof trip.countries === 'string') {
              const parsed = JSON.parse(trip.countries);
              countries = Array.isArray(parsed) ? parsed : (typeof parsed === 'string' ? JSON.parse(parsed) : []);
            } else if (Array.isArray(trip.countries)) {
              countries = trip.countries;
            }
          } catch (e) {
            console.error('Error parsing countries:', e);
            countries = [];
          }

          return {
            id: trip.id,
            title: trip.title,
            description: trip.description,
            countries,
            citiesData: trip.cities_data ? trip.cities_data.map((city: any) => {
              // Get hotel (first one if exists)
              const hotel = city.hotels && city.hotels.length > 0 ? {
                id: city.hotels[0].id,
                name: city.hotels[0].name || '',
                location: city.hotels[0].location || '',
                rating: city.hotels[0].rating || 0,
                review: city.hotels[0].review || '',
                liked: city.hotels[0].liked ?? null
              } : null;

              // Create days array - if days data exists, use it, otherwise create default days
              let days: Day[] = [];
              if (city.days && Array.isArray(city.days) && city.days.length > 0) {
                // Use existing days structure
                days = city.days.map((day: any) => ({
                  id: day.id || `${Date.now()}-day-${day.dayNumber}`,
                  dayNumber: day.dayNumber || 1,
                  restaurants: (day.restaurants || []).map((r: any) => ({
                    id: r.id || Date.now().toString(),
                    name: r.name || '',
                    location: r.location || '',
                    rating: r.rating || 0,
                    review: r.review || '',
                    liked: r.liked ?? null
                  })),
                  activities: (day.activities || []).map((a: any) => ({
                    id: a.id || Date.now().toString(),
                    name: a.name || '',
                    location: a.location || '',
                    rating: a.rating || 0,
                    review: a.review || '',
                    liked: a.liked ?? null
                  }))
                }));
              } else {
                // Create default days structure based on numberOfDays
                // If days don't exist in DB, put all restaurants/activities in day 1
                const numberOfDays = city.numberOfDays || 1;
                const allRestaurants = (city.restaurants || []).map((r: any) => ({
                  id: r.id || Date.now().toString(),
                  name: r.name || '',
                  location: r.location || '',
                  rating: r.rating || 0,
                  review: r.review || '',
                  liked: r.liked ?? null
                }));
                const allActivities = (city.activities || []).map((a: any) => ({
                  id: a.id || Date.now().toString(),
                  name: a.name || '',
                  location: a.location || '',
                  rating: a.rating || 0,
                  review: a.review || '',
                  liked: a.liked ?? null
                }));
                
                days = Array.from({ length: numberOfDays }, (_, index) => {
                  const dayNumber = index + 1;
                  // Put all restaurants/activities in day 1, empty for other days
                  return {
                    id: `${Date.now()}-day-${dayNumber}`,
                    dayNumber,
                    restaurants: dayNumber === 1 ? allRestaurants : [],
                    activities: dayNumber === 1 ? allActivities : []
                  };
                });
              }

            return {
              id: city.id,
              name: city.name,
              country: city.country,
                numberOfDays: city.numberOfDays || days.length,
                hotel,
                days
            };
            }) : [],
          createdAt: trip.createdAt
          };
        });
        console.log('Transformed draft trips:', transformed);
        setDraftTrips(transformed);
      } else {
        console.error('Failed to load draft trips:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Error loading draft trips:', err);
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

  const loadDraftTripData = async (draftId: string) => {
    if (!user) return;
    
    setIsLoadingDraft(true);
    try {
      const response = await fetch(`/api/trips/${draftId}?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        const trip = data.trip;
        
        // Parse countries
        let countries: string[] = [];
        try {
          if (typeof trip.countries === 'string') {
            const parsed = JSON.parse(trip.countries);
            countries = Array.isArray(parsed) ? parsed : [];
          } else if (Array.isArray(trip.countries)) {
            countries = trip.countries;
          }
        } catch (e) {
          console.error('Error parsing countries:', e);
        }

        // Set form data
        setFormData({
          title: trip.title || '',
          description: trip.description || '',
          startDate: trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : '',
          endDate: trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : '',
          numberOfDays: '',
          countries: countries.length > 0 ? countries : ['']
        });

        // Transform cities data from API format to component format
        const transformedCitiesData: CityData[] = trip.cities_data.map((city: any) => {
          // Get hotel (first one if exists)
          const hotel = city.hotels && city.hotels.length > 0 ? {
            id: city.hotels[0].id,
            name: city.hotels[0].name || '',
            location: city.hotels[0].location || '',
            rating: city.hotels[0].rating || 0,
            review: city.hotels[0].review || '',
            liked: city.hotels[0].liked ?? null
          } : null;

          // Create days array - if days data exists, use it, otherwise create default days
          let days: Day[] = [];
          if (city.days && Array.isArray(city.days) && city.days.length > 0) {
            // Use existing days structure
            days = city.days.map((day: any) => ({
              id: day.id || `${Date.now()}-day-${day.dayNumber}`,
              dayNumber: day.dayNumber || 1,
              restaurants: (day.restaurants || []).map((r: any) => ({
                id: r.id || Date.now().toString(),
                name: r.name || '',
                location: r.location || '',
                rating: r.rating || 0,
                review: r.review || '',
                liked: r.liked ?? null
              })),
              activities: (day.activities || []).map((a: any) => ({
                id: a.id || Date.now().toString(),
                name: a.name || '',
                location: a.location || '',
                rating: a.rating || 0,
                review: a.review || '',
                liked: a.liked ?? null
              }))
            }));
          } else {
            // Create default days structure based on numberOfDays
            // If days don't exist in DB, put all restaurants/activities in day 1
            const numberOfDays = city.numberOfDays || 1;
            const allRestaurants = (city.restaurants || []).map((r: any) => ({
              id: r.id || Date.now().toString(),
              name: r.name || '',
              location: r.location || '',
              rating: r.rating || 0,
              review: r.review || '',
              liked: r.liked ?? null
            }));
            const allActivities = (city.activities || []).map((a: any) => ({
              id: a.id || Date.now().toString(),
              name: a.name || '',
              location: a.location || '',
              rating: a.rating || 0,
              review: a.review || '',
              liked: a.liked ?? null
            }));
            
            days = Array.from({ length: numberOfDays }, (_, index) => {
              const dayNumber = index + 1;
              // Put all restaurants/activities in day 1, empty for other days
              return {
                id: `${Date.now()}-day-${dayNumber}`,
                dayNumber,
                restaurants: dayNumber === 1 ? allRestaurants : [],
                activities: dayNumber === 1 ? allActivities : []
              };
            });
          }

          return {
            id: city.id,
            name: city.name,
            country: city.country,
            numberOfDays: city.numberOfDays || days.length,
            hotel,
            days
          };
        });

        setCitiesData(transformedCitiesData);
        setEditingDraftId(draftId);
        setSuccess('Draft trip loaded! Continue editing...');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to load draft trip');
      }
    } catch (err) {
      console.error('Error loading draft trip:', err);
      setError('Error loading draft trip');
    } finally {
      setIsLoadingDraft(false);
    }
  };

  const handleCreateDraft = async () => {
    console.log('Save Draft button clicked');
    console.log('User:', user);
    console.log('Form data:', formData);
    console.log('Cities data:', citiesData);
    
    if (!user) {
      console.error('No user found');
      setError('Please log in to save drafts');
      return;
    }
    
    if (!formData.title || citiesData.length === 0) {
      const validationError = {
        title: formData.title || 'MISSING',
        titleLength: formData.title?.length || 0,
        citiesCount: citiesData.length,
        cities: citiesData.map(c => ({ name: c.name, country: c.country }))
      };
      console.error('Client-side validation failed:', JSON.stringify(validationError, null, 2));
      setError('Please fill in trip title and add at least one city');
      return;
    }

    try {
      setError(null);
      setIsLoadingDraft(true);
      console.log('Starting draft save...');
      
      // Collect unique countries from cities (filter out empty strings)
      const uniqueCountries = Array.from(new Set(
        citiesData
          .map(city => city.country)
          .filter(country => country && country.trim() !== '')
      ));
      
      // Validate that we have at least one country
      if (uniqueCountries.length === 0) {
        setError('Please ensure at least one city has a valid country');
        setIsLoadingDraft(false);
        return;
      }
      
      // Transform cities data to API format
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

      // If editing existing draft, update it; otherwise create new
      const isUpdate = editingDraftId !== null;
      const url = isUpdate ? `/api/trips/${editingDraftId}` : '/api/trips';
      const method = isUpdate ? 'PUT' : 'POST';

      const requestBody = {
          title: formData.title,
          description: formData.description,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          countries: JSON.stringify(uniqueCountries),
          cities: JSON.stringify(citiesData.map(c => c.name)),
          citiesData: transformedCitiesData,
          isDraft: true,
        isPublic: false,
          userId: user.id,
          userName: user.name,
          userEmail: user.email
      };
      
      console.log('Sending request to:', url, 'Method:', method);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        console.log('Draft saved successfully!');
        let responseData;
        try {
          responseData = await response.json();
          console.log('Response data:', responseData);
        } catch (parseError) {
          console.error('Error parsing success response:', parseError);
        }
        
        // Don't clear the form if we're editing - keep the data visible
        if (!isUpdate) {
        setShowCreateDraft(false);
        setFormData({ title: '', description: '', startDate: '', endDate: '', numberOfDays: '', countries: [''] });
        setCitiesData([]);
        setSelectedCountry('');
        setSelectedCity('');
        setCustomCityName('');
        setSelectedNumberOfDays('');
        }
        setEditingDraftId(null);
        await loadDraftTrips();
        setSuccess(isUpdate ? 'Draft trip updated successfully!' : 'Draft trip created successfully!');
        setTimeout(() => setSuccess(null), 5000);
      } else {
        let errorMessage = isUpdate ? 'Failed to update draft trip' : 'Failed to create draft trip';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.error('Draft operation failed - API response:', data);
            console.error('Full error object:', JSON.stringify(data, null, 2));
            errorMessage = data.details 
              ? `${data.error}: ${data.details}` 
              : (data.error || errorMessage);
            // If there's a received field, show what was actually sent
            if (data.received) {
              errorMessage += ` (Received: ${JSON.stringify(data.received)})`;
            }
          } else {
            const text = await response.text();
            errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
            console.error('Draft operation failed - non-JSON response:', text);
          }
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
          console.error('Error parsing response:', parseError);
        }
        setError(errorMessage);
        setTimeout(() => setError(null), 10000);
      }
    } catch (err) {
      console.error('Error saving draft trip:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the draft trip');
    } finally {
      setIsLoadingDraft(false);
    }
  };


  const handleCopyItemToForm = (itemType: 'hotel' | 'restaurant' | 'activity', item: any, targetCityId: string, targetDayId?: string) => {
    console.log('handleCopyItemToForm called:', { itemType, itemName: item?.name, targetCityId, targetDayId });
    
    if (!targetCityId) {
      setError('Please select a city');
      return;
    }

    // For restaurants and activities, day selection is required
    if ((itemType === 'restaurant' || itemType === 'activity') && !targetDayId) {
      setError('Please select a day for restaurants and activities');
      return;
    }

    try {
      setError(null);
      
      if (itemType === 'hotel') {
        // Add hotel to the city
        setCitiesData(prev => {
          const updated = prev.map(city => {
            if (city.id === targetCityId) {
              const newHotel: Hotel = {
                id: `hotel-${Date.now()}`,
                name: item.name || '',
                location: item.location || '',
                rating: item.rating || 0,
                review: item.review || '',
                liked: item.liked ?? null
              };
              console.log('Adding hotel:', newHotel, 'to city:', city.name);
              return { ...city, hotel: newHotel };
            }
            return city;
          });
          console.log('Updated citiesData with hotel:', updated);
          return updated;
        });
        setSuccess(`Hotel "${item.name}" added to your draft!`);
      } else if (itemType === 'restaurant') {
        // Add restaurant to the specific day
        setCitiesData(prev => prev.map(city => {
          if (city.id === targetCityId) {
            const newRestaurant: Restaurant = {
              id: Date.now().toString(),
              name: item.name || '',
              location: item.location || '',
              rating: item.rating || 0,
              review: item.review || '',
              liked: item.liked ?? null
            };
            return {
              ...city,
              days: city.days.map(day => 
                day.id === targetDayId 
                  ? { ...day, restaurants: [...day.restaurants, newRestaurant] }
                  : day
              )
            };
          }
          return city;
        }));
        setSuccess(`Restaurant "${item.name}" added to your draft!`);
      } else if (itemType === 'activity') {
        // Add activity to the specific day
        console.log('Processing activity copy:', { item, targetCityId, targetDayId });
        setCitiesData(prev => {
          const updated = prev.map(city => {
            if (city.id === targetCityId) {
              // Check if the day exists
              const targetDay = city.days.find(day => day.id === targetDayId);
              if (!targetDay) {
                console.error('❌ Day not found for activity:', {
                  targetDayId,
                  availableDays: city.days.map(d => ({ id: d.id, dayNumber: d.dayNumber })),
                  cityId: city.id,
                  cityName: city.name
                });
                setError(`Day not found. Please select a valid day. Available days: ${city.days.map(d => `Day ${d.dayNumber}`).join(', ')}`);
                return city;
              }
              
              const newActivity: Activity = {
                id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: item.name || '',
                location: item.location || '',
                rating: item.rating || 0,
                review: item.review || '',
                liked: item.liked ?? null
              };
              
              console.log('✅ Adding activity:', {
                activityName: newActivity.name,
                cityName: city.name,
                dayId: targetDayId,
                dayNumber: targetDay.dayNumber,
                currentActivitiesCount: targetDay.activities.length
              });
              
              // Ensure activities array exists and create a new reference
              const currentActivities = Array.isArray(targetDay.activities) ? targetDay.activities : [];
              const updatedCity = {
                ...city,
                days: city.days.map(day => {
                  if (day.id === targetDayId) {
                    const updatedDay = { 
                      ...day, 
                      activities: [...currentActivities, newActivity]
                    };
                    console.log('✅ Day updated:', {
                      dayNumber: day.dayNumber,
                      dayId: day.id,
                      oldCount: currentActivities.length,
                      newCount: updatedDay.activities.length,
                      activityNames: updatedDay.activities.map(a => a.name),
                      allActivityIds: updatedDay.activities.map(a => a.id)
                    });
                    return updatedDay;
                  }
                  return day;
                })
              };
              
              const targetDayAfterUpdate = updatedCity.days.find(d => d.id === targetDayId);
              console.log('✅ City updated with activity:', {
                cityName: updatedCity.name,
                totalDays: updatedCity.days.length,
                targetDayId,
                activitiesInTargetDay: targetDayAfterUpdate?.activities?.length || 0,
                activityNames: targetDayAfterUpdate?.activities?.map(a => a.name) || []
              });
              
              return updatedCity;
            }
            return city;
          });
          
          // Force a new array reference to ensure React detects the change
          const finalUpdated = updated.map(city => ({
            ...city,
            days: city.days.map(day => ({
              ...day,
              activities: Array.isArray(day.activities) ? [...day.activities] : []
            }))
          }));
          
          console.log('✅ Final updated citiesData:', finalUpdated.map(c => ({
            name: c.name,
            days: c.days.map(d => ({
              dayNumber: d.dayNumber,
              dayId: d.id,
              activitiesCount: d.activities?.length || 0,
              activityNames: d.activities?.map(a => a.name) || []
            }))
          })));
          
          setSuccess(`Activity "${item.name}" added to your draft!`);
          // Small delay to ensure state update is processed
          setTimeout(() => {
            console.log('State update complete. Current citiesData:', finalUpdated);
          }, 100);
          
          return finalUpdated;
        });
      }
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error adding item to form:', err);
      setError('An error occurred while adding the item');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleCopyEntireCity = (sourceCity: CityData, targetCityId: string) => {
    if (!targetCityId) {
      setError('Please select a target city from your new trip');
      return;
    }

    try {
      setError(null);
      setCitiesData(prev => prev.map(city => {
        if (city.id === targetCityId) {
          // Copy hotel
          const newHotel = sourceCity.hotel ? {
            id: Date.now().toString(),
            name: sourceCity.hotel.name || '',
            location: sourceCity.hotel.location || '',
            rating: sourceCity.hotel.rating || 0,
            review: sourceCity.hotel.review || '',
            liked: sourceCity.hotel.liked ?? null
          } : null;

          // Copy all restaurants and activities from all days
          // Distribute them across the target city's days
          const allRestaurants: Restaurant[] = [];
          const allActivities: Activity[] = [];
          
          sourceCity.days.forEach(day => {
            day.restaurants.forEach(r => {
              allRestaurants.push({
                id: Date.now().toString() + Math.random(),
                name: r.name || '',
                location: r.location || '',
                rating: r.rating || 0,
                review: r.review || '',
                liked: r.liked ?? null
              });
            });
            day.activities.forEach(a => {
              allActivities.push({
                id: Date.now().toString() + Math.random(),
                name: a.name || '',
                location: a.location || '',
                rating: a.rating || 0,
                review: a.review || '',
                liked: a.liked ?? null
              });
            });
          });

          // Distribute items across target city's days (round-robin)
          const targetDays = city.days.map((day, dayIndex) => {
            const dayRestaurants = allRestaurants.filter((_, idx) => idx % city.days.length === dayIndex);
            const dayActivities = allActivities.filter((_, idx) => idx % city.days.length === dayIndex);
            
            return {
              ...day,
              restaurants: [...day.restaurants, ...dayRestaurants],
              activities: [...day.activities, ...dayActivities]
            };
          });

          return {
            ...city,
            hotel: newHotel || city.hotel,
            days: targetDays
          };
        }
        return city;
      }));

      const itemCount = (sourceCity.hotel ? 1 : 0) + 
                       sourceCity.days.reduce((sum, day) => sum + day.restaurants.length + day.activities.length, 0);
      setSuccess(`Copied entire city "${sourceCity.name}" with ${itemCount} items to your draft!`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      console.error('Error copying city:', err);
      setError('An error occurred while copying the city');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleCopyAllFromCity = (sourceCity: CityData, targetCityId: string, targetDayId?: string) => {
    if (!targetCityId) {
      setError('Please select a target city');
      return;
    }

    try {
      setError(null);
      let copiedCount = 0;

      setCitiesData(prev => prev.map(city => {
        if (city.id === targetCityId) {
          let updatedCity = { ...city };

          // Copy hotel
          if (sourceCity.hotel) {
            updatedCity.hotel = {
              id: Date.now().toString(),
              name: sourceCity.hotel.name || '',
              location: sourceCity.hotel.location || '',
              rating: sourceCity.hotel.rating || 0,
              review: sourceCity.hotel.review || '',
              liked: sourceCity.hotel.liked ?? null
            };
            copiedCount++;
          }

          // Copy all restaurants and activities
          if (targetDayId) {
            // Copy to specific day
            const allRestaurants: Restaurant[] = [];
            const allActivities: Activity[] = [];
            
            sourceCity.days.forEach(day => {
              day.restaurants.forEach(r => {
                allRestaurants.push({
                  id: Date.now().toString() + Math.random(),
                  name: r.name || '',
                  location: r.location || '',
                  rating: r.rating || 0,
                  review: r.review || '',
                  liked: r.liked ?? null
                });
              });
              day.activities.forEach(a => {
                allActivities.push({
                  id: Date.now().toString() + Math.random(),
                  name: a.name || '',
                  location: a.location || '',
                  rating: a.rating || 0,
                  review: a.review || '',
                  liked: a.liked ?? null
                });
              });
            });

            updatedCity.days = city.days.map(day => 
              day.id === targetDayId 
                ? {
                    ...day,
                    restaurants: [...day.restaurants, ...allRestaurants],
                    activities: [...day.activities, ...allActivities]
                  }
                : day
            );
            copiedCount += allRestaurants.length + allActivities.length;
          } else {
            // Distribute across all days
            const allRestaurants: Restaurant[] = [];
            const allActivities: Activity[] = [];
            
            sourceCity.days.forEach(day => {
              day.restaurants.forEach(r => {
                allRestaurants.push({
                  id: Date.now().toString() + Math.random(),
                  name: r.name || '',
                  location: r.location || '',
                  rating: r.rating || 0,
                  review: r.review || '',
                  liked: r.liked ?? null
                });
              });
              day.activities.forEach(a => {
                allActivities.push({
                  id: Date.now().toString() + Math.random(),
                  name: a.name || '',
                  location: a.location || '',
                  rating: a.rating || 0,
                  review: a.review || '',
                  liked: a.liked ?? null
                });
              });
            });

            updatedCity.days = city.days.map((day, dayIndex) => {
              const dayRestaurants = allRestaurants.filter((_, idx) => idx % city.days.length === dayIndex);
              const dayActivities = allActivities.filter((_, idx) => idx % city.days.length === dayIndex);
              
              return {
                ...day,
                restaurants: [...day.restaurants, ...dayRestaurants],
                activities: [...day.activities, ...dayActivities]
              };
            });
            copiedCount += allRestaurants.length + allActivities.length;
          }

          return updatedCity;
        }
        return city;
      }));

      setSuccess(`Copied all ${copiedCount} items from "${sourceCity.name}" to your draft!`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      console.error('Error copying all items:', err);
      setError('An error occurred while copying items');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleCopyItem = async (itemType: 'hotel' | 'restaurant' | 'activity', item: any, targetDraftId: string, targetCityId: string, targetDayId?: string) => {
    if (!targetDraftId || !targetCityId) {
      setError('Please select a draft trip and city');
      return;
    }

    // For restaurants and activities, day selection is required
    if ((itemType === 'restaurant' || itemType === 'activity') && !targetDayId) {
      setError('Please select a day for restaurants and activities');
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/trips/${targetDraftId}`, {
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
        loadDraftTrips();
        setSuccess(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} "${item.name}" saved to your draft!`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        const errorMsg = data.error || data.details || 'Failed to copy item';
        setError(errorMsg);
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('Error copying item:', err);
      setError('An error occurred while copying the item');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this draft trip?')) return;

    try {
      setError(null);
      const response = await fetch(`/api/trips/${draftId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        loadDraftTrips();
        setSuccess('Draft trip deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete draft trip');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      setError('An error occurred while deleting the draft trip');
      setTimeout(() => setError(null), 5000);
    }
  };

  const toggleTripSection = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-[#0160D6] hover:text-[#0160D6]/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Build Your Trip</h1>
          <p className="text-gray-600">Create draft trips and get ideas from shared trips</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => {
              setShowCreateDraft(true);
              setShowBrowseTrips(false);
              setEditingDraftId(null);
              // Reload draft trips to ensure we have the latest list
              loadDraftTrips();
            }}
            className="flex items-center px-6 py-3 bg-[#AAB624] text-white rounded-lg hover:bg-[#AAB624]/90 transition-colors font-semibold"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Draft Trip
          </button>
          <button
            onClick={() => {
              setShowBrowseTrips(!showBrowseTrips);
              setShowCreateDraft(false);
            }}
            className="flex items-center px-6 py-3 bg-[#0160D6] text-white rounded-lg hover:bg-[#0160D6]/90 transition-colors font-semibold"
          >
            <Eye className="w-5 h-5 mr-2" />
            {showBrowseTrips ? 'Hide' : 'Browse'} Shared Trips
          </button>
        </div>

        {/* Create New Draft Form - Same as Share Trip */}
        {showCreateDraft && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Draft Trip Suggestions */}
            {(() => {
              console.log('Suggestions render check:', {
                draftTripsLength: draftTrips.length,
                editingDraftId,
                showCreateDraft,
                shouldShow: draftTrips.length > 0 && !editingDraftId
              });
              return null;
            })()}
            {draftTrips.length > 0 && !editingDraftId && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">💡</span>
                  Continue working on an existing draft?
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  You have {draftTrips.length} draft trip{draftTrips.length !== 1 ? 's' : ''}. Select one to continue editing, or create a new draft below.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {draftTrips.map((draft) => (
                    <button
                      key={draft.id}
                      onClick={() => loadDraftTripData(draft.id)}
                      disabled={isLoadingDraft}
                      className="bg-white border-2 border-blue-300 rounded-lg p-4 text-left hover:border-blue-500 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-semibold text-gray-900 mb-1">{draft.title}</div>
                      <div className="text-sm text-gray-600">
                        {Array.isArray(draft.countries) && draft.countries.length > 0
                          ? draft.countries.join(', ')
                          : 'No countries specified'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {draft.citiesData.length} cit{draft.citiesData.length !== 1 ? 'ies' : 'y'}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <button
                    onClick={() => {
                      setEditingDraftId(null);
                      setFormData({ title: '', description: '', startDate: '', endDate: '', numberOfDays: '', countries: [''] });
                      setCitiesData([]);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Or create a new draft trip →
                  </button>
                </div>
              </div>
            )}

            {/* Editing Existing Draft Indicator */}
            {editingDraftId && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">✏️</span>
                  <div>
                    <div className="font-semibold text-gray-900">Editing existing draft</div>
                    <div className="text-sm text-gray-600">
                      {draftTrips.find(d => d.id === editingDraftId)?.title || 'Draft Trip'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingDraftId(null);
                    setFormData({ title: '', description: '', startDate: '', endDate: '', numberOfDays: '', countries: [''] });
                    setCitiesData([]);
                    setSelectedCountry('');
                    setSelectedCity('');
                    setCustomCityName('');
                    setSelectedNumberOfDays('');
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
                >
                  Start New Draft
                </button>
              </div>
            )}

            {/* Reuse from Your Draft Trips - Show while creating new trip */}
            {draftTrips.length > 0 && (
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">♻️</span>
                  Reuse Items from Your Existing Draft Trips
                </h3>
                {citiesData.length === 0 ? (
                  <div className="bg-white border border-orange-300 rounded-lg p-4">
                    <p className="text-orange-700 text-sm">
                      ⚠️ <strong>Add at least one city to your new trip first</strong>, then you can copy hotels, restaurants, and activities from your existing draft trips below!
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-600 mb-4 text-sm">
                      You have {draftTrips.length} draft trip{draftTrips.length !== 1 ? 's' : ''}. Click to expand and copy hotels, restaurants, and activities to your new trip!
                    </p>
                    <div className="space-y-4">
                      {draftTrips.map((draftTrip) => (
                        <DraftTripCard
                          key={draftTrip.id}
                          draftTrip={draftTrip}
                          currentFormCities={citiesData}
                          onCopyItemToForm={handleCopyItemToForm}
                          onCopyEntireCity={handleCopyEntireCity}
                          onCopyAllFromCity={handleCopyAllFromCity}
                          expandedSections={expandedSections}
                          toggleSection={toggleTripSection}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Trip Information Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Trip Information</h2>
                {/* Prominent Save Draft Button */}
                {user && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCreateDraft();
                    }}
                    disabled={isLoadingDraft || !formData.title || citiesData.length === 0}
                    className="px-6 py-3 bg-gradient-to-r from-[#AAB624] to-[#8B9A1E] text-white rounded-lg hover:from-[#8B9A1E] hover:to-[#6B7A15] transition-all font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {isLoadingDraft ? 'Saving...' : editingDraftId ? 'Update Draft' : 'Save Draft'}
                    {user && <span className="text-sm opacity-90">({user.name})</span>}
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trip Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., Singapore Adventure 2024"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Tell us about your trip..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Days
                </label>
                <select
                  value={formData.numberOfDays}
                  onChange={(e) => setFormData({ ...formData, numberOfDays: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Select number of days</option>
                  {Array.from({ length: 90 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'day' : 'days'}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cities & Details Section */}
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

              {/* Show added cities with hotel and days */}
              {citiesData.length > 0 && (
                <div className="space-y-6 mt-6">
                  {citiesData.map((city, cityIndex) => (
                    <div key={city.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
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
                      
                      {/* Hotel Section */}
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                    placeholder="Hotel name"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                  <input
                                    type="text"
                                    value={city.hotel.location}
                                    onChange={(e) => updateHotel(city.id, 'location', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                    placeholder="Address"
                                  />
                                </div>
                              </div>
                              <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                                <div className="flex items-center space-x-2">
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <button
                                      key={rating}
                                      type="button"
                                      onClick={() => updateHotel(city.id, 'rating', rating)}
                                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                        city.hotel!.rating >= rating ? 'text-yellow-400' : 'text-gray-300'
                                      }`}
                                    >
                                      <Star className="w-4 h-4 fill-current" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
                                <textarea
                                  value={city.hotel.review}
                                  onChange={(e) => updateHotel(city.id, 'review', e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                  placeholder="What did you think about this hotel?"
                                />
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
                            <div className="space-y-3">
                              <button
                                type="button"
                                onClick={() => updateHotel(city.id, 'name', '')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                              >
                                <Plus className="w-4 h-4 inline mr-2" />
                                Add Hotel
                              </button>
                              <p className="text-sm text-gray-600 italic">
                                💡 Tip: Visit existing trips to copy hotels, restaurants, and activities to this draft.
                              </p>
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
                              onClick={() => toggleSection(city.id, day.id, 'day')}
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
                                  <div className="mb-4">
                                    <h5 className="font-semibold text-gray-900 flex items-center mb-3">
                                      <span className="text-xl mr-2">🍽️</span>
                                      Restaurants
                                    </h5>
                                    <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => addRestaurant(city.id, day.id)}
                                      className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add Restaurant
                                    </button>
                                    </div>
                                    <p className="text-sm text-gray-600 italic mt-2">
                                      💡 Tip: Visit existing trips to copy restaurants to this draft.
                                    </p>
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
                                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm text-gray-900"
                                              placeholder="Restaurant name"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                                            <input
                                              type="text"
                                              value={restaurant.location}
                                              onChange={(e) => updateRestaurant(city.id, day.id, restaurant.id, 'location', e.target.value)}
                                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm text-gray-900"
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
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm text-gray-900"
                                            placeholder="Review"
                                          />
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>

                                {/* Activities for this day */}
                                <div>
                                  <div className="mb-4">
                                    <h5 className="font-semibold text-gray-900 flex items-center mb-3">
                                      <span className="text-xl mr-2">🎯</span>
                                      Activities
                                    </h5>
                                    <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => addActivity(city.id, day.id)}
                                      className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add Activity
                                    </button>
                                  </div>
                                    <p className="text-sm text-gray-600 italic mt-2">
                                      💡 Tip: Visit existing trips to copy activities to this draft.
                                    </p>
                                  </div>
                                  {(!day.activities || day.activities.length === 0) ? (
                                    <p className="text-gray-500 text-sm text-center py-4">No activities added for this day</p>
                                  ) : (
                                    day.activities.map((activity, index) => {
                                      console.log('Rendering activity:', activity.name, 'in day', day.dayNumber, 'city', city.name);
                                      return (
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
                                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-900"
                                              placeholder="Activity name"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                                            <input
                                              type="text"
                                              value={activity.location}
                                              onChange={(e) => updateActivity(city.id, day.id, activity.id, 'location', e.target.value)}
                                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-900"
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
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-900"
                                            placeholder="Review"
                                          />
                                        </div>
                                      </div>
                                      );
                                    })
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
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleCreateDraft}
                  disabled={isLoadingDraft}
                  className="px-6 py-2 bg-[#AAB624] text-white rounded-lg hover:bg-[#AAB624]/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingDraft ? 'Loading...' : editingDraftId ? 'Update Draft' : 'Create Draft'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateDraft(false);
                    setEditingDraftId(null);
                    setFormData({ title: '', description: '', startDate: '', endDate: '', numberOfDays: '', countries: [''] });
                    setCitiesData([]);
                    setSelectedCountry('');
                    setSelectedCity('');
                    setCustomCityName('');
                    setSelectedNumberOfDays('');
                  }}
                  disabled={isLoadingDraft}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Draft Trips List */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Draft Trips</h2>
          {draftTrips.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 mb-4">No draft trips yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {draftTrips.map((draft) => (
                <div key={draft.id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{draft.title}</h3>
                      <p className="text-gray-600 text-sm">
                        {Array.isArray(draft.countries) && draft.countries.length > 0
                          ? draft.countries.join(', ')
                          : 'No countries specified'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/trips/build/${draft.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Link>
                      <Link
                        href={`/trips/${draft.id}/share`}
                        className="px-4 py-2 bg-[#AAB624] text-white rounded-lg hover:bg-[#AAB624]/90 transition-colors flex items-center"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Trip
                      </Link>
                      <button
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Browse Shared Trips */}
        {showBrowseTrips && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Your Draft Trips Section - Reuse Items */}
            {draftTrips.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Reuse from Your Draft Trips</h2>
                  <p className="text-gray-600 text-sm">
                    💡 <strong>How it works:</strong> Browse your existing draft trips below. Select "Current Draft" and a city (and day for restaurants/activities) from your new trip, then click items from your old drafts to reuse them in your new trip!
                  </p>
                </div>
                <div className="space-y-6">
                  {draftTrips.map((draftTrip) => (
                    <DraftTripCard
                      key={draftTrip.id}
                      draftTrip={draftTrip}
                      currentFormCities={citiesData}
                      onCopyItemToForm={handleCopyItemToForm}
                      expandedSections={expandedSections}
                      toggleSection={toggleTripSection}
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
                  💡 <strong>How it works:</strong> Select "Current Draft" (if you're creating/editing a draft) or an existing saved draft, then select a city (and day for restaurants/activities) from the dropdowns below. Click on any item from shared trips to add it to your draft. This is your sandbox to collect ideas before finalizing your trip!
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
                    draftTrips={draftTrips}
                    currentFormCities={citiesData}
                    onCopyItem={handleCopyItem}
                    onCopyItemToForm={handleCopyItemToForm}
                    onCopyEntireCity={handleCopyEntireCity}
                    onCopyAllFromCity={handleCopyAllFromCity}
                    expandedSections={expandedSections}
                    toggleSection={toggleTripSection}
                  />
                ))}
              </div>
            )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Draft Trip Card Component - for reusing items from your own drafts
function DraftTripCard({
  draftTrip,
  currentFormCities,
  onCopyItemToForm,
  onCopyEntireCity,
  onCopyAllFromCity,
  expandedSections,
  toggleSection
}: {
  draftTrip: DraftTrip;
  currentFormCities: CityData[];
  onCopyItemToForm: (itemType: 'hotel' | 'restaurant' | 'activity', item: any, targetCityId: string, targetDayId?: string) => void;
  onCopyEntireCity: (sourceCity: CityData, targetCityId: string) => void;
  onCopyAllFromCity: (sourceCity: CityData, targetCityId: string, targetDayId?: string) => void;
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
  const selectedCityData = currentFormCities.find(c => c.id === selectedCity);
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

    // Check if restaurants or activities are selected but no day is selected
    const hasRestaurants = selectedItems.restaurants.size > 0;
    const hasActivities = selectedItems.activities.size > 0;
    if ((hasRestaurants || hasActivities) && !selectedDay) {
      alert('Please select a day for restaurants and activities');
      return;
    }

    let copiedCount = 0;

    // Copy selected hotels
    draftTrip.citiesData.forEach(city => {
      if (city.hotel && selectedItems.hotels.has(city.hotel.id || '')) {
        onCopyItemToForm('hotel', city.hotel, selectedCity);
        copiedCount++;
      }
    });

    // Copy selected restaurants
    if (selectedDay) {
      draftTrip.citiesData.forEach(city => {
        city.days.forEach(day => {
          day.restaurants.forEach(restaurant => {
            if (selectedItems.restaurants.has(restaurant.id || '')) {
              onCopyItemToForm('restaurant', restaurant, selectedCity, selectedDay);
              copiedCount++;
            }
          });
        });
      });
    }

    // Copy selected activities
    if (selectedDay) {
      draftTrip.citiesData.forEach(city => {
        city.days.forEach((day) => {
          day.activities.forEach((activity, activityIndex) => {
            // Use the EXACT same ID format as in rendering
            const dayIdentifier = day.id || `day-${day.dayNumber}`;
            const activityName = (activity.name || 'unnamed').trim().toLowerCase().replace(/\s+/g, '-');
            const activityId = activity.id || `${city.id}-${dayIdentifier}-act-${activityIndex}-${activityName}`;
            if (selectedItems.activities.has(activityId)) {
              onCopyItemToForm('activity', activity, selectedCity, selectedDay);
              copiedCount++;
            }
          });
        });
      });
    }

    if (copiedCount > 0) {
      // Clear selections after copying
      setSelectedItems({ hotels: new Set(), restaurants: new Set(), activities: new Set() });
    } else {
      alert('Please select at least one item to copy');
    }
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
          {/* Select City and Day from Current Form */}
          <div className="bg-white p-4 rounded-lg border border-green-300">
            <p className="text-sm font-medium text-gray-700 mb-2">Copy items to your new trip:</p>
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
                <option value="">Select City from New Trip</option>
                {currentFormCities.map(city => (
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
            {currentFormCities.length === 0 && (
              <p className="text-xs text-orange-600 mt-2">⚠️ Add at least one city to your new trip first!</p>
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
                          {city.hotel.rating && city.hotel.rating > 0 && (
                            <div className="flex items-center mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= city.hotel!.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {selectedCity && !selectedItems.hotels.has(city.hotel?.id || '') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopyItemToForm('hotel', city.hotel, selectedCity);
                          }}
                          className="ml-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center transition-colors shadow-sm"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Add Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Restaurants - from all days */}
              {city.days.some(day => day.restaurants.length > 0) && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">🍽️ Restaurants</h5>
                  <div className="space-y-2">
                    {city.days.flatMap(day => 
                      day.restaurants.map((restaurant) => {
                        const isSelected = selectedItems.restaurants.has(restaurant.id || '');
                        return (
                        <div 
                          key={`${day.id}-${restaurant.id}`}
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
                              <p className="text-xs text-gray-400 mt-1">Day {day.dayNumber}</p>
                            </div>
                          </div>
                          {selectedCity && selectedDay && !isSelected && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCopyItemToForm('restaurant', restaurant, selectedCity, selectedDay);
                              }}
                              className="ml-3 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center transition-colors shadow-sm"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Add Now
                            </button>
                          )}
                        </div>
                      );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Activities - from all days */}
              {city.days.some(day => day.activities.length > 0) && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">🎯 Activities</h5>
                  <div className="space-y-2">
                    {city.days.flatMap((day) => 
                      day.activities.map((activity, activityIndex) => {
                        // Create a unique, stable ID for this activity
                        // Priority: use activity.id if exists, otherwise create composite ID
                        const dayIdentifier = day.id || `day-${day.dayNumber}`;
                        const activityName = (activity.name || 'unnamed').trim().toLowerCase().replace(/\s+/g, '-');
                        const activityId = activity.id || `${city.id}-${dayIdentifier}-act-${activityIndex}-${activityName}`;
                        const isSelected = selectedItems.activities.has(activityId);
                        return (
                        <div 
                          key={`${day.id}-${activityId}`}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            selectedCity && selectedDay
                              ? isSelected
                                ? 'bg-purple-100 border-purple-500'
                                : 'bg-purple-50 border-purple-300 hover:bg-purple-100 cursor-pointer'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                          onClick={(e) => {
                            // Don't toggle if clicking on the checkbox itself (it handles its own onChange)
                            if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
                              return;
                            }
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
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleItemSelection('activity', activityId);
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="mr-3 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                              />
                            )}
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
                              <p className="text-xs text-gray-400 mt-1">Day {day.dayNumber}</p>
                            </div>
                          </div>
                          {selectedCity && selectedDay && !isSelected && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const targetCity = currentFormCities.find(c => c.id === selectedCity);
                                const targetDay = targetCity?.days.find(d => d.id === selectedDay);
                                console.log('Add Now clicked for activity:', {
                                  activityName: activity.name,
                                  selectedCity,
                                  selectedDay,
                                  targetCityExists: !!targetCity,
                                  targetDayExists: !!targetDay,
                                  targetCityDays: targetCity?.days.map(d => ({ id: d.id, dayNumber: d.dayNumber }))
                                });
                                if (!targetDay) {
                                  alert(`Day not found. Please select a valid day. Available days: ${targetCity?.days.map(d => `Day ${d.dayNumber}`).join(', ') || 'None'}`);
                                  return;
                                }
                                onCopyItemToForm('activity', activity, selectedCity, selectedDay);
                              }}
                              className="ml-3 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center transition-colors shadow-sm"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Add Now
                            </button>
                          )}
                        </div>
                      );
                      })
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

// Shared Trip Card Component
function SharedTripCard({ 
  trip, 
  draftTrips, 
  currentFormCities,
  onCopyItem, 
  onCopyItemToForm,
  onCopyEntireCity,
  onCopyAllFromCity,
  expandedSections, 
  toggleSection 
}: { 
  trip: SharedTrip; 
  draftTrips: DraftTrip[]; 
  currentFormCities: CityData[];
  onCopyItem: (itemType: 'hotel' | 'restaurant' | 'activity', item: any, targetDraftId: string, targetCityId: string, targetDayId?: string) => void;
  onCopyItemToForm: (itemType: 'hotel' | 'restaurant' | 'activity', item: any, targetCityId: string, targetDayId?: string) => void;
  onCopyEntireCity: (sourceCity: CityData, targetCityId: string) => void;
  onCopyAllFromCity: (sourceCity: CityData, targetCityId: string, targetDayId?: string) => void;
  expandedSections: {[key: string]: boolean};
  toggleSection: (key: string) => void;
}) {
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);
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
  const isCurrentDraft = selectedDraft === 'current-draft';

  const tripKey = `trip-${trip.id}`;
  
  // Get available cities based on selection
  const availableCities = isCurrentDraft 
    ? currentFormCities 
    : draftTrips.find(d => d.id === selectedDraft)?.citiesData || [];
  
  // Get available days for selected city
  const selectedCityData = availableCities.find(c => c.id === selectedCity);
  const availableDays = selectedCityData?.days || [];

  // Reset selected items when selection changes
  useEffect(() => {
    setSelectedItems({ hotels: new Set(), restaurants: new Set(), activities: new Set() });
  }, [selectedDraft, selectedCity, selectedDay]);

  const toggleItemSelection = (itemType: 'hotel' | 'restaurant' | 'activity', itemId: string) => {
    setSelectedItems(prev => {
      // Create new Sets for all types to ensure React detects the change
      const newHotels = new Set(prev.hotels);
      const newRestaurants = new Set(prev.restaurants);
      const newActivities = new Set(prev.activities);
      
      // Get the appropriate set based on itemType
      const targetSet = itemType === 'hotel' ? newHotels : itemType === 'restaurant' ? newRestaurants : newActivities;
      
      // Toggle the item
      if (targetSet.has(itemId)) {
        targetSet.delete(itemId);
      } else {
        targetSet.add(itemId);
      }
      
      // Return a completely new object with new Sets
      return {
        hotels: newHotels,
        restaurants: newRestaurants,
        activities: newActivities
      };
    });
  };

  const handleCopySelected = () => {
    if (!selectedCity || !isCurrentDraft) {
      alert('Please select "Current Draft" and a target city first');
      return;
    }

    // Check if restaurants or activities are selected but no day is selected
    const hasRestaurants = selectedItems.restaurants.size > 0;
    const hasActivities = selectedItems.activities.size > 0;
    if ((hasRestaurants || hasActivities) && !selectedDay) {
      alert('Please select a day for restaurants and activities');
      return;
    }

    let copiedCount = 0;

    // Copy selected hotels
    trip.cities_data.forEach(city => {
      city.hotels.forEach(hotel => {
        if (selectedItems.hotels.has(hotel.id || '')) {
          onCopyItemToForm('hotel', hotel, selectedCity);
          copiedCount++;
        }
      });
    });

    // Copy selected restaurants
    if (selectedDay) {
      trip.cities_data.forEach(city => {
        city.restaurants.forEach(restaurant => {
          if (selectedItems.restaurants.has(restaurant.id || '')) {
            onCopyItemToForm('restaurant', restaurant, selectedCity, selectedDay);
            copiedCount++;
          }
        });
      });
    }

    // Copy selected activities
    if (selectedDay) {
      trip.cities_data.forEach((city) => {
        city.activities.forEach((activity, activityIndex) => {
          // Use the EXACT same ID format as in rendering (must match exactly)
          const activityName = (activity.name || 'unnamed').trim().toLowerCase().replace(/\s+/g, '-');
          const activityId = activity.id || `${city.id || 'city'}-activity-${activityIndex}-${activityName}`;
          if (selectedItems.activities.has(activityId)) {
            onCopyItemToForm('activity', activity, selectedCity, selectedDay);
            copiedCount++;
          }
        });
      });
    }

    if (copiedCount > 0) {
      setSelectedItems({ hotels: new Set(), restaurants: new Set(), activities: new Set() });
    } else {
      alert('Please select at least one item to copy');
    }
  };

  const totalSelected = selectedItems.hotels.size + selectedItems.restaurants.size + selectedItems.activities.size;

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
          {/* Select Draft and City */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Copy items to:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                value={selectedDraft || ''}
                onChange={(e) => {
                  setSelectedDraft(e.target.value);
                  setSelectedCity(null);
                  setSelectedDay(null);
                  setSelectedItems({ hotels: new Set(), restaurants: new Set(), activities: new Set() });
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
              >
                <option value="">Select Draft Trip</option>
                {currentFormCities.length > 0 && (
                  <option value="current-draft">📝 Current Draft (New/Editing)</option>
                )}
                {draftTrips.map(draft => (
                  <option key={draft.id} value={draft.id}>{draft.title}</option>
                ))}
              </select>
              {selectedDraft && (
                <select
                  value={selectedCity || ''}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setSelectedDay(null);
                    setSelectedItems({ hotels: new Set(), restaurants: new Set(), activities: new Set() });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                >
                  <option value="">Select City</option>
                  {availableCities.map(city => (
                    <option key={city.id} value={city.id}>{city.name}, {city.country}</option>
                  ))}
                </select>
              )}
              {selectedCity && selectedDraft && (
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
            {isCurrentDraft && selectedCity && (
              <div className="flex items-center justify-between bg-blue-100 p-3 rounded-lg mt-3">
                <span className="text-sm font-medium text-gray-700">
                  {totalSelected > 0 ? `${totalSelected} item${totalSelected !== 1 ? 's' : ''} selected` : 'Select items below to copy'}
                </span>
                {totalSelected > 0 && (
                  <button
                    onClick={handleCopySelected}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors flex items-center"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy {totalSelected} Selected
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Cities with items */}
          {trip.cities_data.map((city) => {
            // Convert shared trip city to CityData format for bulk copy
            const cityAsCityData: CityData = {
              id: city.id,
              name: city.name,
              country: city.country,
              numberOfDays: 1, // Default, shared trips might not have this
              hotel: city.hotels && city.hotels.length > 0 ? {
                id: city.hotels[0].id,
                name: city.hotels[0].name || '',
                location: city.hotels[0].location || '',
                rating: city.hotels[0].rating || 0,
                review: city.hotels[0].review || '',
                liked: city.hotels[0].liked ?? null
              } : null,
              days: [{
                id: 'day-1',
                dayNumber: 1,
                restaurants: (city.restaurants || []).map((r: any) => ({
                  id: r.id || Date.now().toString(),
                  name: r.name || '',
                  location: r.location || '',
                  rating: r.rating || 0,
                  review: r.review || '',
                  liked: r.liked ?? null
                })),
                activities: (city.activities || []).map((a: any) => ({
                  id: a.id || Date.now().toString(),
                  name: a.name || '',
                  location: a.location || '',
                  rating: a.rating || 0,
                  review: a.review || '',
                  liked: a.liked ?? null
                }))
              }]
            };
            
            const totalItems = (city.hotels?.length || 0) + (city.restaurants?.length || 0) + (city.activities?.length || 0);
            
            return (
            <div key={city.id} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">{city.name}, {city.country}</h4>
              
              {/* Hotels */}
              {city.hotels.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">🏨 Hotels</h5>
                  <div className="space-y-2">
                    {city.hotels.map((hotel) => {
                      const isSelected = selectedItems.hotels.has(hotel.id || '');
                      return (
                      <div 
                        key={hotel.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          isCurrentDraft && selectedCity 
                            ? isSelected
                              ? 'bg-blue-100 border-blue-500'
                              : 'bg-blue-50 border-blue-300 hover:bg-blue-100 cursor-pointer'
                            : selectedDraft && selectedCity
                            ? 'bg-blue-50 border-blue-300 hover:bg-blue-100 cursor-pointer' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => {
                          if (isCurrentDraft && selectedCity) {
                            toggleItemSelection('hotel', hotel.id || '');
                          } else if (selectedDraft && selectedCity) {
                            onCopyItem('hotel', hotel, selectedDraft, selectedCity);
                          }
                        }}
                      >
                        <div className="flex items-center flex-1">
                          {isCurrentDraft && selectedCity && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleItemSelection('hotel', hotel.id || '')}
                              onClick={(e) => e.stopPropagation()}
                              className="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          )}
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
                        </div>
                        {isCurrentDraft && selectedCity && !isSelected ? (
                          <span className="ml-3 text-xs text-gray-500">Click to select</span>
                        ) : selectedDraft && selectedCity && !isCurrentDraft ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCopyItem('hotel', hotel, selectedDraft, selectedCity);
                            }}
                            className="ml-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center transition-colors shadow-sm"
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Save to Draft
                          </button>
                        ) : !selectedDraft || !selectedCity ? (
                          <span className="ml-3 text-xs text-gray-400">Select draft & city to save</span>
                        ) : null}
                      </div>
                    );
                    })}
                  </div>
                </div>
              )}

              {/* Restaurants */}
              {city.restaurants.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">🍽️ Restaurants</h5>
                  <div className="space-y-2">
                    {city.restaurants.map((restaurant) => {
                      const isSelected = selectedItems.restaurants.has(restaurant.id || '');
                      return (
                      <div 
                        key={restaurant.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          isCurrentDraft && selectedCity && selectedDay
                            ? isSelected
                              ? 'bg-green-100 border-green-500'
                              : 'bg-green-50 border-green-300 hover:bg-green-100 cursor-pointer'
                            : selectedDraft && selectedCity && selectedDay
                            ? 'bg-green-50 border-green-300 hover:bg-green-100 cursor-pointer' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => {
                          if (isCurrentDraft && selectedCity && selectedDay) {
                            toggleItemSelection('restaurant', restaurant.id || '');
                          } else if (selectedDraft && selectedCity && selectedDay) {
                            onCopyItem('restaurant', restaurant, selectedDraft, selectedCity, selectedDay);
                          }
                        }}
                      >
                        <div className="flex items-center flex-1">
                          {isCurrentDraft && selectedCity && selectedDay && (
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
                        </div>
                        {isCurrentDraft && selectedCity && selectedDay && !isSelected ? (
                          <span className="ml-3 text-xs text-gray-500">Click to select</span>
                        ) : selectedDraft && selectedCity && selectedDay && !isCurrentDraft ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCopyItem('restaurant', restaurant, selectedDraft, selectedCity, selectedDay);
                            }}
                            className="ml-3 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center transition-colors shadow-sm"
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Save to Draft
                          </button>
                        ) : !selectedDraft || !selectedCity || !selectedDay ? (
                          <span className="ml-3 text-xs text-gray-400">Select draft, city & day to save</span>
                        ) : null}
                      </div>
                    );
                    })}
                  </div>
                </div>
              )}

              {/* Activities */}
              {city.activities.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">🎯 Activities</h5>
                  <div className="space-y-2">
                    {city.activities.map((activity, index) => {
                      // Use a more stable ID that includes city and activity info
                      // Normalize the activity name to ensure consistent ID generation
                      const activityName = (activity.name || 'unnamed').trim().toLowerCase().replace(/\s+/g, '-');
                      const activityId = activity.id || `${city.id || 'city'}-activity-${index}-${activityName}`;
                      const isSelected = selectedItems.activities.has(activityId);
                      return (
                      <div 
                        key={activityId} 
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          isCurrentDraft && selectedCity && selectedDay
                            ? isSelected
                              ? 'bg-purple-100 border-purple-500'
                              : 'bg-purple-50 border-purple-300 hover:bg-purple-100 cursor-pointer'
                            : selectedDraft && selectedCity && selectedDay
                            ? 'bg-purple-50 border-purple-300 hover:bg-purple-100 cursor-pointer' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        onClick={(e) => {
                          // Don't toggle if clicking on the checkbox itself (it handles its own onChange)
                          if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
                            return;
                          }
                          if (isCurrentDraft && selectedCity && selectedDay) {
                            toggleItemSelection('activity', activityId);
                          } else if (selectedDraft && selectedCity && selectedDay) {
                            onCopyItem('activity', activity, selectedDraft, selectedCity, selectedDay);
                          }
                        }}
                      >
                        <div className="flex items-center flex-1">
                          {isCurrentDraft && selectedCity && selectedDay && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleItemSelection('activity', activityId);
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="mr-3 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                            />
                          )}
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
                        </div>
                        {isCurrentDraft && selectedCity && selectedDay && !isSelected ? (
                          <span className="ml-3 text-xs text-gray-500">Click to select</span>
                        ) : selectedDraft && selectedCity && selectedDay && !isCurrentDraft ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCopyItem('activity', activity, selectedDraft, selectedCity, selectedDay);
                            }}
                            className="ml-3 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center transition-colors shadow-sm"
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Save to Draft
                          </button>
                        ) : !selectedDraft || !selectedCity || !selectedDay ? (
                          <span className="ml-3 text-xs text-gray-400">Select draft, city & day to save</span>
                        ) : null}
                      </div>
                    );
                    })}
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

export default function BuildTripPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BuildTripContent />
    </Suspense>
  );
}
