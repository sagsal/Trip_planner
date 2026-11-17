// Optional "about you" questions asked when creating an account (kept private, never shown publicly)
import { REGIONS, countriesIn, regionOf } from '@/lib/regions';

export const AGE_BRACKETS = ['18–24', '25–34', '35–44', '45–54', '55–64', '65–74', '75+'] as const;

export const ALL_COUNTRIES: string[] = Array.from(new Set<string>(REGIONS.flatMap((r) => countriesIn(r)))).sort((a, b) => a.localeCompare(b));

/** Keep only answers from the lists (anything else is dropped) */
export function cleanProfile(body: any): { homeRegion: string | null; homeCountry: string | null; ageBracket: string | null } {
  const country = typeof body?.homeCountry === 'string' && ALL_COUNTRIES.includes(body.homeCountry) ? body.homeCountry : null;
  let region = typeof body?.homeRegion === 'string' && (REGIONS as readonly string[]).includes(body.homeRegion) ? body.homeRegion : null;
  if (country && !region) region = regionOf(country) || null;
  const age = typeof body?.ageBracket === 'string' && (AGE_BRACKETS as readonly string[]).includes(body.ageBracket) ? body.ageBracket : null;
  return { homeRegion: region, homeCountry: country, ageBracket: age };
}
