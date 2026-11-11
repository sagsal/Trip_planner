'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Plus, Check, Loader2, X, Inbox, Map as MapIcon } from 'lucide-react';
import { SANDBOX_EVENT, LAST_SANDBOX_TRIP_KEY, type PlaceToSave, type SandboxTripData } from '@/lib/sandbox';

/**
 * "＋" button that saves one or more places into My Travel Sandbox.
 * Asks which planned trip (or Unsorted) the first time, remembers the last choice,
 * then flies the place's photo up to the sandbox icon in the top bar.
 */

function currentUser(): { id: string; name?: string } | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Planned trips, cached for this page visit so the picker opens instantly
let tripsCache: SandboxTripData[] | null = null;
async function loadTrips(userId: string): Promise<SandboxTripData[]> {
  if (tripsCache) return tripsCache;
  const res = await fetch(`/api/sandbox?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  tripsCache = Array.isArray(data.trips) ? data.trips : [];
  return tripsCache!;
}

/** The photo flies from the button to the sandbox icon in the top bar. */
function flyToSandbox(from: DOMRect, imageUrl?: string | null) {
  const target = document.getElementById('sandbox-nav-icon');
  if (!target) return;
  const to = target.getBoundingClientRect();
  const el = document.createElement('div');
  const size = 56;
  Object.assign(el.style, {
    position: 'fixed',
    left: `${from.left + from.width / 2 - size / 2}px`,
    top: `${from.top + from.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '12px',
    zIndex: '200',
    pointerEvents: 'none',
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    background: imageUrl ? `center / cover no-repeat url("${imageUrl.replace(/"/g, '%22')}")` : '#4A6878',
    transition: 'transform 0.7s cubic-bezier(.5,-0.3,.6,1), opacity 0.7s ease-in',
  } as CSSStyleDeclaration);
  document.body.appendChild(el);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  requestAnimationFrame(() => {
    el.style.transform = `translate(${dx}px, ${dy}px) scale(0.2)`;
    el.style.opacity = '0.4';
  });
  setTimeout(() => {
    el.remove();
    target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 350 });
  }, 720);
}

