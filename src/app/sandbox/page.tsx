'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import FillWithAI from '@/components/FillWithAI';
import { CommentCard, type FeedbackComment } from '@/components/FeedbackComments';
import {
  Package, Plus, Inbox, Trash2, Star, ExternalLink, ArrowRight, ArrowLeft, Loader2, MoreHorizontal, MessageCircle,
  Sparkles, Pencil, MapPin, X,
} from 'lucide-react';
import { REGIONS, TRIP_TYPES, tripTypeIcon } from '@/lib/regions';
import { linkLabel } from '@/lib/placeDetails';
import { monthYear } from '@/lib/dates';
import { IMPORT_STORAGE_KEY, type ImportedTrip } from '@/lib/tripImport';
import { SANDBOX_EVENT, AI_SUGGESTION, type SandboxTripData, type SavedPlaceData, type PlaceKind } from '@/lib/sandbox';

const KIND: Record<PlaceKind, { one: string; icon: string }> = {
  hotel: { one: 'Stay', icon: '🏨' },
  activity: { one: 'Do', icon: '🎯' },
  restaurant: { one: 'Eat', icon: '🍽️' },
};
const UNSORTED = '__ideas'; // the "Saved ideas" inbox (places not in a planned trip)
type Tab = 'plan' | 'ideas' | 'feedback';
type FeedbackSummary = Record<string, { open: number; total: number; byPlace: Record<string, number> }>;

