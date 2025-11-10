'use client';

import { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Plus, MapPin, Calendar, Star, Edit, Trash2, Copy, Save, Eye, X, ChevronDown, ChevronUp } from 'lucide-react';
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
            citiesData: trip.cities_data.map((city: any) => {
            // For now, we'll create a simple structure
            // In a full implementation, we'd properly handle days
            const numberOfDays = 1; // Default, should be stored in DB
            return {
              id: city.id,
              name: city.name,
              country: city.country,
              numberOfDays,
              hotel: city.hotels && city.hotels.length > 0 ? city.hotels[0] : null,
              days: [{
                id: 'day-1',
                dayNumber: 1,
                restaurants: city.restaurants || [],
                activities: city.activities || []
              }]
            };
          }),
          createdAt: trip.createdAt
          };
        });
        setDraftTrips(transformed);
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
        setSharedTrips(data.trips || []);
      }
    } catch (err) {
      console.error('Error loading shared trips:', err);
    }
  };

  const handleCreateDraft = async () => {
    if (!user) return;
    if (!formData.title || citiesData.length === 0) {
      setError('Please fill in trip title and add at least one city');
      return;
    }

    try {
      setError(null);
      
      // Collect unique countries from cities
      const uniqueCountries = Array.from(new Set(citiesData.map(city => city.country)));
      
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

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          countries: JSON.stringify(uniqueCountries),
          cities: JSON.stringify(citiesData.map(c => c.name)),
          citiesData: transformedCitiesData,
          isDraft: true,
          userId: user.id,
          userName: user.name,
          userEmail: user.email
        })
      });

      if (response.ok) {
        setShowCreateDraft(false);
        setFormData({ title: '', description: '', startDate: '', endDate: '', numberOfDays: '', countries: [''] });
        setCitiesData([]);
        setSelectedCountry('');
        setSelectedCity('');
        setCustomCityName('');
        setSelectedNumberOfDays('');
        loadDraftTrips();
        setSuccess('Draft trip created successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create draft trip');
      }
    } catch (err) {
      setError('An error occurred while creating the draft trip');
    }
  };

  const handleCopyItem = async (itemType: 'hotel' | 'restaurant' | 'activity', item: any, targetDraftId: string, targetCityId: string, targetDayId?: string) => {
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
        setError(data.error || 'Failed to copy item');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
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
            {/* Trip Information Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Trip Information</h2>
              
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
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleCreateDraft}
                  className="px-6 py-2 bg-[#AAB624] text-white rounded-lg hover:bg-[#AAB624]/90 transition-colors font-semibold"
                >
                  Create Draft
                </button>
                <button
                  onClick={() => {
                    setShowCreateDraft(false);
                    setFormData({ title: '', description: '', startDate: '', endDate: '', numberOfDays: '', countries: [''] });
                    setCitiesData([]);
                    setSelectedCountry('');
                    setSelectedCity('');
                    setCustomCityName('');
                    setSelectedNumberOfDays('');
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
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
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse Shared Trips</h2>
              <p className="text-gray-600 text-sm">
                💡 <strong>How it works:</strong> Select a draft trip and city (and day for restaurants/activities) from the dropdowns below, then click on any item from shared trips to save it to your draft. This is your sandbox to collect ideas before finalizing your trip!
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
                    onCopyItem={handleCopyItem}
                    expandedSections={expandedSections}
                    toggleSection={toggleTripSection}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Shared Trip Card Component
function SharedTripCard({ 
  trip, 
  draftTrips, 
  onCopyItem, 
  expandedSections, 
  toggleSection 
}: { 
  trip: SharedTrip; 
  draftTrips: DraftTrip[]; 
  onCopyItem: (itemType: 'hotel' | 'restaurant' | 'activity', item: any, targetDraftId: string, targetCityId: string, targetDayId?: string) => void;
  expandedSections: {[key: string]: boolean};
  toggleSection: (key: string) => void;
}) {
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);
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
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
              >
                <option value="">Select Draft Trip</option>
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
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                >
                  <option value="">Select City</option>
                  {draftTrips.find(d => d.id === selectedDraft)?.citiesData.map(city => (
                    <option key={city.id} value={city.id}>{city.name}, {city.country}</option>
                  ))}
                </select>
              )}
              {selectedCity && selectedDraft && (
                <select
                  value={selectedDay || ''}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                >
                  <option value="">Select Day (for restaurants/activities)</option>
                  {draftTrips.find(d => d.id === selectedDraft)?.citiesData.find(c => c.id === selectedCity)?.days.map(day => (
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
                          selectedDraft && selectedCity 
                            ? 'bg-blue-50 border-blue-300 hover:bg-blue-100 cursor-pointer' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => {
                          if (selectedDraft && selectedCity) {
                            onCopyItem('hotel', hotel, selectedDraft, selectedCity);
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
                        {selectedDraft && selectedCity ? (
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
                        ) : (
                          <span className="ml-3 text-xs text-gray-400">Select draft & city to save</span>
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
                          selectedDraft && selectedCity && selectedDay
                            ? 'bg-green-50 border-green-300 hover:bg-green-100 cursor-pointer' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => {
                          if (selectedDraft && selectedCity && selectedDay) {
                            onCopyItem('restaurant', restaurant, selectedDraft, selectedCity, selectedDay);
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
                        {selectedDraft && selectedCity && selectedDay ? (
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
                        ) : (
                          <span className="ml-3 text-xs text-gray-400">Select draft, city & day to save</span>
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
                          selectedDraft && selectedCity && selectedDay
                            ? 'bg-purple-50 border-purple-300 hover:bg-purple-100 cursor-pointer' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => {
                          if (selectedDraft && selectedCity && selectedDay) {
                            onCopyItem('activity', activity, selectedDraft, selectedCity, selectedDay);
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
                        {selectedDraft && selectedCity && selectedDay ? (
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
                        ) : (
                          <span className="ml-3 text-xs text-gray-400">Select draft, city & day to save</span>
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

export default function BuildTripPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BuildTripContent />
    </Suspense>
  );
}
