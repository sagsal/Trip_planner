'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ThumbsUp, Check, X, Trash2, MessageCircle, Loader2, ExternalLink, MapPin } from 'lucide-react';
import TripAdvisorSearch from '@/components/TripAdvisorSearch';
import { REACTIONS, Target, reactionLabel, needsPlace, SuggestedPlace, LIMITS } from '@/lib/feedback';
import { monthYear } from '@/lib/dates';
import { tripTypeIcon } from '@/lib/regions';

type Kind = 'hotel' | 'restaurant' | 'activity';
interface Place {
  id: string; kind: Kind; name: string; location: string | null; city: string | null; country: string | null;
  imageUrl: string | null; webUrl: string | null; stayType: string | null; note: string | null; dayNumber: number | null;
}
interface Comment {
  id: string; targetType: Target; targetKey: string | null; targetLabel: string | null; reaction: string;
  text: string | null; suggestion: SuggestedPlace | null; status: 'open' | 'accepted' | 'dismissed';
  createdAt: string; author: string; byOwner: boolean; mine: boolean; agrees: number; agreedByMe: boolean;
}
interface Data {
  isOwner: boolean;
  trip: { id: string; title: string; region: string | null; tripType: string | null; startDate: string | null; endDate: string | null; notes: string | null; ask: string | null; open: boolean };
  places: Place[];
  comments: Comment[];
}

const KIND_LABEL: Record<Kind, string> = { hotel: 'Stay', restaurant: 'Eat', activity: 'Do' };
const CATEGORY: Record<Kind, 'hotels' | 'restaurants' | 'attractions'> = { hotel: 'hotels', restaurant: 'restaurants', activity: 'attractions' };

function timeAgo(d: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}