function getUser(): { id: string; name?: string } | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function SandboxContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<{ id: string; name?: string } | null>(null);
  const [checked, setChecked] = useState(false);
  const [trips, setTrips] = useState<SandboxTripData[]>([]);
  const [places, setPlaces] = useState<SavedPlaceData[]>([]);
  const [feedback, setFeedback] = useState<FeedbackSummary>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null); // null = Sandbox home
  const [tab, setTab] = useState<Tab>('plan');
  const [fillOpen, setFillOpen] = useState(false);
  const [fillAsk, setFillAsk] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setUser(getUser());
    setChecked(true);
  }, []);

  const load = useCallback(async (u: { id: string }) => {
    setError('');
    try {
      const res = await fetch(`/api/sandbox?userId=${encodeURIComponent(u.id)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Couldn’t load your sandbox.');
      setTrips(data.trips || []);
      setPlaces(data.places || []);
      setFeedback(data.feedback || {});
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

  // /sandbox?trip=ID[&fill=1&ask=…][&tab=feedback] opens that trip
  useEffect(() => {
    const t = searchParams.get('trip');
    if (t && trips.some((x) => x.id === t)) {
      openTrip(t, searchParams.get('tab') === 'feedback' ? 'feedback' : 'plan');
      if (searchParams.get('fill')) {
        setFillAsk(searchParams.get('ask') || '');
        setFillOpen(true);
      }
      router.replace('/sandbox');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips]);

  const openTrip = (id: string | null, t: Tab = 'plan') => {
    setSelected(id);
    setTab(t);
    setFillOpen(false);
    setEditing(false);
    window.scrollTo({ top: 0 });
  };

  const announce = (count: number) => window.dispatchEvent(new CustomEvent(SANDBOX_EVENT, { detail: { count } }));
  const placesIn = (tripId: string | null) => places.filter((p) => (p.sandboxTripId || null) === tripId);
  const unsorted = placesIn(null);
  const current = selected && selected !== UNSORTED ? trips.find((t) => t.id === selected) || null : null;

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
      setNewTitle('');
      openTrip(data.trip.id);
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
    const n = placesIn(t.id).length;
    if (!window.confirm(`Remove the planned trip “${t.title}”?${n ? ` Its ${n} saved ${n === 1 ? 'place moves' : 'places move'} to Saved ideas.` : ''}`)) return;
    await fetch(`/api/sandbox/trips/${t.id}?userId=${encodeURIComponent(user.id)}`, { method: 'DELETE' }).catch(() => {});
    setTrips((prev) => prev.filter((x) => x.id !== t.id));
    setPlaces((prev) => prev.map((p) => (p.sandboxTripId === t.id ? { ...p, sandboxTripId: null, dayNumber: null } : p)));
    openTrip(null);
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
    const mine = placesIn(t.id);
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
    for (const p of [...mine].reverse()) {
      const c = findCity(p.city || 'Anywhere', p.country || '');
      const place = {
        name: p.name, location: p.location || '', rating: 0, review: '',
        imageUrl: p.imageUrl || null, webUrl: p.webUrl || null,
        stayType: p.stayType === 'rental' ? ('rental' as const) : null,
      };
      if (p.kind === 'hotel') { c.hotels.push(place); continue; }
      const dayNumber = p.dayNumber || 1;
      c.numberOfDays = Math.max(c.numberOfDays, dayNumber);
      let day = c.days.find((d) => d.dayNumber === dayNumber);
      if (!day) { day = { dayNumber, restaurants: [], activities: [] }; c.days.push(day); }
      (p.kind === 'restaurant' ? day.restaurants : day.activities).push(place);
    }
    const imported: ImportedTrip = {
      title: t.title, startDate: t.startDate || '', endDate: t.endDate || '', cities, warnings: [],
      rowCount: mine.length, source: 'sandbox', region: t.region || undefined, tripType: t.tripType || undefined,
    };
    sessionStorage.setItem(IMPORT_STORAGE_KEY, JSON.stringify(imported));
    router.push('/trips/new?import=1');
  };

  /* ---------------- signed out ---------------- */
  if (checked && !user) {
    return (
      <div className="min-h-screen bg-[#FBFAF7] pt-16">
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <Package className="w-12 h-12 text-[#1F6F78] mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold text-[#13212B] mb-3">My Travel Sandbox</h1>
          <p className="text-[#4A5963] mb-6">Collect hotels, restaurants and activities from other travelers’ trips while you plan your own. Sign in to start.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/login?next=%2Fsandbox" className="px-5 py-3 bg-[#13212B] text-white rounded-xl font-semibold">Sign in</Link>
            <Link href="/register" className="px-5 py-3 border border-[#E2DCD2] bg-white text-[#13212B] rounded-xl font-semibold">Create an account</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#13212B] pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {error && <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-[#5B6A73]">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading your sandbox…
          </div>
        ) : selected === null ? (
          /* ================= Sandbox home ================= */
          <>
            <div data-tour="sandbox-head" className="flex flex-wrap items-end justify-between gap-3 mb-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">My Travel Sandbox</h1>
                <p className="text-[#5B6A73] mt-1">The trips you’re planning. Tap ＋ on any shared trip to save ideas here.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/feedback" className="inline-flex items-center px-4 min-h-[44px] rounded-xl bg-white border border-[#E2DCD2] text-sm font-semibold hover:bg-[#F6F3EE]">
                  <MessageCircle className="w-4 h-4 mr-1.5" /> Help others plan
                </Link>
                <Link href="/trips" className="inline-flex items-center px-4 min-h-[44px] rounded-xl bg-white border border-[#E2DCD2] text-sm font-semibold hover:bg-[#F6F3EE]">
                  Browse trips <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {unsorted.length > 0 && (
              <button type="button" onClick={() => openTrip(UNSORTED)}
                className="w-full text-left mb-5 flex items-center gap-4 rounded-2xl bg-[#F1F6F6] border border-[#D4E5E6] p-4 hover:bg-[#E9F2F2]">
                <span className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0"><Inbox className="w-6 h-6 text-[#1F6F78]" /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold">Saved ideas</span>
                  <span className="block text-sm text-[#3F5B6A]">{unsorted.length} {unsorted.length === 1 ? 'place' : 'places'} not in a trip yet. Sort them into a trip.</span>
                </span>
                <ArrowRight className="w-5 h-5 text-[#1F6F78]" />
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trips.map((t) => {
                const list = placesIn(t.id);
                const photo = list.find((p) => p.imageUrl)?.imageUrl;
                const cities = Array.from(new Set(list.map((p) => p.city).filter(Boolean) as string[]));
                const f = feedback[t.id];
                return (
                  <button key={t.id} type="button" onClick={() => openTrip(t.id)}
                    className="text-left bg-white border border-[#ECE7DF] rounded-[20px] overflow-hidden hover:shadow-[0_8px_28px_rgba(19,33,43,0.08)] transition-shadow flex flex-col">
                    <div className="relative h-32 bg-[#E6DED2]">
                      {photo && <img src={photo} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        {f?.open ? (
                          <span className="bg-[#1F6F78] text-white rounded-full px-2.5 py-1 text-xs font-semibold">💬 {f.open} new</span>
                        ) : t.feedbackOpen ? (
                          <span className="bg-white/90 text-[#16535A] rounded-full px-2.5 py-1 text-xs font-semibold">💬 Open for feedback</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="p-4 flex flex-col gap-1">
                      <span className="font-bold text-lg leading-snug">{t.title}</span>
                      <span className="text-sm text-[#5B6A73]">
                        {[monthYear(t.startDate), `${list.length} ${list.length === 1 ? 'place' : 'places'}`, t.tripType ? `${tripTypeIcon(t.tripType)} ${t.tripType}` : ''].filter(Boolean).join(' · ')}
                      </span>
                      {cities.length > 0 && <span className="text-sm text-[#2A3A44] line-clamp-1">{cities.join(' · ')}</span>}
                    </div>
                  </button>
                );
              })}

              {/* New planned trip */}
              <div className="border-2 border-dashed border-[#DCD5CA] rounded-[20px] p-4 flex flex-col justify-center gap-2 min-h-[200px]">
                <label htmlFor="new-trip" className="font-bold">Start a new planned trip</label>
                <input id="new-trip" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') createTrip(); }}
                  placeholder="e.g. Japan in spring" className="w-full px-3 py-2.5 border border-[#E2DCD2] rounded-xl text-sm bg-white" />
                <button type="button" onClick={createTrip} disabled={creating}
                  className="inline-flex items-center justify-center px-4 min-h-[44px] bg-[#13212B] text-white rounded-xl text-sm font-semibold disabled:opacity-60">
                  <Plus className="w-4 h-4 mr-1" /> Create
                </button>
              </div>
            </div>
          </>
        ) : selected === UNSORTED ? (
          /* ================= Saved ideas (not in a trip) ================= */
          <>
            <BackLink onClick={() => openTrip(null)} />
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">Saved ideas</h1>
            <p className="text-[#5B6A73] mb-5">Places you saved without choosing a trip. Use <b>Add to trip</b> to sort each one.</p>
            {unsorted.length === 0 ? (
              <EmptyState text="Nothing waiting to be sorted." />
            ) : (
              <div className="flex flex-col gap-3">
                {unsorted.map((p) => (
                  <PlaceRow key={p.id} place={p} trips={trips} onPatch={(f) => patchPlace(p.id, f)} onRemove={() => removePlace(p.id)}
                    quick={
                      <select value="" onChange={(e) => e.target.value && patchPlace(p.id, { sandboxTripId: e.target.value })} aria-label="Add to a trip"
                        className="px-2.5 min-h-[36px] border border-[#E2DCD2] rounded-lg text-sm bg-white">
                        <option value="">Add to trip…</option>
                        {trips.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                      </select>
                    } />
                ))}
              </div>
            )}
          </>
        ) : current ? (
          /* ================= One planned trip ================= */
          <TripView
            trip={current}
            places={placesIn(current.id)}
            trips={trips}
            feedback={feedback[current.id]}
            tab={tab}
            setTab={setTab}
            editing={editing}
            setEditing={setEditing}
            onBack={() => openTrip(null)}
            onPatchTrip={(f) => patchTrip(current.id, f)}
            onDelete={() => deleteTrip(current)}
            onFinalize={() => turnIntoTrip(current)}
            onPatchPlace={patchPlace}
            onRemovePlace={removePlace}
            onReload={() => user && load(user)}
            fill={
              fillOpen && user ? (
                <FillWithAI key={current.id} userId={user.id} sandboxTripId={current.id} tripTitle={current.title} initialRequest={fillAsk}
                  onAdded={() => { setFillOpen(false); load(user); }} onClose={() => setFillOpen(false)} />
              ) : null
            }
            onFill={() => { setFillAsk(''); setFillOpen(true); }}
          />
        ) : (
          <>
            <BackLink onClick={() => openTrip(null)} />
            <EmptyState text="That planned trip isn’t here any more." />
          </>
        )}
      </div>
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center font-semibold text-[#1F6F78] hover:text-[#16535A] mb-4 min-h-[36px]">
      <ArrowLeft className="w-4 h-4 mr-1.5" /> All planned trips
    </button>
  );
}

function EmptyState({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="text-center py-12 rounded-2xl border border-dashed border-[#DCD5CA] bg-white/60">
      <p className="text-[#3D4C56] mb-3">{text}</p>
      {action}
    </div>
  );
}

/* ---------------- ⋯ menu ---------------- */
function MoreMenu({ items, label = 'More options' }: { items: { label: string; onClick: () => void; danger?: boolean }[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-label={label} aria-expanded={open}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-[#3D4C56] hover:bg-[#F1EEE8]">
        <MoreHorizontal className="w-5 h-5" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-1 z-30 w-56 bg-white rounded-xl border border-[#E2DCD2] shadow-xl p-1.5">
          {items.map((it) => (
            <button key={it.label} type="button" role="menuitem" onClick={() => { setOpen(false); it.onClick(); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-[#F6F3EE] ${it.danger ? 'text-[#B4532A]' : 'text-[#13212B]'}`}>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- one saved place (compact) ---------------- */
function PlaceRow({
  place, trips, onPatch, onRemove, quick, comments,
}: {
  place: SavedPlaceData; trips: SandboxTripData[]; onPatch: (f: Partial<SavedPlaceData>) => void; onRemove: () => void;
  quick?: ReactNode; comments?: number;
}) {
  const [open, setOpen] = useState(false);
  const [noteEdit, setNoteEdit] = useState(false);
  const [note, setNote] = useState(place.note || '');
  const [moving, setMoving] = useState(false);
  useEffect(() => setNote(place.note || ''), [place.id, place.note]);
  const rating = place.sourceRating || 0;
  const source = !place.sourceTripId && place.sourceUserName === AI_SUGGESTION ? '✨ Suggested by AI' : place.sourceTripTitle ? `From ${place.sourceTripTitle}` : '';

  return (
    <div className="bg-white border border-[#ECE7DF] rounded-2xl">
      <div className="flex items-center gap-3 p-2.5 sm:p-3">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-3 flex-1 min-w-0 text-left" aria-expanded={open}>
          {place.imageUrl ? (
            <img src={place.imageUrl} alt="" loading="lazy" className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 bg-[#F1EEE8]"
              onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
          ) : (
            <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl shrink-0 bg-[#F1EEE8] flex items-center justify-center text-xl">{KIND[place.kind].icon}</span>
          )}
          <span className="min-w-0">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-[#5B6A73]">{place.stayType === 'rental' ? 'Rental' : KIND[place.kind].one}</span>
            <span className="block font-bold leading-snug truncate">{place.name}</span>
            <span className="block text-xs text-[#5B6A73] truncate">{[place.city, source].filter(Boolean).join(' · ')}</span>
            {place.note && !open && <span className="block text-xs text-[#3D4C56] italic truncate">“{place.note}”</span>}
          </span>
        </button>
        {!!comments && (
          <span className="shrink-0 text-xs font-semibold text-[#1F6F78] inline-flex items-center" title="Comments from members">
            <MessageCircle className="w-3.5 h-3.5 mr-0.5" />{comments}
          </span>
        )}
        {quick && <div className="shrink-0 hidden sm:block">{quick}</div>}
        <MoreMenu
          items={[
            { label: place.note ? 'Edit note' : 'Add a note', onClick: () => { setOpen(true); setNoteEdit(true); } },
            { label: 'Move to another trip', onClick: () => { setOpen(true); setMoving(true); } },
            ...(place.sandboxTripId && place.kind !== 'hotel' && place.dayNumber ? [{ label: 'Take off its day', onClick: () => onPatch({ dayNumber: null }) }] : []),
            { label: 'Remove from Sandbox', onClick: onRemove, danger: true },
          ]}
        />
      </div>
      {quick && <div className="sm:hidden px-3 pb-3 -mt-1">{quick}</div>}

      {open && (
        <div className="border-t border-[#ECE7DF] px-3 py-3 flex flex-col gap-2 text-sm">
          {place.location && <p className="text-[#5B6A73] flex items-start gap-1"><MapPin className="w-4 h-4 mt-0.5 shrink-0" />{place.location}</p>}
          <div className="flex flex-wrap items-center gap-3">
            {rating > 0 && (
              <span className="flex items-center gap-1" title={`Their rating: ${rating} out of 5`}>
                {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`w-3.5 h-3.5 ${n <= rating ? 'text-[#E0A526] fill-[#E0A526]' : 'text-[#D9D4CC]'}`} />)}
              </span>
            )}
            {place.webUrl && (
              <a href={place.webUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1F6F78] inline-flex items-center">
                {linkLabel(place.webUrl)} <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
              </a>
            )}
            {place.sourceTripId && <Link href={`/trips/${place.sourceTripId}`} className="text-[#1F6F78] underline">See the trip it came from</Link>}
          </div>
          {place.sourceReview && <p className="text-[#3D4C56] whitespace-pre-line bg-[#FBFAF7] rounded-xl p-2.5">“{place.sourceReview}”</p>}
          {noteEdit ? (
            <div className="flex gap-2">
              <input autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="Your note (e.g. book ahead, go at sunset)"
                onKeyDown={(e) => { if (e.key === 'Enter') { onPatch({ note }); setNoteEdit(false); } }}
                className="flex-1 min-w-0 px-3 py-2 border border-[#E2DCD2] rounded-xl" />
              <button type="button" onClick={() => { onPatch({ note }); setNoteEdit(false); }} className="px-3 rounded-xl bg-[#13212B] text-white font-semibold">Save</button>
            </div>
          ) : place.note ? (
            <button type="button" onClick={() => setNoteEdit(true)} className="text-left italic text-[#3D4C56]">“{place.note}” <Pencil className="w-3 h-3 inline ml-1" /></button>
          ) : null}
          {moving && (
            <select autoFocus value="" onChange={(e) => { const v = e.target.value; if (!v) return; onPatch({ sandboxTripId: v === UNSORTED ? null : v }); setMoving(false); }}
              aria-label="Move to another trip" className="px-3 py-2 border border-[#E2DCD2] rounded-xl bg-white">
              <option value="">Move to…</option>
              {place.sandboxTripId && <option value={UNSORTED}>Saved ideas (no trip)</option>}
              {trips.filter((t) => t.id !== place.sandboxTripId).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- a planned trip: Plan / Ideas / Feedback ---------------- */
function TripView({
  trip, places, trips, feedback, tab, setTab, editing, setEditing, onBack, onPatchTrip, onDelete, onFinalize,
  onPatchPlace, onRemovePlace, onReload, fill, onFill,
}: {
  trip: SandboxTripData; places: SavedPlaceData[]; trips: SandboxTripData[];
  feedback?: { open: number; total: number; byPlace: Record<string, number> };
  tab: Tab; setTab: (t: Tab) => void; editing: boolean; setEditing: (v: boolean) => void;
  onBack: () => void; onPatchTrip: (f: Partial<SandboxTripData>) => void; onDelete: () => void; onFinalize: () => void;
  onPatchPlace: (id: string, f: Partial<SavedPlaceData>) => void; onRemovePlace: (id: string) => void; onReload: () => void;
  fill: ReactNode; onFill: () => void;
}) {
  const hotels = places.filter((p) => p.kind === 'hotel');
  const scheduled = places.filter((p) => p.kind !== 'hotel' && p.dayNumber);
  const ideas = places.filter((p) => p.kind !== 'hotel' && !p.dayNumber);
  const cities = useMemo(() => {
    const out: string[] = [];
    for (const p of [...places].reverse()) { const c = p.city || 'Anywhere'; if (!out.includes(c)) out.push(c); }
    return out;
  }, [places]);
  const byPlace = feedback?.byPlace || {};

  const tabs: { key: Tab; label: string; badge?: string }[] = [
    { key: 'plan', label: 'Plan' },
    { key: 'ideas', label: 'Ideas', badge: ideas.length ? String(ideas.length) : undefined },
    { key: 'feedback', label: 'Feedback', badge: feedback?.open ? `${feedback.open} new` : undefined },
  ];

  const daySelect = (p: SavedPlaceData) => {
    const sameCity = places.filter((x) => (x.city || 'Anywhere') === (p.city || 'Anywhere') && x.dayNumber);
    const max = Math.min(21, Math.max(3, ...sameCity.map((x) => x.dayNumber || 0)) + 1);
    return (
      <select value={p.dayNumber || ''} onChange={(e) => onPatchPlace(p.id, { dayNumber: e.target.value ? Number(e.target.value) : null })}
        aria-label="Day" className="px-2.5 min-h-[36px] border border-[#E2DCD2] rounded-lg text-sm bg-white">
        <option value="">Add to day…</option>
        {Array.from({ length: max }, (_, i) => i + 1).map((d) => <option key={d} value={d}>Day {d}{p.city ? ` in ${p.city}` : ''}</option>)}
      </select>
    );
  };

  return (
    <>
      <BackLink onClick={onBack} />
      <div className="flex items-start justify-between gap-3 mb-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{trip.title}</h1>
        <MoreMenu label="Trip options" items={[
          { label: 'Edit details', onClick: () => setEditing(true) },
          { label: 'Turn into a trip to share', onClick: onFinalize },
          { label: 'Delete this planned trip', onClick: onDelete, danger: true },
        ]} />
      </div>
      <p className="text-[#5B6A73] mb-4">
        {[monthYear(trip.startDate), trip.region, trip.tripType ? `${tripTypeIcon(trip.tripType)} ${trip.tripType}` : '', `${places.length} ${places.length === 1 ? 'place' : 'places'}`, cities.length > 1 ? `${cities.length} cities` : ''].filter(Boolean).join(' · ')}
      </p>
      {trip.notes && !editing && <p className="text-sm text-[#3D4C56] mb-4 whitespace-pre-line">{trip.notes}</p>}

      {editing && <EditDetails trip={trip} onSave={(f) => { onPatchTrip(f); setEditing(false); }} onCancel={() => setEditing(false)} />}

      <div role="tablist" aria-label="Trip sections" className="flex gap-1 border-b border-[#E2DCD2] mb-5">
        {tabs.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={`px-4 min-h-[48px] -mb-px border-b-[3px] text-[15px] inline-flex items-center gap-1.5 ${tab === t.key ? 'border-[#1F6F78] font-bold' : 'border-transparent text-[#5B6A73] hover:text-[#13212B]'}`}>
            {t.label}
            {t.badge && <span className={`text-xs rounded-full px-2 py-0.5 ${t.key === 'feedback' ? 'bg-[#1F6F78] text-white' : 'bg-[#F1EEE8] text-[#3D4C56]'}`}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'plan' && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onFill} className="inline-flex items-center px-4 min-h-[44px] rounded-xl bg-[#F1F6F6] border border-[#D4E5E6] text-[#16535A] text-sm font-semibold hover:bg-[#E9F2F2]">
              <Sparkles className="w-4 h-4 mr-1.5" /> Fill with AI
            </button>
            {ideas.length > 0 && (
              <button type="button" onClick={() => setTab('ideas')} className="text-sm text-[#1F6F78] underline px-1">
                {ideas.length} {ideas.length === 1 ? 'idea isn’t' : 'ideas aren’t'} on a day yet
              </button>
            )}
          </div>
          {fill}
          {places.length === 0 ? (
            <EmptyState text="No places yet. Tap ＋ on hotels, restaurants and activities in shared trips, or let AI fill it in."
              action={<Link href="/trips" className="inline-flex items-center px-4 min-h-[44px] bg-[#13212B] text-white rounded-xl text-sm font-semibold">Browse trips <ArrowRight className="w-4 h-4 ml-1" /></Link>} />
          ) : (
            cities.map((city) => {
              const stays = hotels.filter((p) => (p.city || 'Anywhere') === city);
              const days = Array.from(new Set(scheduled.filter((p) => (p.city || 'Anywhere') === city).map((p) => p.dayNumber!))).sort((a, b) => a - b);
              if (!stays.length && !days.length) return null;
              return (
                <section key={city}>
                  {cities.length > 1 && <h2 className="text-xl font-extrabold mb-3 flex items-center gap-2"><MapPin className="w-5 h-5 text-[#1F6F78]" />{city}</h2>}
                  {stays.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#5B6A73] mb-2">Where to stay</h3>
                      <div className="flex flex-col gap-2">
                        {stays.map((p) => <PlaceRow key={p.id} place={p} trips={trips} comments={byPlace[p.id]} onPatch={(f) => onPatchPlace(p.id, f)} onRemove={() => onRemovePlace(p.id)} />)}
                      </div>
                    </div>
                  )}
                  {days.map((d) => (
                    <div key={d} className="mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#5B6A73] mb-2 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-[#1F6F78] text-white text-xs flex items-center justify-center normal-case tracking-normal">{d}</span> Day {d}
                      </h3>
                      <div className="flex flex-col gap-2">
                        {scheduled.filter((p) => (p.city || 'Anywhere') === city && p.dayNumber === d).map((p) => (
                          <PlaceRow key={p.id} place={p} trips={trips} comments={byPlace[p.id]} onPatch={(f) => onPatchPlace(p.id, f)} onRemove={() => onRemovePlace(p.id)} quick={daySelect(p)} />
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              );
            })
          )}
          {places.length > 0 && hotels.length === 0 && scheduled.length === 0 && (
            <EmptyState text="Nothing is on a day yet. Open Ideas and use “Add to day” to build the plan."
              action={<button type="button" onClick={() => setTab('ideas')} className="inline-flex items-center px-4 min-h-[44px] bg-[#13212B] text-white rounded-xl text-sm font-semibold">Go to Ideas</button>} />
          )}
        </div>
      )}

      {tab === 'ideas' && (
        ideas.length === 0 ? (
          <EmptyState text="Every saved place is on a day. Nice planning!" />
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-[#5B6A73] mb-1">Saved for this trip but not on a day yet. Choose <b>Add to day</b> to put each one in the plan.</p>
            {ideas.map((p) => (
              <PlaceRow key={p.id} place={p} trips={trips} comments={byPlace[p.id]} onPatch={(f) => onPatchPlace(p.id, f)} onRemove={() => onRemovePlace(p.id)} quick={daySelect(p)} />
            ))}
          </div>
        )
      )}

      {tab === 'feedback' && <FeedbackTab trip={trip} onChanged={onReload} />}
    </>
  );
}

/* ---------------- Edit details (title, region, type, dates, notes) ---------------- */
function EditDetails({ trip, onSave, onCancel }: { trip: SandboxTripData; onSave: (f: Partial<SandboxTripData>) => void; onCancel: () => void }) {
  const [f, setF] = useState({
    title: trip.title, region: trip.region || '', tripType: trip.tripType || '',
    startDate: trip.startDate || '', endDate: trip.endDate || '', notes: trip.notes || '',
  });
  const field = 'w-full px-3 py-2.5 border border-[#E2DCD2] rounded-xl text-sm bg-white';
  return (
    <div className="mb-5 rounded-2xl bg-white border border-[#ECE7DF] p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Trip details</h2>
        <button type="button" onClick={onCancel} aria-label="Close" className="p-1.5 text-[#5B6A73]"><X className="w-4 h-4" /></button>
      </div>
      <label className="text-sm font-medium">Name<input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={`${field} mt-1`} /></label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-sm font-medium">Region
          <select value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} className={`${field} mt-1`}>
            <option value="">—</option>{REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Type of trip
          <select value={f.tripType} onChange={(e) => setF({ ...f, tripType: e.target.value })} className={`${field} mt-1`}>
            <option value="">—</option>{TRIP_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.value}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">From<input type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} className={`${field} mt-1`} /></label>
        <label className="text-sm font-medium">To<input type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} className={`${field} mt-1`} /></label>
      </div>
      <label className="text-sm font-medium">Notes<textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={2} className={`${field} mt-1`} placeholder="Anything to remember for this trip" /></label>
      <div className="flex gap-2">
        <button type="button" onClick={() => onSave({ ...f, title: f.title.trim() || trip.title })} className="px-4 min-h-[44px] rounded-xl bg-[#13212B] text-white text-sm font-semibold">Save</button>
        <button type="button" onClick={onCancel} className="px-3 min-h-[44px] text-sm text-[#5B6A73]">Cancel</button>
      </div>
    </div>
  );
}

/* ---------------- Feedback tab: ask, read and act on members' advice here ---------------- */
function FeedbackTab({ trip, onChanged }: { trip: SandboxTripData; onChanged: () => void }) {
  const [data, setData] = useState<{ comments: FeedbackComment[]; open: boolean } | null>(null);
  const [ask, setAsk] = useState(trip.feedbackAsk || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    const r = await fetch(`/api/feedback/${trip.id}`, { cache: 'no-store' });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setData({ comments: d.comments || [], open: !!d.trip?.open });
    else setData({ comments: [], open: false });
  }, [trip.id]);
  useEffect(() => { load(); }, [load]);

  const setOpen = async (open: boolean) => {
    setBusy(true);
    setErr('');
    try {
      const r = await fetch(`/api/feedback/${trip.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: open ? 'open' : 'close', ask }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Something went wrong.');
      await load();
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#8A969D]" /></div>;

  const others = data.comments.filter((c) => !c.byOwner);
  const fresh = others.filter((c) => c.status === 'open');
  const done = others.filter((c) => c.status !== 'open');
  const about = (c: FeedbackComment) => (c.targetType === 'trip' ? 'The whole trip' : c.targetLabel || (c.targetType === 'city' ? 'A city' : 'A place'));

  if (!data.open && others.length === 0) {
    return (
      <div className="rounded-2xl bg-[#F1F6F6] border border-[#D4E5E6] p-4 sm:p-5">
        <h2 className="font-bold text-[#16535A] mb-1">Ask members for advice</h2>
        <p className="text-sm text-[#3F5B6A] mb-3">Your plan appears in <b>Help me plan</b> for all members. They can say “too many days”, suggest a better hotel, or point out a place not to miss. You accept a suggestion with one tap, and can close feedback any time.</p>
        <label htmlFor="ask" className="block text-sm font-medium text-[#16535A] mb-1">What would you like advice on? (optional)</label>
        <textarea id="ask" value={ask} onChange={(e) => setAsk(e.target.value.slice(0, 600))} rows={2}
          placeholder="e.g. Is 4 days in Bogotá too many? Where should we stay in Cartagena?" className="w-full px-3 py-2 border border-[#C9D9DF] rounded-xl text-sm bg-white" />
        {err && <p className="text-sm text-red-600 mt-1">{err}</p>}
        <button type="button" onClick={() => setOpen(true)} disabled={busy} className="mt-3 inline-flex items-center px-4 min-h-[44px] bg-[#1F6F78] text-white rounded-xl text-sm font-semibold disabled:opacity-60">
          {busy && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />} Share for feedback
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#13212B] text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white border border-[#ECE7DF] p-3 sm:p-4">
        <p className="text-sm text-[#3D4C56]">
          {data.open ? <>Open in <b>Help me plan</b> · {fresh.length} new {fresh.length === 1 ? 'suggestion' : 'suggestions'}</> : 'Feedback is closed. Members can’t see this trip.'}
        </p>
        <div className="flex gap-2">
          <Link href={`/feedback/${trip.id}`} className="inline-flex items-center px-3 min-h-[40px] rounded-xl border border-[#E2DCD2] text-sm font-semibold">See it as members do</Link>
          <button type="button" onClick={() => setOpen(!data.open)} disabled={busy} className="px-3 min-h-[40px] rounded-xl border border-[#E2DCD2] text-sm font-semibold">
            {data.open ? 'Close feedback' : 'Reopen'}
          </button>
        </div>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}

      {others.length === 0 ? (
        <EmptyState text="No comments yet. Members will see your trip in Help me plan." />
      ) : (
        <>
          {fresh.length > 0 && <h2 className="text-sm font-bold uppercase tracking-wider text-[#5B6A73]">New</h2>}
          {fresh.map((c) => (
            <div key={c.id}>
              <p className="text-xs font-semibold text-[#5B6A73] mb-1">About: {about(c)}</p>
              <CommentCard c={c} isOwner onChanged={(msg) => { load(); onChanged(); if (msg) { setToast(msg); setTimeout(() => setToast(''), 3500); } }} />
            </div>
          ))}
          {done.length > 0 && <h2 className="text-sm font-bold uppercase tracking-wider text-[#5B6A73] mt-2">Done</h2>}
          {done.map((c) => (
            <div key={c.id}>
              <p className="text-xs font-semibold text-[#5B6A73] mb-1">About: {about(c)}</p>
              <CommentCard c={c} isOwner onChanged={() => { load(); onChanged(); }} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default function SandboxPage() {
  return (
    <Suspense fallback={null}>
      <SandboxContent />
    </Suspense>
  );
}
