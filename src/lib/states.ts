// States / provinces for countries where travellers usually say which one (e.g. Newfoundland, Canada)

export const STATES: Record<string, string[]> = {
  Canada: [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories',
    'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon',
  ],
  'United States': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
    'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
    'Washington', 'West Virginia', 'Wisconsin', 'Wyoming', 'Puerto Rico', 'U.S. Virgin Islands', 'Guam',
  ],
  Australia: [
    'Australian Capital Territory', 'New South Wales', 'Northern Territory', 'Queensland', 'South Australia', 'Tasmania',
    'Victoria', 'Western Australia',
  ],
  Mexico: [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Coahuila', 'Colima',
    'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Mexico City', 'México (State)', 'Michoacán', 'Morelos',
    'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora',
    'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
  ],
};

/** Country names as travellers may type them */
const ALIASES: Record<string, string> = { USA: 'United States', 'United States of America': 'United States', US: 'United States' };

export function statesOf(country: string): string[] {
  return STATES[ALIASES[country] || country] || [];
}

/** "State" / "Province" / "State or territory", for labels */
export function stateLabel(country: string): string {
  const c = ALIASES[country] || country;
  if (c === 'Canada') return 'Province or territory';
  if (c === 'Australia') return 'State or territory';
  return 'State';
}