/* ---------- Writing a comment ---------- */
function Composer({
  target, targetKey, kind, city, country, onPosted, onCancel,
}: {
  target: Target; targetKey?: string; kind?: Kind; city?: string | null; country?: string | null;
  onPosted: () => void; onCancel?: () => void;
}) {
  const { id } = useParams<{ id: string }>();
  const [reaction, setReaction] = useState('');
  const [text, setText] = useState('');
  const [suggestKind, setSuggestKind] = useState<Kind>(kind || 'restaurant');
  const [query, setQuery] = useState('');
  const [suggestion, setSuggestion] = useState<SuggestedPlace | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const wantsPlace = !!reaction && needsPlace(target, reaction);

  const post = async () => {
    setBusy(true);
    setError('');
    try {
      const r = await fetch(`/api/feedback/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: target, targetKey, reaction, text, suggestion }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Couldn’t post that.');
      setReaction(''); setText(''); setSuggestion(null); setQuery('');
      onPosted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t post that.');
    } finally {
      setBusy(false);
    }
  };

  const canPost = !!reaction && !busy && (!wantsPlace || !!suggestion) && (reaction !== 'note' || !!text.trim());

  return (
    <div className="rounded-2xl bg-[#F8F7F4] border border-[#ECE7DF] p-3 sm:p-4">
      <div className="flex flex-wrap gap-2">
        {REACTIONS[target].map((r) => (
          <button
            key={r.key}
            type="button"
            aria-pressed={reaction === r.key}
            onClick={() => { setReaction(r.key); setSuggestion(null); }}
            className={`px-3 py-1.5 rounded-full border text-sm min-h-[36px] ${reaction === r.key ? 'bg-[#13212B] border-[#13212B] text-white font-semibold' : 'bg-white border-[#E2DCD2] text-[#2A3A44] hover:bg-[#F1EEE8]'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {wantsPlace && (
        <div className="mt-3 flex flex-col gap-2">
          {target !== 'place' && (
            <div className="flex gap-1.5" role="group" aria-label="Kind of place">
              {(['hotel', 'restaurant', 'activity'] as Kind[]).map((k) => (
                <button key={k} type="button" aria-pressed={suggestKind === k} onClick={() => { setSuggestKind(k); setSuggestion(null); setQuery(''); }}
                  className={`px-3 py-1 rounded-lg text-sm ${suggestKind === k ? 'bg-[#1F6F78] text-white font-semibold' : 'bg-white border border-[#E2DCD2] text-[#3D4C56]'}`}>
                  {k === 'hotel' ? 'Place to stay' : k === 'restaurant' ? 'Restaurant' : 'Thing to do'}
                </button>
              ))}
            </div>
          )}
          {suggestion ? (
            <div className="flex items-center gap-3 bg-white rounded-xl border border-[#E2DCD2] p-2">
              {suggestion.imageUrl && <img src={suggestion.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{suggestion.name}</p>
                {suggestion.location && <p className="text-xs text-[#5B6A73] line-clamp-1">{suggestion.location}</p>}
              </div>
              <button type="button" onClick={() => { setSuggestion(null); setQuery(''); }} className="text-sm text-[#1F6F78] underline px-2">Change</button>
            </div>
          ) : (
            <TripAdvisorSearch
              value={query}
              onChange={setQuery}
              onSelect={(r) => {
                const a = r.address_obj;
                setSuggestion({
                  kind: target === 'place' ? (kind || 'activity') : suggestKind,
                  name: r.name,
                  location: a ? [a.street1, a.city, a.country].filter(Boolean).join(', ') : null,
                  city: city || a?.city || null,
                  country: country || a?.country || null,
                  imageUrl: r.photo_url || r.photos?.[0]?.images?.medium?.url || null,
                  webUrl: r.web_url || null,
                });
              }}
              category={CATEGORY[target === 'place' ? (kind || 'activity') : suggestKind]}
              cityName={city || undefined}
              countryName={country || undefined}
              placeholder="Search for the place…"
              allowDescribe
            />
          )}
        </div>
      )}

      {reaction && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, LIMITS.textMax))}
          rows={2}
          placeholder={reaction === 'note' ? 'Your comment…' : 'Why? (optional)'}
          className="mt-3 w-full px-3 py-2 rounded-xl border border-[#E2DCD2] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6F78]"
        />
      )}
      {error && <p className="mt-2 text-sm text-[#B4532A]">{error}</p>}
      {(reaction || onCancel) && (
        <div className="mt-3 flex items-center gap-2">
          <button type="button" disabled={!canPost} onClick={post}
            className="inline-flex items-center px-4 min-h-[40px] rounded-xl bg-[#1F6F78] text-white text-sm font-semibold hover:bg-[#16535A] disabled:opacity-50">
            {busy && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />} Post
          </button>
          {onCancel && <button type="button" onClick={onCancel} className="px-3 min-h-[40px] text-sm text-[#5B6A73]">Cancel</button>}
        </div>
      )}
    </div>
  );
}

/* ---------- One comment ---------- */
function CommentCard({ c, isOwner, onChanged }: { c: Comment; isOwner: boolean; onChanged: (msg?: string) => void }) {
  const [busy, setBusy] = useState('');
  const act = async (action: string) => {
    if (action === 'delete' && !confirm('Delete this comment?')) return;
    setBusy(action);
    try {
      const r = await fetch(`/api/feedback/comments/${c.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { alert(d.error || 'Something went wrong.'); return; }
      const msg = d.changed === 'swapped' ? 'Swapped in your Sandbox trip.' : d.changed === 'added' ? 'Added to your Sandbox trip.' : d.changed === 'removed' ? 'Removed from your Sandbox trip.' : undefined;
      onChanged(msg);
    } finally {
      setBusy('');
    }
  };
  const s = c.suggestion;
  const changesPlan = (c.reaction === 'swap' || c.reaction === 'add_place') ? !!s : c.reaction === 'skip';

  return (
    <div className={`rounded-2xl border p-3 sm:p-4 ${c.status === 'accepted' ? 'bg-[#F1F8F3] border-[#CFE5D6]' : c.status === 'dismissed' ? 'bg-[#F8F7F4] border-[#ECE7DF] opacity-70' : 'bg-white border-[#ECE7DF]'}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="font-semibold text-[#13212B]">{c.author}</span>
        <span className="px-2 py-0.5 rounded-full bg-[#F1EEE8] text-[#2A3A44] text-xs font-semibold">{reactionLabel(c.targetType, c.reaction).replace('…', '')}</span>
        <span className="text-xs text-[#8A969D]">{timeAgo(c.createdAt)}</span>
        {c.status === 'accepted' && <span className="text-xs font-semibold text-[#2F7A4F]">✓ Accepted</span>}
        {c.status === 'dismissed' && <span className="text-xs text-[#5B6A73]">Set aside</span>}
      </div>
      {s && (
        <div className="mt-2 flex items-center gap-3 bg-[#FBFAF7] rounded-xl border border-[#ECE7DF] p-2">
          {s.imageUrl && <img src={s.imageUrl} alt="" loading="lazy" className="w-14 h-14 rounded-lg object-cover" />}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm">{s.name}</p>
            {s.location && <p className="text-xs text-[#5B6A73] line-clamp-1">{s.location}</p>}
          </div>
          {s.webUrl && (
            <a href={s.webUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-[#1F6F78]" aria-label={`Open ${s.name}`}><ExternalLink className="w-4 h-4" /></a>
          )}
        </div>
      )}
      {c.text && <p className="mt-2 text-sm text-[#2A3A44] whitespace-pre-line">{c.text}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {!c.mine && (
          <button type="button" onClick={() => act('agree')} disabled={!!busy} aria-pressed={c.agreedByMe}
            className={`inline-flex items-center px-3 min-h-[34px] rounded-full border text-xs font-semibold ${c.agreedByMe ? 'bg-[#E3F0F0] border-[#C3DEDF] text-[#16535A]' : 'bg-white border-[#E2DCD2] text-[#3D4C56]'}`}>
            <ThumbsUp className="w-3.5 h-3.5 mr-1" /> Agree{c.agrees ? ` · ${c.agrees}` : ''}
          </button>
        )}
        {c.mine && c.agrees > 0 && <span className="text-xs text-[#5B6A73]"><ThumbsUp className="w-3.5 h-3.5 inline mr-1" />{c.agrees} agree</span>}
        {isOwner && c.status === 'open' && !c.byOwner && (
          <>
            <button type="button" onClick={() => act('accept')} disabled={!!busy}
              className="inline-flex items-center px-3 min-h-[34px] rounded-full bg-[#2F7A4F] text-white text-xs font-semibold hover:bg-[#256441]">
              {busy === 'accept' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
              {changesPlan ? (c.reaction === 'swap' ? 'Accept & swap' : c.reaction === 'skip' ? 'Accept & remove' : 'Accept & add') : 'Accept'}
            </button>
            <button type="button" onClick={() => act('dismiss')} disabled={!!busy}
              className="inline-flex items-center px-3 min-h-[34px] rounded-full bg-white border border-[#E2DCD2] text-[#3D4C56] text-xs font-semibold">
              <X className="w-3.5 h-3.5 mr-1" /> Set aside
            </button>
          </>
        )}
        {isOwner && c.status !== 'open' && (
          <button type="button" onClick={() => act('reopen')} disabled={!!busy} className="text-xs text-[#5B6A73] underline px-1">Undo</button>
        )}
        {(c.mine || isOwner) && (
          <button type="button" onClick={() => act('delete')} disabled={!!busy} className="ml-auto p-1.5 text-[#8A969D] hover:text-[#B4532A]" aria-label="Delete comment">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
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
      <div className="min-h-screen bg-[#FBFAF7] pt-24 px-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Sign in to help plan this trip</h1>
        <p className="text-[#5B6A73] mb-6">Help me plan is for members only.</p>
        <Link href={`/login?next=/feedback/${id}`} className="inline-flex items-center px-6 py-3 bg-[#13212B] text-white rounded-xl font-semibold">Sign in</Link>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-[#FBFAF7] pt-24 px-4 text-center">
        <p className="text-[#5B6A73] mb-6">{error}</p>
        <Link href="/feedback" className="font-semibold text-[#1F6F78]">← Help me plan</Link>
      </div>
    );
  }
  if (!data) return <div className="min-h-screen bg-[#FBFAF7] pt-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#8A969D]" /></div>;

  const { trip, isOwner } = data;
  const openComments = data.comments.filter((c) => c.status === 'open' && !c.byOwner).length;

  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#13212B] pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Link href={isOwner ? `/sandbox?trip=${trip.id}` : '/feedback'} className="inline-flex items-center font-semibold text-[#1F6F78] hover:text-[#16535A] mb-4">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> {isOwner ? 'Back to my Sandbox' : 'Help me plan'}
        </Link>

        {toast && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#13212B] text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toast}</div>}

        <div className="bg-white border border-[#ECE7DF] rounded-[24px] p-5 sm:p-7 mb-6">
          <div className="flex flex-wrap gap-2 mb-2">
            {trip.tripType && <span className="px-3 py-1 rounded-full bg-[#E3F0F0] text-[#16535A] text-xs font-semibold">{tripTypeIcon(trip.tripType)} {trip.tripType}</span>}
            {trip.region && <span className="px-3 py-1 rounded-full bg-[#F1EEE8] text-[#3D4C56] text-xs font-semibold">{trip.region}</span>}
            {!trip.open && <span className="px-3 py-1 rounded-full bg-[#F6E7DC] text-[#8A4B24] text-xs font-semibold">Not open for feedback</span>}
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">{trip.title}</h1>
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
                {trip.open ? `Open for feedback · ${openComments} new ${openComments === 1 ? 'suggestion' : 'suggestions'} to review` : 'Only you can see this page right now.'}
              </span>
              <button type="button" onClick={() => setOpen(!trip.open)} className="px-3 min-h-[36px] rounded-xl border border-[#E2DCD2] bg-white font-semibold">
                {trip.open ? 'Close feedback' : 'Open for feedback'}
              </button>
            </div>
          )}
        </div>

        {/* The whole trip */}
        <section className="mb-8">
          <h2 className="text-xl font-extrabold mb-3">The whole trip</h2>
          <div className="flex flex-col gap-3">
            {commentsOn('trip').map((c) => <CommentCard key={c.id} c={c} isOwner={isOwner} onChanged={changed} />)}
            {trip.open && <Composer target="trip" onPosted={() => changed()} />}
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
                <h2 className="text-xl font-extrabold flex items-center gap-2"><MapPin className="w-5 h-5 text-[#1F6F78]" />{g.city}</h2>
                {trip.open && openFor !== cityKey && (
                  <button type="button" onClick={() => setOpenFor(cityKey)} className="inline-flex items-center px-3 min-h-[36px] rounded-xl border border-[#E2DCD2] bg-white text-sm font-semibold">
                    <MessageCircle className="w-4 h-4 mr-1.5" /> Advice on {g.city}
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-3 mb-4">
                {commentsOn('city', g.city).map((c) => <CommentCard key={c.id} c={c} isOwner={isOwner} onChanged={changed} />)}
                {openFor === cityKey && (
                  <Composer target="city" targetKey={g.city} city={g.city} country={g.country} onPosted={() => { setOpenFor(null); changed(); }} onCancel={() => setOpenFor(null)} />
                )}
              </div>

              {order.map((k) => (
                <div key={k} className="mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#5B6A73] mb-2">{k}</h3>
                  <div className="flex flex-col gap-3">
                    {byDay.get(k)!.map((p) => {
                      const pc = commentsOn('place', p.id);
                      return (
                        <div key={p.id} className="bg-white border border-[#ECE7DF] rounded-2xl overflow-hidden">
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
                                <button type="button" onClick={() => setOpenFor(p.id)} className="px-3 min-h-[36px] rounded-xl border border-[#E2DCD2] bg-white text-sm font-semibold">React</button>
                              )}
                            </div>
                          </div>
                          {(pc.length > 0 || openFor === p.id) && (
                            <div className="border-t border-[#ECE7DF] bg-[#FBFAF7] p-3 flex flex-col gap-3">
                              {pc.map((c) => <CommentCard key={c.id} c={c} isOwner={isOwner} onChanged={changed} />)}
                              {openFor === p.id && (
                                <Composer target="place" targetKey={p.id} kind={p.kind} city={p.city} country={p.country}
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
