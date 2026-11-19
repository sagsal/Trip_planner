'use client';

import { useState, useEffect, Suspense } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { monthYear, daysFromDates } from '@/lib/dates';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, RefreshCw } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Trip {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  countries: string;
  cities: string;
  isPublic: boolean;
  isDraft?: boolean;
  createdAt: string;
  cities_data: CityData[];
  coverImageUrl?: string | null;
}

interface CityData {
  id: string;
  name: string;
  country: string;
  hotels: Hotel[];
  restaurants: Restaurant[];
  activities: Activity[];
}

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

type FeedbackItem = { id: string; from: string; label: string; about: string | null; text: string | null; suggested: string | null; tripId: string; tripTitle: string };

const parseList = (v: unknown): string[] => {
  try {
    let x: any = v;
    for (let i = 0; i < 2 && typeof x === 'string'; i++) x = JSON.parse(x);
    return Array.isArray(x) ? x.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
};
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

/* Small pieces of the journal layout */
function SectionHead({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between items-baseline gap-3 pb-3 border-b border-[#13212B]">
      <h2 className="font-serif font-normal text-[30px] sm:text-[34px] leading-tight">{title}</h2>
      {right}
    </div>
  );
}
function BoxHead({ children }: { children: ReactNode }) {
  return <h2 className="px-5 py-4 border-b border-[#E2DDD5] font-mono font-normal text-[11px] tracking-[0.14em] text-[#5B6A73] flex justify-between gap-3">{children}</h2>;
}
const BTN = 'inline-flex items-center gap-2 min-h-[48px] px-5 font-mono text-xs tracking-[0.1em]';
const LINK = 'font-mono text-xs tracking-[0.1em] text-[#1F6F78] hover:text-[#13212B]';

function AccountContent() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [draftTrips, setDraftTrips] = useState<Trip[]>([]);
  const [privateTrips, setPrivateTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [deletingTrip, setDeletingTrip] = useState<string | null>(null);
  const [deletingDraft, setDeletingDraft] = useState<string | null>(null);
  const router = useRouter();
  const [sandbox, setSandbox] = useState<{ trips: any[]; places: any[]; feedback: Record<string, { open: number; total: number }> } | null>(null);
  const [fb, setFb] = useState<{ open: number; items: FeedbackItem[] } | null>(null);
  const [asks, setAsks] = useState<any[] | null>(null);
  const [fresh, setFresh] = useState<any[] | null>(null);
  const [filter, setFilter] = useState<'All' | 'Shared' | 'Private' | 'Draft'>('All');
  const [fbBusy, setFbBusy] = useState<string | null>(null);

  // The rest of the dashboard: planned trips, feedback, members asking for help, newly shared trips
  useEffect(() => {
    let uid = '';
    try { uid = JSON.parse(localStorage.getItem('user') || '{}').id || ''; } catch {}
    if (!uid) return;
    const q = `userId=${encodeURIComponent(uid)}`;
    fetch(`/api/sandbox?${q}`).then((r) => (r.ok ? r.json() : null)).then((d) => setSandbox(d ? { trips: d.trips || [], places: d.places || [], feedback: d.feedback || {} } : { trips: [], places: [], feedback: {} })).catch(() => setSandbox({ trips: [], places: [], feedback: {} }));
    fetch(`/api/dashboard/feedback?${q}`).then((r) => (r.ok ? r.json() : null)).then((d) => setFb(d || { open: 0, items: [] })).catch(() => setFb({ open: 0, items: [] }));
    fetch('/api/feedback').then((r) => (r.ok ? r.json() : null)).then((d) => setAsks((d?.trips || []).filter((t: any) => !t.mine).slice(0, 3))).catch(() => setAsks([]));
    fetch('/api/trips?public=true&limit=8').then((r) => r.json()).then((d) => setFresh((d.trips || []).filter((t: any) => t.isPublic && !t.isDraft && t.user?.id !== uid && !t.title?.includes('TEMPLATE') && !t.title?.includes('DATABASE:')).slice(0, 3))).catch(() => setFresh([]));
  }, []);

  const actOnFeedback = async (id: string, action: 'accept' | 'dismiss') => {
    setFbBusy(id);
    try {
      const r = await fetch(`/api/feedback/comments/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Couldn’t update that. Please try again.');
      setFb((f) => (f ? { open: Math.max(0, f.open - 1), items: f.items.filter((x) => x.id !== id) } : f));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Couldn’t update that.');
    } finally {
      setFbBusy(null);
    }
  };

  const fetchUserTrips = async (showRetryState = false) => {
    try {
      if (showRetryState) {
        setIsRetrying(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      // Get user data from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        router.push('/login');
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Fetch user's trips from API (shared/public, drafts, and private finalized trips)
      try {
        const [sharedResult, draftsResult, privateResult] = await Promise.all([
          fetch(`/api/trips?public=true&mine=true&limit=50&userId=${parsedUser.id}`)
            .then(r => r.json())
            .then(d => ({ data: { trips: d.trips || [] }, error: d.error || null }))
            .catch(() => ({ data: null, error: 'Couldn’t load your trips.' })), // This user's shared/public trips
          fetch(`/api/trips?drafts=true&userId=${parsedUser.id}`).then(r => r.json()).catch(() => ({ trips: [] })), // Draft trips
          fetch(`/api/trips?private=true&userId=${parsedUser.id}`).then(r => r.json()).catch(() => ({ trips: [] })) // Private finalized trips
        ]);
        
        if (sharedResult.data) {
          // Filter shared trips to show only the current user's public trips
          // Exclude database trips (used for suggestions only)
          const userSharedTrips = sharedResult.data.trips.filter((trip: any) => 
            trip.user?.id === parsedUser.id && 
            (!trip.isDraft || trip.isDraft === false) && 
            trip.isPublic === true &&
            !trip.title?.includes('DATABASE:') &&
            !trip.title?.includes('TEMPLATE')
          );
          setTrips(userSharedTrips);
        } else if (sharedResult.error) {
          setError(sharedResult.error);
        }
        
        // Set draft trips
        if (draftsResult.trips) {
          setDraftTrips(draftsResult.trips);
        }
        
        // Set private finalized trips
        if (privateResult.trips) {
          setPrivateTrips(privateResult.trips);
        }
        
        setError(null);
      } catch (fetchError) {
        console.error('Error loading your trips:', fetchError);
        setError('Couldn’t load your trips. Please refresh the page.');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Only redirect to login if it's an authentication issue, not a network issue
      if (error instanceof Error && !error.message.includes('Network') && !error.message.includes('fetch') && !error.message.includes('ERR_NETWORK')) {
        router.push('/login');
      } else {
        setError('Unable to load trips. Please check your connection and try again.');
        // Keep existing trips if available
        if (trips.length === 0) {
          setTrips([]);
        }
      }
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    fetchUserTrips();
  }, []);

  const handleDeleteTrip = async (tripId: string, tripTitle: string) => {
    if (!user || deletingTrip) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete "${tripTitle}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingTrip(tripId);
    
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      let response;
      try {
        response = await fetch(`/api/trips/${tripId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout. Please try again.');
        }
        throw fetchError;
      }

      if (!response.ok) {
        const errorData = await response.json();
        
        // If trip not found, it might already be deleted, so just remove from UI
        if (response.status === 404) {
          setTrips(prevTrips => prevTrips.filter(trip => trip.id !== tripId));
          setPrivateTrips(prev => prev.filter(trip => trip.id !== tripId));
          alert('Trip was already deleted.');
          return;
        }
        
        throw new Error(errorData.error || 'Failed to delete trip');
      }

      // Remove the trip from the local state
      setTrips(prevTrips => prevTrips.filter(trip => trip.id !== tripId));
          setPrivateTrips(prev => prev.filter(trip => trip.id !== tripId));
      
      alert('Trip deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete trip');
    } finally {
      setDeletingTrip(null);
    }
  };

  const handleDeleteDraft = async (draftId: string, draftTitle: string) => {
    if (!user || deletingDraft) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete "${draftTitle}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingDraft(draftId);
    
    try {
      const response = await fetch(`/api/trips/${draftId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete draft trip');
      }

      // Remove the draft from the local state
      setDraftTrips(prevDrafts => prevDrafts.filter(draft => draft.id !== draftId));
      
      alert('Draft trip deleted successfully!');
    } catch (error) {
      console.error('Delete draft error:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete draft trip');
    } finally {
      setDeletingDraft(null);
    }
  };

  // Every trip the user has made, newest first, tagged with its status
  type TripStatus = 'Draft' | 'Private' | 'Shared';
  const allMyTrips: { trip: Trip; status: TripStatus }[] = [
    ...draftTrips.map((trip) => ({ trip, status: 'Draft' as TripStatus })),
    ...privateTrips.map((trip) => ({ trip, status: 'Private' as TripStatus })),
    ...trips.map((trip) => ({ trip, status: 'Shared' as TripStatus })),
  ]
    .filter((item, i, arr) => arr.findIndex((x) => x.trip.id === item.trip.id) === i)
    .sort((a, b) => new Date(b.trip.createdAt || 0).getTime() - new Date(a.trip.createdAt || 0).getTime());

  const tripMeta = (t: Trip) => {
    const days = t.startDate && t.endDate ? daysFromDates(t.startDate, t.endDate) : 0;
    return [parseList(t.countries).slice(0, 2).join(', '), days ? plural(days, 'day', 'days') : '', t.startDate ? monthYear(t.startDate) : ''].filter(Boolean).join(' · ');
  };
  // What a draft still needs, so it's obvious how to finish it
  const missing = (t: Trip) => {
    const cities = t.cities_data || [];
    const out: string[] = [];
    if (!cities.length) out.push('No cities yet');
    const noHotel = cities.find((c) => !(c.hotels || []).length);
    if (noHotel) out.push(`No hotel yet in ${noHotel.name}`);
    if (cities.length && cities.every((c) => !(c.restaurants || []).length && !(c.activities || []).length)) out.push('No restaurants or things to do yet');
    if (!t.coverImageUrl) out.push('No cover photo');
    return out.slice(0, 2).join(' · ');
  };

  const countries = new Set(allMyTrips.filter((x) => x.status !== 'Draft').flatMap((x) => parseList(x.trip.countries)));
  const planned = sandbox?.trips || [];
  const ideas = (sandbox?.places || []).filter((p: any) => !p.sandboxTripId).length;
  const stats: [string, string][] = [
    ['Trips shared', String(trips.length)],
    ['Drafts', String(draftTrips.length)],
    ['Planning', sandbox ? String(planned.length) : '–'],
    ['Saved ideas', sandbox ? String(ideas) : '–'],
    ['Countries', String(countries.size)],
  ];
  const shown = allMyTrips.filter((x) => filter === 'All' || x.status === filter);
  const firstName = (user?.name || '').trim().split(/\s+/)[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] pt-16">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-12 animate-pulse">
          <div className="h-3 w-48 bg-[#ECE8E0] mb-5" />
          <div className="h-14 w-2/3 bg-[#ECE8E0] mb-10" />
          <div className="h-24 border-y border-[#E2DDD5] bg-[#F2EFE8]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-[#13212B] pt-16">
      {/* Greeting */}
      <section className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-10 sm:pt-12">
        <div className="flex flex-wrap gap-x-12 gap-y-6 items-end justify-between pb-7 border-b border-[#13212B]">
          <div className="flex flex-col gap-3">
            <p className="font-mono text-xs tracking-[0.14em] text-[#1F6F78] uppercase">
              Your journal · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="font-serif font-normal text-[40px] sm:text-[56px] lg:text-[64px] leading-[1.02] tracking-[-0.02em]">
              {greeting()}{firstName ? `, ${firstName}` : ''}
            </h1>
          </div>
          <div data-tour="account-actions" className="flex flex-wrap gap-2.5">
            <Link href="/trips/new" className={`${BTN} bg-[#13212B] text-[#F8F6F1] hover:bg-[#24394A]`}><Plus className="w-4 h-4" strokeWidth={1.6} />ADD A TRIP</Link>
            <Link href="/trips/import" className={`${BTN} border border-[#13212B] hover:bg-[#13212B] hover:text-[#F8F6F1]`}>IMPORT NOTES</Link>
            <Link href="/sandbox" className={`${BTN} border border-[#13212B] hover:bg-[#13212B] hover:text-[#F8F6F1]`}>PLAN A NEW TRIP</Link>
          </div>
        </div>
        <dl className="flex flex-wrap border-b border-[#E2DDD5]">
          {stats.map(([k, v]) => (
            <div key={k} className="flex-[1_1_140px] py-5 pr-5 flex flex-col gap-1.5">
              <dt className="font-mono text-[11px] tracking-[0.12em] text-[#5B6A73] uppercase">{k}</dt>
              <dd className="font-serif text-[40px] sm:text-[44px] leading-none">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {error && (
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-6">
          <div className="border border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-red-800">{error}</p>
            <button onClick={() => fetchUserTrips(true)} disabled={isRetrying} className={`${LINK} inline-flex items-center gap-2`}>
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />{isRetrying ? 'RETRYING…' : 'TRY AGAIN'}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-10 sm:pt-12 pb-20 flex flex-wrap gap-12 items-start">
        <main className="flex-[999_1_560px] min-w-0 flex flex-col gap-12 sm:gap-14">
          {/* Drafts */}
          {draftTrips.length > 0 && (
            <section>
              <SectionHead title="Pick up where you left off" right={<span className="font-mono text-[11px] tracking-[0.12em] text-[#5B6A73]">DRAFTS</span>} />
              {draftTrips.slice(0, 4).map((t) => (
                <div key={t.id} className="flex flex-wrap gap-x-6 gap-y-3 py-5 border-b border-[#E2DDD5] items-center">
                  <div className="flex-[1_1_280px] min-w-0 flex flex-col gap-1.5">
                    <span className="font-mono text-[11px] tracking-[0.12em] text-[#5B6A73] uppercase">{['Draft', tripMeta(t)].filter(Boolean).join(' · ')}</span>
                    <Link href={`/trips/new?id=${t.id}`} className="font-serif text-[24px] sm:text-[26px] leading-tight hover:text-[#1F6F78]">{t.title || 'Untitled trip'}</Link>
                    {missing(t) && <span className="font-mono text-[11px] tracking-[0.06em] text-[#A4462B] uppercase">{missing(t)}</span>}
                  </div>
                  <Link href={`/trips/new?id=${t.id}`} className="inline-flex items-center min-h-[44px] px-4 border border-[#13212B] font-mono text-xs tracking-[0.1em] hover:bg-[#13212B] hover:text-[#F8F6F1]">FINISH →</Link>
                </div>
              ))}
            </section>
          )}

          {/* Planned trips */}
          <section>
            <SectionHead title="Trips you’re planning" right={<Link href="/sandbox" className={`${LINK} py-2.5`}>OPEN SANDBOX →</Link>} />
            {sandbox === null ? (
              <div className="h-24 border-b border-[#E2DDD5] animate-pulse bg-[#F2EFE8]" />
            ) : planned.length === 0 ? (
              <div className="py-6 border-b border-dashed border-[#CFC8BC] flex flex-wrap gap-4 items-center justify-between">
                <p className="font-serif italic text-[22px]">Nothing planned yet</p>
                <Link href="/trips" className={LINK}>FIND PLACES IN OTHERS’ TRIPS →</Link>
              </div>
            ) : (
              planned.slice(0, 4).map((pt: any) => {
                const mine = (sandbox?.places || []).filter((p: any) => p.sandboxTripId === pt.id);
                const cities = Array.from(new Set(mine.map((p: any) => p.city).filter(Boolean))) as string[];
                const ctry = Array.from(new Set(mine.map((p: any) => p.country).filter(Boolean))) as string[];
                const open = sandbox?.feedback?.[pt.id]?.open || 0;
                const tag = open > 0 ? plural(open, 'new idea', 'new ideas') : pt.feedbackOpen ? 'Open for feedback' : 'Ask for feedback';
                const href = open > 0 || !pt.feedbackOpen ? `/sandbox?trip=${pt.id}&tab=feedback` : `/sandbox?trip=${pt.id}`;
                return (
                  <div key={pt.id} className="flex flex-wrap gap-x-7 gap-y-3 py-5 border-b border-[#E2DDD5] items-start">
                    <Link href={`/sandbox?trip=${pt.id}`} className="group flex-[1_1_300px] min-w-0 flex flex-col gap-1.5">
                      <span className="font-mono text-[11px] tracking-[0.12em] text-[#5B6A73] uppercase">
                        {[ctry.slice(0, 2).join(', ') || pt.region, plural(mine.length, 'place', 'places')].filter(Boolean).join(' · ')}
                      </span>
                      <span className="font-serif text-[26px] sm:text-[28px] leading-tight group-hover:text-[#1F6F78]">{pt.title}</span>
                      {cities.length > 0 && <span className="font-mono text-[13px] uppercase">{cities.slice(0, 5).join(' → ')}</span>}
                    </Link>
                    <Link href={href} className={`font-mono text-[11px] tracking-[0.1em] uppercase px-2.5 py-1.5 border ${open > 0 ? 'border-[#1F6F78] text-[#1F6F78]' : 'border-[#CFC8BC] text-[#5B6A73] hover:border-[#13212B] hover:text-[#13212B]'}`}>
                      {tag}
                    </Link>
                  </div>
                );
              })
            )}
          </section>

          {/* My trips */}
          <section>
            <SectionHead
              title="My trips"
              right={
                <div role="group" aria-label="Show" className="flex flex-wrap gap-1 font-mono text-[11px] tracking-[0.1em]">
                  {(['All', 'Shared', 'Private', 'Draft'] as const).map((f) => (
                    <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}
                      className={`min-h-[36px] px-3 border uppercase ${filter === f ? 'bg-[#13212B] border-[#13212B] text-[#F8F6F1]' : 'border-[#E2DDD5] text-[#3A4A54] hover:border-[#13212B]'}`}>
                      {f === 'Draft' ? 'Drafts' : f}
                    </button>
                  ))}
                </div>
              }
            />
            {shown.length === 0 ? (
              <div className="py-6 border-b border-dashed border-[#CFC8BC] flex flex-wrap gap-4 items-center justify-between">
                <p className="font-serif italic text-[22px]">{allMyTrips.length === 0 ? 'Your trips will show up here' : 'Nothing here yet'}</p>
                <Link href="/trips/new" className={LINK}>ADD A TRIP →</Link>
              </div>
            ) : (
              shown.map(({ trip, status }) => {
                const isDeleting = status === 'Draft' ? deletingDraft === trip.id : deletingTrip === trip.id;
                return (
                  <div key={trip.id} className="flex flex-wrap gap-x-6 gap-y-3 py-4 border-b border-[#E2DDD5] items-center">
                    <div className="relative w-24 h-[68px] shrink-0 border border-[#E2DDD5] overflow-hidden" style={{ background: 'repeating-linear-gradient(135deg, #EFEBE3 0 1px, #F6F3EC 1px 10px)' }}>
                      {trip.coverImageUrl && <img src={trip.coverImageUrl} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                    </div>
                    <div className="flex-[1_1_220px] min-w-0 flex flex-col gap-1">
                      <span className="font-serif text-[21px] sm:text-[22px] leading-snug">{trip.title || 'Untitled trip'}</span>
                      <span className="font-mono text-[11px] tracking-[0.08em] text-[#5B6A73] uppercase">{tripMeta(trip)}</span>
                    </div>
                    <span className="font-mono text-[11px] tracking-[0.1em] text-[#5B6A73] uppercase w-16">{status}</span>
                    <div className="flex items-center gap-4">
                      {status === 'Draft' ? (
                        <Link href={`/trips/${trip.id}/share`} className={`${LINK} py-2.5`}>SHARE</Link>
                      ) : (
                        <Link href={`/trips/${trip.id}`} className={`${LINK} py-2.5`}>VIEW</Link>
                      )}
                      <Link href={`/trips/new?id=${trip.id}`} className={`${LINK} py-2.5`}>EDIT</Link>
                      <button
                        type="button"
                        onClick={() => (status === 'Draft' ? handleDeleteDraft(trip.id, trip.title) : handleDeleteTrip(trip.id, trip.title))}
                        disabled={deletingTrip !== null || deletingDraft !== null}
                        aria-label={`Delete ${trip.title || 'trip'}`}
                        className="p-2.5 -mr-2.5 text-[#5B6A73] hover:text-red-700 disabled:opacity-50"
                      >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" strokeWidth={1.6} />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </main>

        {/* Right column */}
        <aside className="flex-[1_1_300px] min-w-0 flex flex-col gap-7">
          <section className="border border-[#E2DDD5] bg-white">
            <BoxHead>
              <span>NEW FEEDBACK ON YOUR PLANS</span>
              {fb && fb.open > 0 && <span className="text-[#1F6F78]">{fb.open} NEW</span>}
            </BoxHead>
            <div className="px-5 pb-2">
              {fb === null ? (
                <div className="h-16 my-3 animate-pulse bg-[#F2EFE8]" />
              ) : fb.items.length === 0 ? (
                <p className="py-4 font-serif italic text-lg text-[#5B6A73]">
                  No new feedback. {planned.some((p: any) => p.feedbackOpen) ? 'Members will reply here.' : 'Ask for feedback on a planned trip to hear from other members.'}
                </p>
              ) : (
                fb.items.map((f) => (
                  <div key={f.id} className="py-3.5 border-b border-[#EFEBE3] last:border-b-0 flex flex-col gap-1.5">
                    <span className="font-mono text-[11px] tracking-[0.08em] text-[#5B6A73] uppercase">
                      {[f.from, `on ${f.tripTitle}`, f.label].join(' · ')}
                    </span>
                    {(f.text || f.suggested || f.about) && (
                      <span className="font-serif italic text-[18px] leading-snug">
                        {f.suggested ? `Suggests ${f.suggested}${f.about ? ` (about ${f.about})` : ''}. ` : f.about ? `About ${f.about}. ` : ''}
                        {f.text ? `“${f.text}”` : ''}
                      </span>
                    )}
                    <div className="flex flex-wrap gap-x-4 font-mono text-[11px] tracking-[0.1em]">
                      <button type="button" disabled={fbBusy === f.id} onClick={() => actOnFeedback(f.id, 'accept')} className="py-2 text-[#1F6F78] hover:text-[#13212B] disabled:opacity-50">ACCEPT</button>
                      <button type="button" disabled={fbBusy === f.id} onClick={() => actOnFeedback(f.id, 'dismiss')} className="py-2 text-[#5B6A73] hover:text-[#13212B] disabled:opacity-50">SET ASIDE</button>
                      <Link href={`/sandbox?trip=${f.tripId}&tab=feedback`} className="py-2 text-[#5B6A73] hover:text-[#13212B]">OPEN</Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="border border-[#E2DDD5] bg-white">
            <BoxHead><span>MEMBERS ASKING FOR HELP</span></BoxHead>
            <div className="px-5">
              {asks === null ? (
                <div className="h-16 my-3 animate-pulse bg-[#F2EFE8]" />
              ) : asks.length === 0 ? (
                <p className="py-4 font-serif italic text-lg text-[#5B6A73]">No one is asking right now.</p>
              ) : (
                asks.map((a) => (
                  <Link key={a.id} href={`/feedback/${a.id}`} className="py-3.5 border-b border-[#EFEBE3] last:border-b-0 flex flex-col gap-1 hover:text-[#1F6F78]">
                    <span className="font-serif text-xl leading-snug">{a.title}</span>
                    <span className="font-mono text-[11px] tracking-[0.08em] text-[#5B6A73] uppercase">
                      {[(a.countries || []).slice(0, 2).join(', ') || a.region, a.commentCount ? plural(a.commentCount, 'comment', 'comments') : 'No comments yet'].filter(Boolean).join(' · ')}
                    </span>
                  </Link>
                ))
              )}
            </div>
            <Link href="/feedback" className={`block px-5 py-3.5 border-t border-[#E2DDD5] ${LINK}`}>GIVE ADVICE →</Link>
          </section>

          <section className="border-t border-[#13212B] pt-4">
            <h2 className="font-mono font-normal text-[11px] tracking-[0.14em] text-[#5B6A73] mb-1">NEW ON SHARE AND PLAN</h2>
            {(fresh || []).map((t: any) => (
              <Link key={t.id} href={`/trips/${t.id}`} className="py-3 border-b border-[#E2DDD5] flex flex-col gap-1 hover:text-[#1F6F78]">
                <span className="font-serif text-xl leading-snug">{t.title}</span>
                <span className="font-mono text-[11px] tracking-[0.08em] text-[#5B6A73] uppercase">
                  {[parseList(t.countries).slice(0, 2).join(', '), t.startDate ? monthYear(t.startDate) : ''].filter(Boolean).join(' · ')}
                </span>
              </Link>
            ))}
            <Link href="/trips" className={`inline-block pt-3 ${LINK}`}>BROWSE ALL TRIPS →</Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AccountContent />
    </Suspense>
  );
}
