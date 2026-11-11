'use client';

import { useMemo, useState } from 'react';
import { Sparkles, Loader2, Check, X, Users } from 'lucide-react';
import { SANDBOX_EVENT, AI_SUGGESTION, type PlaceToSave } from '@/lib/sandbox';

/**
 * "✨ Fill with AI" for one planned trip: describe what you want, the AI proposes places
 * (real travelers' picks first, Google suggestions for gaps) arranged by day, you untick
 * anything you don't want, then add the rest to the planned trip.
 */

type PlanItem = PlaceToSave & { dayNumber: number | null; why: string; source: 'traveler' | 'google' };
type Plan = { summary: string; cities: { name: string; country: string; days: number }[]; items: PlanItem[] };

const KIND_ICON: Record<string, string> = { hotel: '🏨', activity: '🎯', restaurant: '🍽️' };

export default function FillWithAI({
  userId,
  sandboxTripId,
  tripTitle,
  initialRequest = '',
  onAdded,
  onClose,
}: {
  userId: string;
  sandboxTripId: string;
  tripTitle: string;
  initialRequest?: string;
  onAdded: () => void;
  onClose: () => void;
}) {
  const [request, setRequest] = useState(initialRequest);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [off, setOff] = useState<Set<number>>(new Set()); // unticked items
  const [adding, setAdding] = useState(false);

  const makePlan = async () => {
    setBusy(true);
    setError('');
    setPlan(null);
    setOff(new Set());
    try {
      const res = await fetch('/api/assistant/fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sandboxTripId, request }),
      });
      const start = await res.json();
      if (!res.ok || !start.jobId) throw new Error(start.error || 'Couldn’t start.');
      const deadline = Date.now() + 4 * 60_000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 3000));
        const poll = await fetch(`/api/assistant/fill?job=${encodeURIComponent(start.jobId)}&userId=${encodeURIComponent(userId)}`, { cache: 'no-store' })
          .then((r) => r.json())
          .catch(() => ({ status: 'running' }));
        if (poll.status === 'done') { setPlan(poll.plan); return; }
        if (poll.status === 'error') throw new Error(poll.error || 'Something went wrong.');
      }
      throw new Error('That took too long. Please try again.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  // Group the plan: city → hotels, then each day
  const grouped = useMemo(() => {
    if (!plan) return [];
    return plan.cities.map((c) => {
      const inCity = plan.items.map((it, i) => ({ it, i })).filter(({ it }) => it.city === c.name);
      const days = Array.from({ length: c.days }, (_, d) => ({
        day: d + 1,
        items: inCity.filter(({ it }) => it.kind !== 'hotel' && (it.dayNumber || 1) === d + 1),
      }));
      return { city: c, hotels: inCity.filter(({ it }) => it.kind === 'hotel'), days };
    });
  }, [plan]);

  const chosen = plan ? plan.items.filter((_, i) => !off.has(i)) : [];

  const addToTrip = async () => {
    if (!plan || chosen.length === 0) return;
    setAdding(true);
    setError('');
    try {
      const places = chosen.map((it) => ({
        ...it,
        note: it.why ? `✨ ${it.why}` : null,
        sourceUserName: it.source === 'google' ? AI_SUGGESTION : it.sourceUserName,
      }));
      const res = await fetch('/api/sandbox/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sandboxTripId, places }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Couldn’t add them.');
      window.dispatchEvent(new CustomEvent(SANDBOX_EVENT, { detail: { count: data.count } }));
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t add them.');
    } finally {
      setAdding(false);
    }
  };

  const Item = ({ it, i }: { it: PlanItem; i: number }) => {
    const on = !off.has(i);
    return (
      <label className={`flex gap-3 p-2 rounded-lg border cursor-pointer ${on ? 'bg-white border-[#C9D9DF]' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
        <input
          type="checkbox"
          checked={on}
          onChange={() => setOff((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })}
          className="mt-1"
        />
        {it.imageUrl ? (
          <img src={it.imageUrl} alt="" loading="lazy" className="w-14 h-14 rounded-md object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <span className="w-14 h-14 rounded-md bg-[#EEE8DF] flex items-center justify-center text-xl shrink-0">{KIND_ICON[it.kind]}</span>
        )}
        <span className="min-w-0">
          <span className="block font-medium text-[#2F4A5C] text-sm">{KIND_ICON[it.kind]} {it.name}</span>
          {it.why && <span className="block text-xs text-[#4A5A63]">{it.why}</span>}
          <span className={`inline-flex items-center mt-0.5 text-[11px] px-1.5 py-0.5 rounded-full ${it.source === 'traveler' ? 'bg-[#E3ECEF] text-[#3F5B6A]' : 'bg-[#F3EBDD] text-[#8A6D3B]'}`}>
            {it.source === 'traveler' ? (
              <><Users className="w-3 h-3 mr-1" />From {it.sourceUserName ? `${it.sourceUserName}’s trip` : 'a traveler'}{it.sourceRating ? ` · ${it.sourceRating}★` : ''}</>
            ) : (
              <><Sparkles className="w-3 h-3 mr-1" />Suggested (Google)</>
            )}
          </span>
        </span>
      </label>
    );
  };

  return (
    <div className="bg-[#F3F7F8] border border-[#C9D9DF] rounded-xl p-4 sm:p-5 mb-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="font-semibold text-[#2F4A5C] flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#4A6878]" /> Fill “{tripTitle}” with AI</p>
        <button type="button" onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800" aria-label="Close"><X className="w-5 h-5" /></button>
      </div>

      {!plan && (
        <>
          <p className="text-sm text-[#4A5A63] mb-2">
            Describe the trip: how long, who’s going, what you love and what to avoid. It uses places from real travelers first, and Google suggestions to fill gaps.
          </p>
          <textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            rows={3}
            placeholder="e.g. 5 days, couple, love food and markets, mid-range boutique hotel in Roma or Condesa, one day trip to Teotihuacan, no museums on Monday"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
          />
          <button
            type="button"
            onClick={makePlan}
            disabled={busy || request.trim().length < 3}
            className="mt-2 inline-flex items-center px-4 py-2 bg-[#4A6878] text-white rounded-lg hover:bg-[#3F5B6A] text-sm font-medium disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {busy ? 'Planning… this can take up to a minute' : 'Make a plan'}
          </button>
        </>
      )}

      {error && <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {plan && (
        <div>
          {plan.summary && <p className="text-sm text-[#2F4A5C] mb-3">{plan.summary}</p>}
          <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
            {grouped.map(({ city, hotels, days }) => (
              <div key={city.name}>
                <p className="font-semibold text-[#2F4A5C] mb-2">{city.name}{city.country ? `, ${city.country}` : ''} · {city.days} {city.days === 1 ? 'day' : 'days'}</p>
                {hotels.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {hotels.map(({ it, i }) => <Item key={i} it={it} i={i} />)}
                  </div>
                )}
                {days.map(({ day, items }) =>
                  items.length ? (
                    <div key={day} className="mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7A83] mb-1">Day {day}</p>
                      <div className="space-y-2">{items.map(({ it, i }) => <Item key={i} it={it} i={i} />)}</div>
                    </div>
                  ) : null
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <button
              type="button"
              onClick={addToTrip}
              disabled={adding || chosen.length === 0}
              className="inline-flex items-center px-4 py-2 bg-[#2F4A5C] text-white rounded-lg hover:bg-[#24394A] text-sm font-medium disabled:opacity-60"
            >
              {adding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Add {chosen.length} {chosen.length === 1 ? 'place' : 'places'} to this trip
            </button>
            <button type="button" onClick={() => setPlan(null)} className="px-3 py-2 text-sm text-[#3F5B6A] underline">
              Change my request
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
