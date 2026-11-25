'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, Loader2, MapPin } from 'lucide-react';
import { Composer, CommentCard, KIND_LABEL, type FeedbackComment, type Kind } from '@/components/FeedbackComments';
import { Target, LIMITS } from '@/lib/feedback';
import { monthYear } from '@/lib/dates';
import { tripTypeIcon } from '@/lib/regions';

interface Place {
  id: string; kind: Kind; name: string; location: string | null; city: string | null; country: string | null;
  imageUrl: string | null; webUrl: string | null; stayType: string | null; note: string | null; dayNumber: number | null;
}
type Comment = FeedbackComment;
interface Data {
  isOwner: boolean;
  trip: { id: string; title: string; region: string | null; tripType: string | null; startDate: string | null; endDate: string | null; notes: string | null; ask: string | null; open: boolean };
  places: Place[];
  comments: Comment[];
}

export default function FeedbackTripPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [openFor, setOpenFor] = useState<string | null>(null); // which place/city composer is open
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    const r = await fetch(`/api/feedback/${id}`, { cache: 'no-store' });
    if (r.status === 401) { setNeedsSignIn(true); return; }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setError(d.error || 'Couldn’t load this trip.'); return; }
    setData(d);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const changed = (msg?: string) => {
    load();
    if (msg) { setToast(msg); setTimeout(() => setToast(''), 3500); }
  };

  const setOpen = async (open: boolean) => {
    const r = await fetch(`/api/feedback/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: open ? 'open' : 'close' }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) alert(d.error || 'Something went wrong.');
    load();
  };

  const cities = useMemo(() => {
    if (!data) return [] as { city: string; country: string | null; places: Place[] }[];
    const out: { city: string; country: string | null; places: Place[] }[] = [];
    for (const p of data.places) {
      const name = p.city || 'Other places';
      let g = out.find((x) => x.city === name);
      if (!g) { g = { city: name, country: p.country, places: [] }; out.push(g); }
      g.places.push(p);
    }
    return out;
  }, [data]);

  const commentsOn = (type: Target, key?: string | null) =>
    (data?.comments || []).filter((c) => c.targetType === type && (type === 'trip' || c.targetKey === key));

  if (needsSignIn) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] pt-24 px-4 text-center">
        <h1 className="text-2xl font-normal mb-2">Sign in to help plan this trip</h1>
        <p className="text-[#5B6A73] mb-6">Advice is for members only.</p>
        <Link href={`/login?next=/feedback/${id}`} className="inline-flex items-center px-6 py-3 bg-[#13212B] text-white rounded-xl font-semibold">Sign in</Link>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] pt-24 px-4 text-center">
        <p className="text-[#5B6A73] mb-6">{error}</p>
        <Link href="/feedback" className="font-semibold text-[#1F6F78]">← Advice</Link>
      </div>
    );
  }
  if (!data) return <div className="min-h-screen bg-[#F8F6F1] pt-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#8A969D]" /></div>;

  const { trip, isOwner } = data;
  const openComments = data.comments.filter((c) => c.status === 'open' && !c.byOwner).length;

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-[#13212B] pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Link href={isOwner ? `/sandbox?trip=${trip.id}` : '/feedback'} className="inline-flex items-center font-semibold text-[#1F6F78] hover:text-[#16535A] mb-4">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> {isOwner ? 'Back to My plans' : 'Advice'}
        </Link>

        {toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#13212B] text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}

        <div className="bg-white border border-[#E2DDD5] rounded-[4px] p-5 sm:p-7 mb-6">
          <div className="flex flex-wrap gap-2 mb-2">
            {trip.tripType && <span className="px-3 py-1 rounded-full bg-[#E3F0F0] text-[#16535A] text-xs font-semibold">{tripTypeIcon(trip.tripType)} {trip.tripType}</span>}
            {trip.region && <span className="px-3 py-1 rounded-full bg-[#F1EEE8] text-[#3D4C56] text-xs font-semibold">{trip.region}</span>}
            {!trip.open && <span className="px-3 py-1 rounded-full bg-[#F6E7DC] text-[#8A4B24] text-xs font-semibold">Not open for feedback</span>}
          </div>
          <h1 className="text-2xl sm:text-4xl font-normal tracking-tight">{trip.title}</h1>
          <p className="text-[#5B6A73] mt-1">{[monthYear(trip.startDate), `${data.places.length} places planned`, cities.length > 1 ? `${cities.length} cities` : ''].filter(Boolean).join(' · ')}</p>
          {trip.ask && (
            <div className="mt-4 rounded-2xl bg-[#F1F6F6] border border-[#D4E5E6] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#1F6F78] mb-1">What I’d love advice on</p>
              <p className="text-[#16535A] whitespace-pre-line">{trip.ask}</p>
            </div>
          )}
          {isOwner && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="text-[#3D4C56]">
                {trip.open ? `Asking for advice · ${openComments} new ${openComments === 1 ? 'suggestion' : 'suggestions'} to review` : 'Only you can see this page right now.'}
              </span>
              <button type="button" onClick={() => setOpen(!trip.open)} className="px-3 min-h-[36px] rounded-xl border border-[#E2DDD5] bg-white font-semibold">
                {trip.open ? 'Stop asking' : 'Ask for advice'}
              </button>
            </div>
          )}
        </div>

        {/* The whole trip */}
        <section className="mb-8">
          <h2 className="text-xl font-normal mb-3">The whole trip</h2>
          <div className="flex flex-col gap-3">
            {commentsOn('trip').map((c) => <CommentCard key={c.id} c={c} isOwner={isOwner} onChanged={changed} />)}
            {trip.open && <Composer tripId={id} target="trip" onPosted={() => changed()} />}
          </div>
        </section>

        {/* City by city, place by place */}
        {cities.map((g) => {
          const byDay = new Map<string, Place[]>();
          for (const p of g.places) {
            const k = p.dayNumber ? `Day ${p.dayNumber}` : p.kind === 'hotel' ? 'Where to stay' : 'Not scheduled yet';
            byDay.set(k, [...(byDay.get(k) || []), p]);
          }
          const order = Array.from(byDay.keys()).sort((a, b) => {
            const rank = (k: string) => (k === 'Where to stay' ? -1 : k.startsWith('Day ') ? Number(k.slice(4)) : 999);
            return rank(a) - rank(b);
          });
          const cityKey = `city:${g.city}`;
          return (
            <section key={g.city} className="mb-8">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-xl font-normal flex items-center gap-2"><MapPin className="w-5 h-5 text-[#1F6F78]" />{g.city}</h2>
                {trip.open && openFor !== cityKey && (
                  <button type="button" onClick={() => setOpenFor(cityKey)} className="inline-flex items-center px-3 min-h-[36px] rounded-xl border border-[#E2DDD5] bg-white text-sm font-semibold">
                    <MessageCircle className="w-4 h-4 mr-1.5" /> Advice on {g.city}
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-3 mb-4">
                {commentsOn('city', g.city).map((c) => <CommentCard key={c.id} c={c} isOwner={isOwner} onChanged={changed} />)}
                {openFor === cityKey && (
                  <Composer tripId={id} target="city" targetKey={g.city} city={g.city} country={g.country} onPosted={() => { setOpenFor(null); changed(); }} onCancel={() => setOpenFor(null)} />
                )}
              </div>

              {order.map((k) => (
                <div key={k} className="mb-4">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-[#5B6A73] mb-2">{k}</h3>
                  <div className="flex flex-col gap-3">
                    {byDay.get(k)!.map((p) => {
                      const pc = commentsOn('place', p.id);
                      return (
                        <div key={p.id} className="bg-white border border-[#E2DDD5] rounded-2xl overflow-hidden">
                          <div className="flex gap-3 p-3">
                            {p.imageUrl ? <img src={p.imageUrl} alt="" loading="lazy" className="w-20 h-20 rounded-xl object-cover shrink-0 bg-[#F1EEE8]" /> : <div className="w-20 h-20 rounded-xl bg-[#F1EEE8] shrink-0" />}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold uppercase tracking-wider text-[#5B6A73]">{p.stayType === 'rental' ? 'Rental' : KIND_LABEL[p.kind]}</p>
                              <p className="font-bold leading-snug">{p.name}</p>
                              {p.location && <p className="text-sm text-[#5B6A73] line-clamp-1">{p.location}</p>}
                              {p.note && <p className="text-sm text-[#3D4C56] mt-1 italic">“{p.note}”</p>}
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {pc.length > 0 && <span className="text-xs font-semibold text-[#1F6F78]"><MessageCircle className="w-3.5 h-3.5 inline mr-0.5" />{pc.length}</span>}
                              {trip.open && openFor !== p.id && (
                                <button type="button" onClick={() => setOpenFor(p.id)} className="px-3 min-h-[36px] rounded-xl border border-[#E2DDD5] bg-white text-sm font-semibold">React</button>
                              )}
                            </div>
                          </div>
                          {(pc.length > 0 || openFor === p.id) && (
                            <div className="border-t border-[#E2DDD5] bg-[#F8F6F1] p-3 flex flex-col gap-3">
                              {pc.map((c) => <CommentCard key={c.id} c={c} isOwner={isOwner} onChanged={changed} />)}
                              {openFor === p.id && (
                                <Composer tripId={id} target="place" targetKey={p.id} kind={p.kind} city={p.city} country={p.country}
                                  onPosted={() => { setOpenFor(null); changed(); }} onCancel={() => setOpenFor(null)} />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          );
        })}

        {data.places.length === 0 && (
          <p className="text-[#5B6A73]">No places added yet, so comments on the whole trip are the way to help for now.</p>
        )}
        <p className="text-xs text-[#8A969D] mt-6">
          To keep this friendly: members only, up to {LIMITS.commentsPerDay} comments a day. Planners can set aside or delete any comment on their trip.
        </p>
      </div>
    </div>
  );
}
