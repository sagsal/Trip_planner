/** Regions for the "Region" dropdown in Add your trip, and which countries belong to each. */
export const REGIONS = [
  'Africa',
  'Asia',
  'Caribbean',
  'Central America',
  'Europe',
  'Middle East',
  'North America',
  'Oceania',
  'South America',
] as const;
export type Region = (typeof REGIONS)[number];

const BY_REGION: Record<Region, string[]> = {
  Africa: ['Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde', 'Central African Republic', 'Chad', 'Comoros', 'Congo', 'Djibouti', 'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda', 'São Tomé and Príncipe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'],
  Asia: ['Afghanistan', 'Bangladesh', 'Bhutan', 'Brunei', 'Cambodia', 'China', 'East Timor', 'India', 'Indonesia', 'Japan', 'Kazakhstan', 'Kyrgyzstan', 'Laos', 'Malaysia', 'Maldives', 'Mongolia', 'Myanmar', 'Nepal', 'North Korea', 'Pakistan', 'Philippines', 'Singapore', 'South Korea', 'Sri Lanka', 'Taiwan', 'Tajikistan', 'Thailand', 'Turkmenistan', 'Uzbekistan', 'Vietnam'],
  Caribbean: ['Antigua and Barbuda', 'Bahamas', 'Barbados', 'Cuba', 'Dominica', 'Dominican Republic', 'Grenada', 'Haiti', 'Jamaica', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Trinidad and Tobago'],
  'Central America': ['Belize', 'Costa Rica', 'El Salvador', 'Guatemala', 'Honduras', 'Nicaragua', 'Panama'],
  Europe: ['Albania', 'Andorra', 'Armenia', 'Austria', 'Azerbaijan', 'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Georgia', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy', 'Kosovo', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia', 'Norway', 'Poland', 'Portugal', 'Romania', 'Russia', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Turkey', 'Ukraine', 'United Kingdom', 'Vatican City'],
  'Middle East': ['Bahrain', 'Iran', 'Iraq', 'Israel', 'Jordan', 'Kuwait', 'Lebanon', 'Oman', 'Palestine', 'Qatar', 'Saudi Arabia', 'Syria', 'United Arab Emirates', 'Yemen'],
  'North America': ['Canada', 'Mexico', 'United States'],
  Oceania: ['Australia', 'Fiji', 'Kiribati', 'Marshall Islands', 'Micronesia', 'Nauru', 'New Zealand', 'Palau', 'Papua New Guinea', 'Samoa', 'Solomon Islands', 'Tonga', 'Tuvalu', 'Vanuatu'],
  'South America': ['Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Guyana', 'Paraguay', 'Peru', 'Suriname', 'Uruguay', 'Venezuela'],
};

const REGION_OF: Record<string, Region> = {};
for (const r of REGIONS) for (const c of BY_REGION[r]) REGION_OF[c.toLowerCase()] = r;

/** Countries in a region, alphabetical. */
export function countriesIn(region: string): string[] {
  return (BY_REGION as Record<string, string[]>)[region] ? [...BY_REGION[region as Region]].sort((a, b) => a.localeCompare(b)) : [];
}

/** Region a country belongs to, or '' if unknown. */
export function regionOf(country: string): Region | '' {
  return REGION_OF[(country || '').trim().toLowerCase()] || '';
}

/** A trip name made from its countries (and cities when there's just one country). */
export function tripNameFrom(countries: string[], citiesByCountry: Record<string, string[]>): string {
  const list = countries.filter(Boolean);
  const join = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} & ${xs[xs.length - 1]}`);
  if (list.length === 0) return 'My trip';
  if (list.length === 1) {
    const cities = (citiesByCountry[list[0]] || []).filter(Boolean);
    if (cities.length >= 1 && cities.length <= 3) return `${join(cities)}, ${list[0]}`;
    return list[0];
  }
  return list.length <= 4 ? join(list) : `${list.slice(0, 3).join(', ')} & ${list.length - 3} more`;
}

/** "Type of trip" choices in Add your trip. */
export const TRIP_TYPES: { value: string; icon: string }[] = [
  { value: 'Solo', icon: '🧳' },
  { value: 'Couple', icon: '💑' },
  { value: 'Honeymoon', icon: '💍' },
  { value: 'Family', icon: '👨‍👩‍👧' },
  { value: 'Family with young kids', icon: '🧸' },
  { value: 'Family with teens', icon: '🎧' },
  { value: 'Multi-generational', icon: '👵' },
  { value: 'Friends', icon: '🥂' },
  { value: 'Girls’ / guys’ trip', icon: '🎉' },
  { value: 'Group tour', icon: '🚌' },
  { value: 'Business + leisure', icon: '💼' },
  { value: 'Backpacking', icon: '🎒' },
  { value: 'Road trip', icon: '🚗' },
];
export const tripTypeIcon = (t?: string | null) => TRIP_TYPES.find((x) => x.value === t)?.icon || '';
export const cleanTripType = (t: unknown) =>
  typeof t === 'string' && TRIP_TYPES.some((x) => x.value === t.trim()) ? t.trim() : null;