/** Main cities and towns travellers visit, by state / province (the "Choose a city" list follows the one picked) */
export const CITIES_BY_STATE: Record<string, Record<string, string[]>> = {
  Canada: {
    Alberta: ['Calgary', 'Edmonton', 'Banff', 'Canmore', 'Jasper', 'Lake Louise', 'Drumheller', 'Red Deer', 'Lethbridge', 'Waterton'],
    'British Columbia': ['Vancouver', 'Victoria', 'Whistler', 'Kelowna', 'Tofino', 'Penticton', 'Squamish', 'Nanaimo', 'Kamloops', 'Revelstoke', 'Prince Rupert', 'Salt Spring Island'],
    Manitoba: ['Winnipeg', 'Churchill', 'Brandon', 'Gimli', 'Riding Mountain National Park'],
    'New Brunswick': ['Saint John', 'Fredericton', 'Moncton', 'St. Andrews', 'Fundy National Park', 'Shediac'],
    'Newfoundland and Labrador': ["St. John's", 'Gros Morne National Park', 'Twillingate', 'Trinity', 'Bonavista', 'Corner Brook', 'Fogo Island', 'Gander', 'Deer Lake', 'Ferryland', "L'Anse aux Meadows", 'Happy Valley-Goose Bay'],
    'Northwest Territories': ['Yellowknife', 'Inuvik', 'Hay River', 'Fort Smith'],
    'Nova Scotia': ['Halifax', 'Lunenburg', 'Peggy’s Cove', 'Cape Breton Island', 'Baddeck', 'Wolfville', 'Annapolis Royal', 'Mahone Bay', 'Sydney', 'Digby'],
    Nunavut: ['Iqaluit', 'Pond Inlet', 'Cambridge Bay', 'Rankin Inlet'],
    Ontario: ['Toronto', 'Ottawa', 'Niagara Falls', 'Niagara-on-the-Lake', 'Muskoka', 'Prince Edward County', 'Kingston', 'Stratford', 'Hamilton', 'London', 'Collingwood', 'Algonquin Park', 'Thunder Bay', 'Tobermory', 'Sudbury'],
    'Prince Edward Island': ['Charlottetown', 'Cavendish', 'Summerside', 'Souris', 'North Rustico'],
    Quebec: ['Montreal', 'Quebec City', 'Mont-Tremblant', 'Tadoussac', 'Charlevoix', 'Gatineau', 'Sherbrooke', 'Magog', 'Gaspé', 'Percé', 'Îles de la Madeleine'],
    Saskatchewan: ['Saskatoon', 'Regina', 'Moose Jaw', 'Prince Albert National Park'],
    Yukon: ['Whitehorse', 'Dawson City', 'Kluane National Park', 'Carcross'],
  },
  'United States': {
    Alabama: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Gulf Shores', 'Orange Beach'],
    Alaska: ['Anchorage', 'Juneau', 'Fairbanks', 'Denali National Park', 'Seward', 'Ketchikan', 'Skagway', 'Homer', 'Talkeetna', 'Sitka'],
    Arizona: ['Phoenix', 'Scottsdale', 'Sedona', 'Tucson', 'Grand Canyon', 'Flagstaff', 'Page', 'Tempe', 'Prescott'],
    Arkansas: ['Little Rock', 'Hot Springs', 'Fayetteville', 'Bentonville', 'Eureka Springs'],
    California: ['Los Angeles', 'San Francisco', 'San Diego', 'Napa', 'Sonoma', 'Santa Barbara', 'Palm Springs', 'Lake Tahoe', 'Yosemite National Park', 'Monterey', 'Carmel-by-the-Sea', 'Big Sur', 'Malibu', 'Laguna Beach', 'Sacramento', 'San Jose', 'Mendocino', 'Joshua Tree'],
    Colorado: ['Denver', 'Boulder', 'Aspen', 'Vail', 'Breckenridge', 'Colorado Springs', 'Telluride', 'Estes Park', 'Durango', 'Steamboat Springs'],
    Connecticut: ['Hartford', 'New Haven', 'Mystic', 'Greenwich', 'Stamford', 'Old Saybrook'],
    Delaware: ['Wilmington', 'Rehoboth Beach', 'Dover', 'Lewes'],
    'District of Columbia': ['Washington, D.C.'],
    Florida: ['Miami', 'Orlando', 'Tampa', 'Key West', 'Miami Beach', 'Fort Lauderdale', 'Naples', 'St. Petersburg', 'Sarasota', 'Palm Beach', 'Destin', 'Jacksonville', 'St. Augustine', 'Clearwater', 'Islamorada'],
    Georgia: ['Atlanta', 'Savannah', 'Athens', 'Augusta', 'St. Simons Island', 'Jekyll Island'],
    Hawaii: ['Honolulu', 'Waikiki', 'Maui', 'Lahaina', 'Kauai', 'Kona', 'Hilo', 'Big Island', 'Lanai', 'North Shore (Oahu)'],
    Idaho: ['Boise', 'Sun Valley', 'Coeur d’Alene', 'Sandpoint', 'McCall'],
    Illinois: ['Chicago', 'Springfield', 'Galena', 'Evanston'],
    Indiana: ['Indianapolis', 'Bloomington', 'Fort Wayne', 'South Bend'],
    Iowa: ['Des Moines', 'Iowa City', 'Cedar Rapids', 'Dubuque'],
    Kansas: ['Wichita', 'Kansas City', 'Lawrence', 'Topeka'],
    Kentucky: ['Louisville', 'Lexington', 'Bowling Green', 'Bardstown'],
    Louisiana: ['New Orleans', 'Baton Rouge', 'Lafayette', 'Shreveport'],
    Maine: ['Portland', 'Bar Harbor', 'Acadia National Park', 'Kennebunkport', 'Camden', 'Ogunquit', 'Boothbay Harbor', 'Freeport'],
    Maryland: ['Baltimore', 'Annapolis', 'Ocean City', 'St. Michaels', 'Frederick'],
    Massachusetts: ['Boston', 'Cape Cod', 'Martha’s Vineyard', 'Nantucket', 'Cambridge', 'Salem', 'Provincetown', 'Plymouth', 'The Berkshires', 'Lenox'],
    Michigan: ['Detroit', 'Grand Rapids', 'Traverse City', 'Mackinac Island', 'Ann Arbor', 'Holland', 'Petoskey', 'Saugatuck'],
    Minnesota: ['Minneapolis', 'St. Paul', 'Duluth', 'Rochester', 'Stillwater'],
    Mississippi: ['Jackson', 'Biloxi', 'Oxford', 'Natchez'],
    Missouri: ['St. Louis', 'Kansas City', 'Branson', 'Springfield'],
    Montana: ['Bozeman', 'Missoula', 'Whitefish', 'Glacier National Park', 'Big Sky', 'Billings', 'Helena'],
    Nebraska: ['Omaha', 'Lincoln'],
    Nevada: ['Las Vegas', 'Reno', 'Lake Tahoe', 'Henderson'],
    'New Hampshire': ['Portsmouth', 'North Conway', 'Manchester', 'Hanover', 'Lake Winnipesaukee'],
    'New Jersey': ['Atlantic City', 'Cape May', 'Princeton', 'Jersey City', 'Hoboken', 'Asbury Park'],
    'New Mexico': ['Santa Fe', 'Albuquerque', 'Taos', 'Las Cruces', 'White Sands'],
    'New York': ['New York City', 'Brooklyn', 'The Hamptons', 'Buffalo', 'Niagara Falls', 'Lake Placid', 'Hudson Valley', 'Saratoga Springs', 'Ithaca', 'Albany', 'Rochester', 'Montauk', 'Cooperstown'],
    'North Carolina': ['Asheville', 'Charlotte', 'Raleigh', 'Durham', 'Wilmington', 'Outer Banks', 'Boone', 'Chapel Hill'],
    'North Dakota': ['Fargo', 'Bismarck', 'Medora'],
    Ohio: ['Columbus', 'Cleveland', 'Cincinnati', 'Sandusky', 'Dayton'],
    Oklahoma: ['Oklahoma City', 'Tulsa'],
    Oregon: ['Portland', 'Bend', 'Cannon Beach', 'Eugene', 'Hood River', 'Ashland', 'Crater Lake', 'Newport'],
    Pennsylvania: ['Philadelphia', 'Pittsburgh', 'Lancaster', 'Gettysburg', 'Hershey', 'Poconos'],
    'Rhode Island': ['Newport', 'Providence', 'Block Island', 'Westerly'],
    'South Carolina': ['Charleston', 'Myrtle Beach', 'Hilton Head Island', 'Greenville', 'Columbia', 'Kiawah Island', 'Beaufort'],
    'South Dakota': ['Rapid City', 'Mount Rushmore', 'Sioux Falls', 'Deadwood', 'Badlands National Park'],
    Tennessee: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Gatlinburg', 'Pigeon Forge'],
    Texas: ['Austin', 'Houston', 'Dallas', 'San Antonio', 'Fort Worth', 'Fredericksburg', 'Galveston', 'El Paso', 'Marfa', 'South Padre Island', 'Big Bend National Park'],
    Utah: ['Salt Lake City', 'Park City', 'Moab', 'Zion National Park', 'Bryce Canyon', 'St. George', 'Springdale'],
    Vermont: ['Burlington', 'Stowe', 'Woodstock', 'Manchester', 'Killington', 'Montpelier'],
    Virginia: ['Richmond', 'Virginia Beach', 'Charlottesville', 'Williamsburg', 'Alexandria', 'Shenandoah National Park', 'Norfolk'],
    Washington: ['Seattle', 'San Juan Islands', 'Spokane', 'Leavenworth', 'Walla Walla', 'Tacoma', 'Olympic National Park', 'Mount Rainier National Park'],
    'West Virginia': ['Charleston', 'Morgantown', 'Harpers Ferry', 'New River Gorge'],
    Wisconsin: ['Milwaukee', 'Madison', 'Door County', 'Wisconsin Dells', 'Green Bay', 'Lake Geneva'],
    Wyoming: ['Jackson Hole', 'Yellowstone National Park', 'Grand Teton National Park', 'Cody', 'Cheyenne', 'Laramie'],
    'Puerto Rico': ['San Juan', 'Rincón', 'Vieques', 'Culebra', 'Ponce', 'Fajardo'],
    'U.S. Virgin Islands': ['St. Thomas', 'St. John', 'St. Croix'],
    Guam: ['Tumon', 'Hagåtña'],
  },
  Australia: {
    'Australian Capital Territory': ['Canberra'],
    'New South Wales': ['Sydney', 'Byron Bay', 'Blue Mountains', 'Hunter Valley', 'Newcastle', 'Port Macquarie', 'Jervis Bay', 'Coffs Harbour'],
    'Northern Territory': ['Darwin', 'Alice Springs', 'Uluru', 'Kakadu National Park', 'Katherine'],
    Queensland: ['Brisbane', 'Gold Coast', 'Cairns', 'Port Douglas', 'Noosa', 'Whitsunday Islands', 'Airlie Beach', 'Sunshine Coast', 'Fraser Island (K’gari)'],
    'South Australia': ['Adelaide', 'Barossa Valley', 'Kangaroo Island', 'McLaren Vale', 'Clare Valley'],
    Tasmania: ['Hobart', 'Launceston', 'Freycinet National Park', 'Cradle Mountain', 'Bruny Island', 'Port Arthur'],
    Victoria: ['Melbourne', 'Great Ocean Road', 'Yarra Valley', 'Mornington Peninsula', 'Phillip Island', 'Grampians', 'Ballarat', 'Lorne'],
    'Western Australia': ['Perth', 'Margaret River', 'Fremantle', 'Broome', 'Rottnest Island', 'Exmouth', 'Esperance'],
  },
  Mexico: {
    Aguascalientes: ['Aguascalientes'],
    'Baja California': ['Tijuana', 'Ensenada', 'Valle de Guadalupe', 'Rosarito', 'Mexicali'],
    'Baja California Sur': ['Cabo San Lucas', 'San José del Cabo', 'La Paz', 'Todos Santos', 'Loreto'],
    Campeche: ['Campeche', 'Calakmul'],
    Chiapas: ['San Cristóbal de las Casas', 'Palenque', 'Tuxtla Gutiérrez'],
    Chihuahua: ['Chihuahua', 'Copper Canyon (Creel)', 'Ciudad Juárez'],
    Coahuila: ['Saltillo', 'Parras'],
    Colima: ['Manzanillo', 'Colima'],
    Durango: ['Durango'],
    Guanajuato: ['San Miguel de Allende', 'Guanajuato', 'León', 'Dolores Hidalgo'],
    Guerrero: ['Acapulco', 'Ixtapa', 'Zihuatanejo', 'Taxco'],
    Hidalgo: ['Pachuca', 'Real del Monte'],
    Jalisco: ['Guadalajara', 'Puerto Vallarta', 'Tequila', 'Tlaquepaque', 'Chapala', 'Ajijic'],
    'Mexico City': ['Mexico City', 'Polanco', 'Roma Norte', 'Condesa', 'Coyoacán', 'Centro Histórico'],
    'México (State)': ['Toluca', 'Valle de Bravo', 'Teotihuacán'],
    Michoacán: ['Morelia', 'Pátzcuaro', 'Uruapan'],
    Morelos: ['Cuernavaca', 'Tepoztlán'],
    Nayarit: ['Punta de Mita', 'Sayulita', 'Nuevo Vallarta', 'San Pancho', 'Bucerías'],
    'Nuevo León': ['Monterrey'],
    Oaxaca: ['Oaxaca City', 'Puerto Escondido', 'Huatulco', 'Mazunte', 'Hierve el Agua'],
    Puebla: ['Puebla', 'Cholula'],
    Querétaro: ['Querétaro', 'Bernal', 'Tequisquiapan'],
    'Quintana Roo': ['Cancún', 'Playa del Carmen', 'Tulum', 'Cozumel', 'Isla Mujeres', 'Bacalar', 'Holbox', 'Puerto Morelos'],
    'San Luis Potosí': ['San Luis Potosí', 'Xilitla', 'Real de Catorce'],
    Sinaloa: ['Mazatlán', 'Culiacán'],
    Sonora: ['Hermosillo', 'Puerto Peñasco', 'San Carlos', 'Álamos'],
    Tabasco: ['Villahermosa'],
    Tamaulipas: ['Tampico'],
    Tlaxcala: ['Tlaxcala'],
    Veracruz: ['Veracruz', 'Xalapa'],
    Yucatán: ['Mérida', 'Valladolid', 'Izamal', 'Chichén Itzá', 'Progreso'],
    Zacatecas: ['Zacatecas'],
  },
};

/** Cities for a state, or [] when there's no list */
export function citiesInState(country: string, state: string): string[] {
  return CITIES_BY_STATE[ALIASES[country] || country]?.[state] || [];
}
