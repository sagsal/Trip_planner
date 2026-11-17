// "Help me plan": members' advice on planned trips. Shared by the API and the pages.

export type Target = 'trip' | 'city' | 'place';

export const REACTIONS: Record<Target, { key: string; label: string; needsPlace?: boolean }[]> = {
  trip: [
    { key: 'too_many_days', label: 'Too many days' },
    { key: 'not_enough_days', label: 'Not enough days' },
    { key: 'wrong_season', label: 'Think about the time of year' },
    { key: 'love_it', label: 'Love this plan' },
    { key: 'add_place', label: 'You should add…', needsPlace: true },
    { key: 'note', label: 'Comment' },
  ],
  city: [
    { key: 'add_day', label: 'Add a day here' },
    { key: 'fewer_days', label: 'Fewer days here' },
    { key: 'skip_city', label: 'Skip this city' },
    { key: 'add_place', label: 'You should add…', needsPlace: true },
    { key: 'note', label: 'Comment' },
  ],
  place: [
    { key: 'great', label: 'Great choice' },
    { key: 'skip', label: 'I’d skip it' },
    { key: 'swap', label: 'Go here instead…', needsPlace: true },
    { key: 'note', label: 'Comment' },
  ],
};

export function reactionLabel(target: Target, key: string): string {
  return REACTIONS[target]?.find((r) => r.key === key)?.label || 'Comment';
}

export function needsPlace(target: Target, key: string): boolean {
  return !!REACTIONS[target]?.find((r) => r.key === key)?.needsPlace;
}

// Caps, so the section can't be used for spam
export const LIMITS = {
  commentsPerDay: 30, // per member, across all trips
  commentsPerTripPerDay: 12, // per member, on one trip
  agreesPerDay: 150,
  openTripsPerMember: 3, // planned trips open for feedback at once
  textMax: 600,
};

export interface SuggestedPlace {
  kind: 'hotel' | 'restaurant' | 'activity';
  name: string;
  location?: string | null;
  city?: string | null;
  country?: string | null;
  imageUrl?: string | null;
  webUrl?: string | null;
}

export function cleanSuggestion(s: any): SuggestedPlace | null {
  if (!s || typeof s !== 'object') return null;
  const str = (v: any, n: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null);
  const name = str(s.name, 200);
  if (!name) return null;
  const kind = s.kind === 'hotel' || s.kind === 'restaurant' || s.kind === 'activity' ? s.kind : 'activity';
  const url = (v: any) => {
    const u = str(v, 2000);
    return u && (/^https:\/\//.test(u) || /^\/api\/places\/photo\?/.test(u)) ? u : null;
  };
  return { kind, name, location: str(s.location, 300), city: str(s.city, 100), country: str(s.country, 100), imageUrl: url(s.imageUrl), webUrl: url(s.webUrl) };
}

export const firstName = (name?: string | null) => (name || 'Member').trim().split(/\s+/)[0].slice(0, 30) || 'Member';
