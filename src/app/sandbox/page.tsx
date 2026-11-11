'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package, Plus, Inbox, Map as MapIcon, Trash2, Star, ExternalLink, ArrowRight, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { REGIONS, TRIP_TYPES, tripTypeIcon } from '@/lib/regions';
import { linkLabel } from '@/lib/placeDetails';
import { IMPORT_STORAGE_KEY, type ImportedTrip } from '@/lib/tripImport';
import { SANDBOX_EVENT, type SandboxTripData, type SavedPlaceData, type PlaceKind } from '@/lib/sandbox';

const KIND_LABEL: Record<PlaceKind, { one: string; many: string; icon: string }> = {
  hotel: { one: 'Hotel', many: 'Where to stay', icon: '🏨' },
  activity: { one: 'Activity', many: 'Things to do', icon: '🎯' },
  restaurant: { one: 'Restaurant', many: 'Where to eat', icon: '🍽️' },
};
const KIND_ORDER: PlaceKind[] = ['hotel', 'activity', 'restaurant'];

function getUser(): { id: string; name?: string } | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function SandboxPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name?: string } | null>(null);
  const [checked, setChecked] = useState(false);
  const [trips, setTrips] = useState<SandboxTripData[]>([]);
  const [places, setPlaces] = useState<SavedPlaceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string>(''); // '' = Unsorted
  const [kindFilter, setKindFilter] = useState<PlaceKind | 'all'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setUser(getUser());
    setChecked(true);
  }, []);

  const load = useCallback(async (u: { id: string }) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/sandbox?userId=${encodeURIComponent(u.id)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Couldn’t load your sandbox.');
      setTrips(data.trips || []);
      setPlaces(data.places || []);
      // Open the most recent trip, or Unsorted if that's where everything is
      setSelected((cur) => (cur && (data.trips || []).some((t: SandboxTripData) => t.id === cur) ? cur : data.trips?.[0]?.id || ''));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t load your sandbox.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load(user);
    else if (checked) setLoading(false);
  }, [user, checked, load]);

  const announce = (count: number) => window.dispatchEvent(new CustomEvent(SANDBOX_EVENT, { detail: { count } }));

  const countFor = (tripId: string) => places.filter((p) => (p.sandboxTripId || '') === tripId).length;
  const current = trips.find((t) => t.id === selected) || null;
  const shown = useMemo(
    () => places.filter((p) => (p.sandboxTripId || '') === selected && (kindFilter === 'all' || p.kind === kindFilter)),
    [places, selected, kindFilter]
  );

  // Group: country → city → kind
  const grouped = useMemo((): Map<string, Map<string, SavedPlaceData[]>> => {
    const byCountry = new Map<string, Map<string, SavedPlaceData[]>>();
    for (const p of shown) {
      const country = p.country || 'Other';
      const city = p.city || 'Anywhere';
      if (!byCountry.has(country)) byCountry.set(country, new Map());
      const cities = byCountry.get(country)!;
      if (!cities.has(city)) cities.set(city, []);
      cities.get(city)!.push(p);
    }
    return byCountry;
  }, [shown]);

  /* ---------------- actions ---------------- */
  const createTrip = async () => {
    if (!user) return;
    setCreating(true);
    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, title: newTitle.trim() || 'My next trip' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Couldn’t create the trip.');
      setTrips((prev) => [data.trip, ...prev]);
      setSelected(data.trip.id);
      setNewTitle('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t create the trip.');
    } finally {
      setCreating(false);
    }
  };

  const patchTrip = async (id: string, fields: Partial<SandboxTripData>) => {
    if (!user) return;
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...fields } : t)));
    await fetch(`/api/sandbox/trips/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, ...fields }),
    }).catch(() => {});
  };

  const deleteTrip = async (t: SandboxTripData) => {
    if (!user) return;
    const n = countFor(t.id);
    if (!window.confirm(`Remove the planned trip “${t.title}”?${n ? ` Its ${n} saved ${n === 1 ? 'place moves' : 'places move'} to Unsorted.` : ''}`)) return;
    await fetch(`/api/sandbox/trips/${t.id}?userId=${encodeURIComponent(user.id)}`, { method: 'DELETE' }).catch(() => {});
    setTrips((prev) => prev.filter((x) => x.id !== t.id));
    setPlaces((prev) => prev.map((p) => (p.sandboxTripId === t.id ? { ...p, sandboxTripId: null, dayNumber: null } : p)));
    setSelected('');
  };

  const patchPlace = async (id: string, fields: Partial<SavedPlaceData>) => {
    if (!user) return;
    setPlaces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...fields, ...(fields.sandboxTripId !== undefined ? { dayNumber: null } : {}) } : p))
    );
    await fetch(`/api/sandbox/places/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, ...fields }),
    }).catch(() => {});
  };

  const removePlace = async (id: string) => {
    if (!user) return;
    setPlaces((prev) => prev.filter((p) => p.id !== id));
    const res = await fetch(`/api/sandbox/places/${id}?userId=${encodeURIComponent(user.id)}`, { method: 'DELETE' }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (typeof data.count === 'number') announce(data.count);
  };

  /** Turn a planned trip into a real draft trip, using the same form as "Add your trip". */
  const turnIntoTrip = (t: SandboxTripData) => {
    const mine = places.filter((p) => p.sandboxTripId === t.id);
    if (mine.length === 0) {
      window.alert('Save some places to this trip first.');
      return;
    }
    const cities: ImportedTrip['cities'] = [];
    const findCity = (name: string, country: string) => {
      let c = cities.find((x) => x.name === name && x.country === country);
      if (!c) {
        c = { name, country, numberOfDays: 1, hotels: [], days: [] };
        cities.push(c);
      }
      return c;
    };
    // Oldest first, so cities appear in the order they were added to the plan
    for (const p of [...mine].reverse()) {
      const c = findCity(p.city || 'Anywhere', p.country || '');
      const place = {
        name: p.name,
        location: p.location || '',
        rating: 0, // their own rating comes after the trip
        review: '',
        imageUrl: p.imageUrl || null,
        webUrl: p.webUrl || null,
        stayType: p.stayType === 'rental' ? ('rental' as const) : null,
      };
      if (p.kind === 'hotel') {
        c.hotels.push(place);
        continue;
      }
      const dayNumber = p.dayNumber || 1;
      c.numberOfDays = Math.max(c.numberOfDays, dayNumber);
      let day = c.days.find((d) => d.dayNumber === dayNumber);
      if (!day) {
        day = { dayNumber, restaurants: [], activities: [] };
        c.days.push(day);
      }
      (p.kind === 'restaurant' ? day.restaurants : day.activities).push(place);
    }
    const imported: ImportedTrip = {
      title: t.title,
      startDate: t.startDate || '',
      endDate: t.endDate || '',
      cities,
      warnings: [],
      rowCount: mine.length,
      source: 'sandbox',
      region: t.region || undefined,
      tripType: t.tripType || undefined,
    };
    sessionStorage.setItem(IMPORT_STORAGE_KEY, JSON.stringify(imported));
    router.push('/trips/new?import=1');
  };

  /* ---------------- signed out ---------------- */
  if (checked && !user) {
    return (
      <div className="min-h-screen bg-[#F6F2EC] pt-16">
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <Package className="w-12 h-12 text-[#4A6878] mx-auto mb-4" />
          <h1 className="text-3xl font-semibold text-[#2F4A5C] mb-3">My Travel Sandbox</h1>
          <p className="text-[#4A5A63] mb-6">
            Collect hotels, restaurants and activities from other travelers’ trips while you plan your own. Sign in to start.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/login?next=%2Fsandbox" className="px-5 py-2.5 bg-[#4A6878] text-white rounded-lg hover:bg-[#3F5B6A] font-medium">Sign in</Link>
            <Link href="/register" className="px-5 py-2.5 border border-[#D9D2C7] bg-white text-[#2F4A5C] rounded-lg hover:bg-[#FBF9F5] font-medium">Create an account</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- signed in ---------------- */
  const maxDayChoices = 21;

  return (
    <div className="min-h-screen bg-[#F6F2EC] pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-[#2F4A5C] flex items-center gap-3">
              <Package className="w-8 h-8 text-[#4A6878]" /> My Travel Sandbox
            </h1>
            <p className="text-[#5B6B75] mt-2">
              Everything you’ve saved from other trips, organised by the trips you’re planning. Tap ＋ on any trip to add more.
            </p>
          </div>
          <Link href="/trips" className="inline-flex items-center px-4 py-2 bg-white border border-[#D9D2C7] text-[#2F4A5C] rounded-lg hover:bg-[#FBF9F5] text-sm font-medium shrink-0">
            Browse trips for ideas <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {error && <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-[#6B7A83]">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading your sandbox…
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-6">
            {/* Planned trips */}
            <aside className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7A83] px-1">Your planned trips</p>
              <div className="flex lg:flex-col gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelected('')}
                  className={`shrink-0 lg:w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    selected === '' ? 'bg-[#4A6878] border-[#4A6878] text-white' : 'bg-white border-[#E4DED4] text-[#2F4A5C] hover:bg-[#FBF9F5]'
                  }`}
                >
                  <span className="flex items-center gap-2 font-medium"><Inbox className="w-4 h-4" /> Unsorted</span>
                  <span className={`text-xs ${selected === '' ? 'text-white/80' : 'text-[#6B7A83]'}`}>{countFor('')} saved</span>
                </button>
                {trips.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelected(t.id)}
                    className={`shrink-0 lg:w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                      selected === t.id ? 'bg-[#4A6878] border-[#4A6878] text-white' : 'bg-white border-[#E4DED4] text-[#2F4A5C] hover:bg-[#FBF9F5]'
                    }`}
                  >
                    <span className="flex items-center gap-2 font-medium truncate"><MapIcon className="w-4 h-4 shrink-0" /> <span className="truncate">{t.title}</span></span>
                    <span className={`text-xs ${selected === t.id ? 'text-white/80' : 'text-[#6B7A83]'}`}>
                      {countFor(t.id)} saved{t.tripType ? ` · ${tripTypeIcon(t.tripType)} ${t.tripType}` : ''}
                    </span>
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-[#E4DED4] p-3">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') createTrip(); }}
                  placeholder="New trip, e.g. Japan someday"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 mb-2"
                />
                <button
                  type="button"
                  onClick={createTrip}
                  disabled={creating}
                  className="w-full inline-flex items-center justify-center px-3 py-2 bg-[#4A6878] text-white rounded-lg hover:bg-[#3F5B6A] text-sm font-medium disabled:opacity-60"
                >
                  <Plus className="w-4 h-4 mr-1" /> New planned trip
                </button>
              </div>
            </aside>

            {/* Selected trip (or Unsorted) */}
            <main className="min-w-0">
              {current ? (
                <TripHeader
                  trip={current}
                  count={countFor(current.id)}
                  onChange={(f) => patchTrip(current.id, f)}
                  onDelete={() => deleteTrip(current)}
                  onFinalize={() => turnIntoTrip(current)}
                />
              ) : (
                <div className="bg-white rounded-xl border border-[#E4DED4] p-5 mb-5">
                  <h2 className="text-xl font-semibold text-[#2F4A5C] flex items-center gap-2"><Inbox className="w-5 h-5" /> Unsorted</h2>
                  <p className="text-sm text-[#6B7A83] mt-1">Places you saved without choosing a trip. Use “Move to” on each one to add it to a planned trip.</p>
                </div>
              )}

              {/* Filter */}
              <div className="flex flex-wrap gap-2 mb-5">
                {(['all', ...KIND_ORDER] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKindFilter(k)}
                    className={`px-3 py-1.5 rounded-full border text-sm ${
                      kindFilter === k ? 'bg-[#2F4A5C] border-[#2F4A5C] text-white' : 'bg-white border-[#D9D2C7] text-[#2F4A5C] hover:bg-[#FBF9F5]'
                    }`}
                  >
                    {k === 'all' ? 'Everything' : `${KIND_LABEL[k].icon} ${KIND_LABEL[k].many}`}
                  </button>
                ))}
              </div>

              {shown.length === 0 ? (
                <div className="text-center py-16 rounded-xl border border-dashed border-[#D9D2C7] bg-white/60">
                  <p className="text-[#2F4A5C] font-medium mb-1">Nothing here yet</p>
                  <p className="text-sm text-[#6B7A83] mb-4">Open any trip and tap ＋ on a hotel, restaurant or activity to save it here.</p>
                  <Link href="/trips" className="inline-flex items-center px-4 py-2 bg-[#4A6878] text-white rounded-lg hover:bg-[#3F5B6A] text-sm font-medium">
                    Browse trips <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-8">
                  {(Array.from(grouped.entries()) as [string, Map<string, SavedPlaceData[]>][]).map(([country, cities]) => (
                    <section key={country}>
                      <h3 className="text-2xl font-bold text-[#2F4A5C] mb-3">{country}</h3>
                      <div className="space-y-6">
                        {(Array.from(cities.entries()) as [string, SavedPlaceData[]][]).map(([city, list]) => (
                          <div key={city} className="bg-white rounded-xl border border-[#E4DED4] p-4 sm:p-5">
                            <p className="text-lg font-semibold text-[#2F4A5C] mb-4">{city}</p>
                            {KIND_ORDER.map((kind) => {
                              const items = list.filter((p) => p.kind === kind);
                              if (items.length === 0) return null;
                              return (
                                <div key={kind} className="mb-5 last:mb-0">
                                  <p className="text-sm font-medium text-[#6B7A83] mb-2">{KIND_LABEL[kind].icon} {KIND_LABEL[kind].many}</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {items.map((p) => (
                                      <SavedCard
                                        key={p.id}
                                        place={p}
                                        trips={trips}
                                        maxDays={maxDayChoices}
                                        onPatch={(f) => patchPlace(p.id, f)}
                                        onRemove={() => removePlace(p.id)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- planned trip header ---------------- */
function TripHeader({
  trip,
  count,
  onChange,
  onDelete,
  onFinalize,
}: {
  trip: SandboxTripData;
  count: number;
  onChange: (f: Partial<SandboxTripData>) => void;
  onDelete: () => void;
  onFinalize: () => void;
}) {
  const [title, setTitle] = useState(trip.title);
  const [notes, setNotes] = useState(trip.notes || '');
  useEffect(() => { setTitle(trip.title); setNotes(trip.notes || ''); }, [trip.id, trip.title, trip.notes]);

  return (
    <div className="bg-white rounded-xl border border-[#E4DED4] p-5 mb-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== trip.title && onChange({ title: title.trim() })}
          className="text-2xl font-semibold text-[#2F4A5C] bg-transparent border-b border-transparent hover:border-[#D9D2C7] focus:border-[#4A6878] focus:outline-none w-full"
          aria-label="Trip title"
        />
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onFinalize}
            disabled={count === 0}
            title={count === 0 ? 'Save some places first' : 'Open this plan in Add your trip'}
            className="inline-flex items-center px-4 py-2 bg-[#4A6878] text-white rounded-lg hover:bg-[#3F5B6A] text-sm font-medium disabled:opacity-50"
          >
            Turn into a trip <ArrowRight className="w-4 h-4 ml-1" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Remove this planned trip"
            className="inline-flex items-center px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <select
          value={trip.region || ''}
          onChange={(e) => onChange({ region: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
          aria-label="Region"
        >
          <option value="">Region…</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={trip.tripType || ''}
          onChange={(e) => onChange({ tripType: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
          aria-label="Type of trip"
        >
          <option value="">Type of trip…</option>
          {TRIP_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.value}</option>)}
        </select>
        <label className="text-xs text-gray-600">
          From
          <input type="date" value={trip.startDate || ''} onChange={(e) => onChange({ startDate: e.target.value })} className="mt-0.5 w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900" />
        </label>
        <label className="text-xs text-gray-600">
          To
          <input type="date" value={trip.endDate || ''} onChange={(e) => onChange({ endDate: e.target.value })} className="mt-0.5 w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900" />
        </label>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => notes !== (trip.notes || '') && onChange({ notes })}
        rows={2}
        placeholder="Notes for this trip — budget, who’s coming, must-dos…"
        className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
      />
    </div>
  );
}

/* ---------------- one saved place ---------------- */
function SavedCard({
  place,
  trips,
  maxDays,
  onPatch,
  onRemove,
}: {
  place: SavedPlaceData;
  trips: SandboxTripData[];
  maxDays: number;
  onPatch: (f: Partial<SavedPlaceData>) => void;
  onRemove: () => void;
}) {
  const [note, setNote] = useState(place.note || '');
  const [showReview, setShowReview] = useState(false);
  useEffect(() => setNote(place.note || ''), [place.id, place.note]);
  const rating = place.sourceRating || 0;

  return (
    <div className="border border-[#EEE8DF] rounded-lg overflow-hidden bg-[#FDFCFA] flex flex-col">
      <div className="flex">
        {place.imageUrl ? (
          <img
            src={place.imageUrl}
            alt=""
            loading="lazy"
            className="w-24 h-24 sm:w-28 sm:h-28 object-cover shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 bg-[#EEE8DF] flex items-center justify-center text-2xl">{KIND_LABEL[place.kind].icon}</div>
        )}
        <div className="p-3 min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-[#2F4A5C] leading-snug">
              {place.name}
              {place.stayType === 'rental' && <span className="ml-1 text-xs font-medium bg-[#E3ECEF] text-[#3F5B6A] px-1.5 py-0.5 rounded-full align-middle">🏠 Rental</span>}
            </p>
            <button type="button" onClick={onRemove} className="text-gray-400 hover:text-red-600 p-1 -m-1 shrink-0" title="Remove from sandbox" aria-label="Remove from sandbox">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {place.location && <p className="text-xs text-[#6B7A83] truncate">{place.location}</p>}
          {place.sourceTripId && (
            <p className="text-xs text-[#6B7A83] mt-1">
              From{' '}
              <Link href={`/trips/${place.sourceTripId}`} className="underline hover:text-[#2F4A5C]">
                {place.sourceUserName ? `${place.sourceUserName}’s ` : ''}{place.sourceTripTitle || 'a trip'}
              </Link>
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {rating > 0 && (
              <span className="flex" title={`Their rating: ${rating} out of 5`}>
                {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`w-3.5 h-3.5 ${n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />)}
              </span>
            )}
            {place.webUrl && (
              <a href={place.webUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#3F5B6A] underline inline-flex items-center">
                {linkLabel(place.webUrl)} <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 pb-3 space-y-2">
        {place.sourceReview && (
          <div className="text-xs text-[#4A5A63] bg-white border border-[#EEE8DF] rounded-md px-2 py-1.5">
            <button type="button" onClick={() => setShowReview((v) => !v)} className="w-full text-left flex items-center justify-between font-medium text-[#3F5B6A]">
              Their review {showReview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <p className={`mt-1 whitespace-pre-line ${showReview ? '' : 'line-clamp-2'}`}>{place.sourceReview}</p>
          </div>
        )}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => note !== (place.note || '') && onPatch({ note })}
          rows={1}
          placeholder="Your note (e.g. book ahead, go at sunset)"
          className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs text-gray-900"
        />
        <div className="flex gap-2">
          {place.kind !== 'hotel' && place.sandboxTripId && (
            <select
              value={place.dayNumber || ''}
              onChange={(e) => onPatch({ dayNumber: e.target.value ? Number(e.target.value) : null })}
              className="flex-1 px-2 py-1.5 border border-gray-200 rounded-md text-xs text-gray-900 bg-white"
              aria-label="Day"
            >
              <option value="">Not on a day yet</option>
              {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => <option key={d} value={d}>Day {d} in {place.city || 'this city'}</option>)}
            </select>
          )}
          <select
            value="__keep"
            onChange={(e) => {
              const v = e.target.value;
              if (v === '__keep') return;
              onPatch({ sandboxTripId: v === '__unsorted' ? null : v });
            }}
            className="flex-1 px-2 py-1.5 border border-gray-200 rounded-md text-xs text-gray-900 bg-white"
            aria-label="Move to another trip"
          >
            <option value="__keep">Move to…</option>
            {place.sandboxTripId && <option value="__unsorted">Unsorted</option>}
            {trips.filter((t) => t.id !== place.sandboxTripId).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