export default function SaveToSandbox({
  places,
  label,
  variant = 'icon',
}: {
  places: PlaceToSave[];
  label?: string; // e.g. "Save this day"
  variant?: 'icon' | 'pill';
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [trips, setTrips] = useState<SandboxTripData[]>([]);
  const [choice, setChoice] = useState<string>(''); // '' = Unsorted, 'new' = new trip, else trip id
  const [newTitle, setNewTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<'' | 'saved' | 'already'>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(''), 2500);
    return () => clearTimeout(t);
  }, [done]);

  const start = async () => {
    setError('');
    const user = currentUser();
    if (!user?.id) {
      setNeedsSignIn(true);
      return;
    }
    setOpen(true);
    try {
      const list = await loadTrips(user.id);
      setTrips(list);
      const last = localStorage.getItem(LAST_SANDBOX_TRIP_KEY) || '';
      setChoice(last === '' || list.some((t) => t.id === last) ? last : '');
    } catch {
      setTrips([]);
    }
  };

  const save = async () => {
    const user = currentUser();
    if (!user?.id) return;
    setBusy(true);
    setError('');
    try {
      let tripId: string | null = choice && choice !== 'new' ? choice : null;
      if (choice === 'new') {
        const title = newTitle.trim() || 'My next trip';
        const res = await fetch('/api/sandbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, title }),
        });
        const data = await res.json();
        if (!res.ok || !data.trip) throw new Error(data.error || 'Couldn’t create the trip.');
        tripId = data.trip.id;
        tripsCache = [data.trip, ...(tripsCache || [])];
      }
      const res = await fetch('/api/sandbox/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, sandboxTripId: tripId, places }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Couldn’t save.');
      try { localStorage.setItem(LAST_SANDBOX_TRIP_KEY, tripId || ''); } catch {}
      setOpen(false);
      setNewTitle('');
      setDone(data.saved > 0 ? 'saved' : 'already');
      if (data.saved > 0 && btnRef.current) {
        flyToSandbox(btnRef.current.getBoundingClientRect(), places.find((p) => p.imageUrl)?.imageUrl);
      }
      window.dispatchEvent(new CustomEvent(SANDBOX_EVENT, { detail: { count: data.count } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t save.');
    } finally {
      setBusy(false);
    }
  };

  const nextUrl = typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname + window.location.search) : '';
  const what = places.length === 1 ? 'this place' : `these ${places.length} places`;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          start();
        }}
        title={label || 'Save to My Travel Sandbox'}
        aria-label={label || `Save ${places[0]?.name || 'place'} to My Travel Sandbox`}
        className={
          variant === 'icon'
            ? `inline-flex items-center justify-center w-9 h-9 rounded-full border transition-colors ${
                done ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-[#C9D9DF] text-[#3F5B6A] hover:bg-[#E3ECEF]'
              }`
            : `inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                done ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-[#C9D9DF] text-[#3F5B6A] hover:bg-[#E3ECEF]'
              }`
        }
      >
        {done ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        {variant === 'pill' && <span>{done === 'already' ? 'Already saved' : done ? 'Saved' : label || 'Save'}</span>}
      </button>

      {(open || needsSignIn) &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[150] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => { setOpen(false); setNeedsSignIn(false); }}
          >
            <div
              className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl p-5"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="Save to My Travel Sandbox"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-lg font-semibold text-[#2F4A5C]">Save to My Travel Sandbox</p>
                  <p className="text-sm text-[#6B7A83]">
                    {places.length === 1 ? places[0].name : `${places.length} places${label ? ` · ${label.replace(/^Save /, '')}` : ''}`}
                  </p>
                </div>
                <button type="button" onClick={() => { setOpen(false); setNeedsSignIn(false); }} className="p-1 text-gray-500 hover:text-gray-800" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {needsSignIn ? (
                <div>
                  <p className="text-[#4A5A63] mb-4">Sign in to collect {what} in your sandbox and plan your next trips.</p>
                  <div className="flex gap-2">
                    <Link href={`/login?next=${nextUrl}`} className="flex-1 text-center px-4 py-2.5 bg-[#4A6878] text-white rounded-lg hover:bg-[#3F5B6A] font-medium">
                      Sign in
                    </Link>
                    <Link href="/register" className="flex-1 text-center px-4 py-2.5 border border-[#D9D2C7] text-[#2F4A5C] rounded-lg hover:bg-[#FBF9F5] font-medium">
                      Create an account
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Which trip is it for?</p>
                  <div className="max-h-64 overflow-y-auto space-y-1.5 mb-3">
                    <label className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer ${choice === '' ? 'border-[#4A6878] bg-[#F3F7F8]' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name="sandbox-choice" checked={choice === ''} onChange={() => setChoice('')} />
                      <Inbox className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-800">Unsorted <span className="text-gray-500 text-sm">— decide later</span></span>
                    </label>
                    {trips.map((t) => (
                      <label key={t.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer ${choice === t.id ? 'border-[#4A6878] bg-[#F3F7F8]' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="sandbox-choice" checked={choice === t.id} onChange={() => setChoice(t.id)} />
                        <MapIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-800 truncate">{t.title}</span>
                      </label>
                    ))}
                    <label className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer ${choice === 'new' ? 'border-[#4A6878] bg-[#F3F7F8]' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name="sandbox-choice" checked={choice === 'new'} onChange={() => setChoice('new')} />
                      <Plus className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-800">A new planned trip…</span>
                    </label>
                    {choice === 'new' && (
                      <input
                        autoFocus
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } }}
                        placeholder="e.g. Greece 2027"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      />
                    )}
                  </div>
                  {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
                  <button
                    type="button"
                    onClick={save}
                    disabled={busy}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-[#4A6878] text-white rounded-lg hover:bg-[#3F5B6A] font-medium disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Save {what}
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
