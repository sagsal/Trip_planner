/** My Travel Sandbox: shared types and input cleaning (used by the API and the pages). */

export type PlaceKind = 'hotel' | 'restaurant' | 'activity';

export interface SandboxTripData {
  id: string;
  title: string;
  region?: string | null;
  tripType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface SavedPlaceData {
  id: string;
  sandboxTripId: string | null;
  kind: PlaceKind;
  name: string;
  location?: string | null;
  city?: string | null;
  country?: string | null;
  imageUrl?: string | null;
  webUrl?: string | null;
  stayType?: string | null;
  sourceTripId?: string | null;
  sourceTripTitle?: string | null;
  sourceUserName?: string | null;
  sourceRating?: number | null;
  sourceReview?: string | null;
  note?: string | null;
  dayNumber?: number | null;
  createdAt?: string;
}

/** What the trip page sends when someone taps ＋ */
export interface PlaceToSave {
  kind: PlaceKind;
  name: string;
  location?: string | null;
  city?: string | null;
  country?: string | null;
  imageUrl?: string | null;
  webUrl?: string | null;
  stayType?: string | null;
  sourceTripId?: string | null;
  sourceTripTitle?: string | null;
  sourceUserName?: string | null;
  sourceRating?: number | null;
  sourceReview?: string | null;
  dayNumber?: number | null; // e.g. from "Fill with AI"
  note?: string | null;
}

/** Marks places suggested by "Fill with AI" from Google (not from a trip on the site). */
export const AI_SUGGESTION = 'AI suggestion';

const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
const isoDate = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.trim()) ? v.trim() : null);
const httpsOrPhoto = (v: unknown) =>
  typeof v === 'string' && (v.startsWith('/api/places/photo?') || /^https:\/\//.test(v)) ? v.slice(0, 2000) : null;

export function cleanPlace(p: any): Omit<PlaceToSave, 'kind'> & { kind: PlaceKind } | null {
  const kind: PlaceKind | null = p?.kind === 'hotel' || p?.kind === 'restaurant' || p?.kind === 'activity' ? p.kind : null;
  const name = str(p?.name, 200);
  if (!kind || !name) return null;
  const rating = Math.round(Number(p?.sourceRating));
  return {
    kind,
    name,
    location: str(p?.location, 300),
    city: str(p?.city, 120),
    country: str(p?.country, 120),
    imageUrl: httpsOrPhoto(p?.imageUrl),
    webUrl: typeof p?.webUrl === 'string' && /^https:\/\//.test(p.webUrl) ? p.webUrl.slice(0, 2000) : null,
    stayType: p?.stayType === 'rental' ? 'rental' : null,
    sourceTripId: str(p?.sourceTripId, 60),
    sourceTripTitle: str(p?.sourceTripTitle, 200),
    sourceUserName: str(p?.sourceUserName, 120),
    sourceRating: rating >= 1 && rating <= 5 ? rating : null,
    sourceReview: str(p?.sourceReview, 4000),
    dayNumber: Math.round(Number(p?.dayNumber)) >= 1 && Math.round(Number(p?.dayNumber)) <= 90 ? Math.round(Number(p.dayNumber)) : null,
    note: str(p?.note, 4000),
  };
}

export function cleanTripFields(b: any) {
  const out: Record<string, string | null> = {};
  if (b?.title !== undefined) out.title = str(b.title, 150) || 'My next trip';
  if (b?.region !== undefined) out.region = str(b.region, 60);
  if (b?.tripType !== undefined) out.tripType = str(b.tripType, 60);
  if (b?.startDate !== undefined) out.startDate = isoDate(b.startDate);
  if (b?.endDate !== undefined) out.endDate = isoDate(b.endDate);
  if (b?.notes !== undefined) out.notes = str(b.notes, 4000);
  return out;
}

/** Fired in the browser whenever the sandbox changes, so the top-bar counter updates. */
export const SANDBOX_EVENT = 'sandbox:changed';
export const LAST_SANDBOX_TRIP_KEY = 'tripshare:lastSandboxTrip';
