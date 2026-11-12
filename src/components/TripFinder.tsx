'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, ArrowRight, RotateCcw, Send, MapPin, Calendar, Package, Check } from 'lucide-react';
import SaveToSandbox from '@/components/SaveToSandbox';
import { tripTypeIcon } from '@/lib/regions';
import { SANDBOX_EVENT, type PlaceToSave } from '@/lib/sandbox';

/**
 * "Find me a trip" assistant on Browse Trips: the traveller says what they want,
 * answers up to 3 quick questions, and gets real trips from the site with a reason for each.
 */

type Msg = { role: 'user' | 'assistant'; content: string };
type Result = {
  id: string;
  title: string;
  coverImageUrl?: string | null;
  tripType?: string | null;
  region?: string | null;
  countries: string[];
  cities: string[];
  days: number;
  userName: string;
  reason: string;
  exact: boolean;
  places: PlaceToSave[];
};

const EXAMPLES = [
  'Japan with my family',
  'Create a Mexico sandbox with places from family trips to Mexico',
  'A romantic week in Italy',
  'Two weeks backpacking in Central America',
  'Food trip to Mexico City',
];

// "Medellín" → "medellin", for matching city names loosely
const cityKey = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z ]/g, '').trim();

export default function TripFinder({ onTyping, children }: { onTyping?: (text: string) => void; children?: ReactNode } = {}) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [asked, setAsked] = useState(0);
  const [question, setQuestion] = useState<{ question: string; options: string[]; multi: boolean } | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [results, setResults] = useState<Result[] | null>(null);
  const [note, setNote] = useState('');
  const [summary, setSummary] = useState('');
  const [filters, setFilters] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  // "Create a planned trip from these trips" panel
  const [collectOpen, setCollectOpen] = useState(false);
  const [collectTitle, setCollectTitle] = useState('');
  const [collectKinds, setCollectKinds] = useState<string[]>(['hotel', 'activity', 'restaurant']);
  const [collectTrips, setCollectTrips] = useState<string[]>([]);
  const [collectCities, setCollectCities] = useState<string[]>([]); // empty = all cities
  const [collectAreas, setCollectAreas] = useState<string[]>([]); // neighbourhoods, matched against addresses
  const [collecting, setCollecting] = useState(false);
  const [collected, setCollected] = useState<{ id: string; title: string; saved: number } | null>(null);

  const openCollect = (title: string, kinds: string[] | undefined, res: Result[], cities?: string[], areas?: string[]) => {
    setCollectAreas((areas || []).filter(Boolean));
    setCollectTitle(title);
    setCollectKinds(kinds && kinds.length ? kinds : ['hotel', 'activity', 'restaurant']);
    // Cities they named (e.g. "just Cartagena and Medellín"), matched to the trips' own city names
    const named = (cities || []).map(cityKey).filter(Boolean);
    const all = Array.from(new Set(res.flatMap((r) => r.places.map((p) => p.city || '')).filter(Boolean)));
    const picked = named.length ? all.filter((c) => named.some((n) => cityKey(c).includes(n) || n.includes(cityKey(c)))) : [];
    setCollectCities(picked);
    const exact = res.filter((r) => r.exact);
    const withCities = picked.length ? res.filter((r) => r.places.some((p) => picked.includes(p.city || ''))) : [];
    setCollectTrips((withCities.length ? withCities : exact).map((r) => r.id));
    setCollected(null);
    setCollectOpen(true);
  };

  const collectPlaces = (res: Result[]) =>
    res
      .filter((r) => collectTrips.includes(r.id))
      .flatMap((r) => r.places)
      .filter((p) => collectKinds.includes(p.kind))
      .filter((p) => collectCities.length === 0 || collectCities.includes(p.city || ''))
      .filter((p) => collectAreas.length === 0 || collectAreas.some((a) => cityKey(`${p.location || ''} ${p.name}`).includes(cityKey(a))));
  const cityOptions = (res: Result[]) =>
    Array.from(new Set(res.filter((r) => collectTrips.includes(r.id)).flatMap((r) => r.places.map((p) => p.city || '')).filter(Boolean)));

  const createAndAdd = async () => {
    let user: { id: string } | null = null;
    try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch {}
    if (!user?.id) { router.push(`/login?next=${encodeURIComponent('/trips')}`); return; }
    const places = collectPlaces(results || []);
    if (places.length === 0) { setError('Choose at least one trip and one kind of place.'); return; }
    setCollecting(true);
    setError('');
    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: collectTitle.trim() || 'My next trip',
          region: filters?.region || undefined,
          tripType: Array.isArray(filters?.tripTypes) ? filters.tripTypes[0] : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.trip) throw new Error(data.error || 'Couldn’t create the planned trip.');
      const add = await fetch('/api/sandbox/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, sandboxTripId: data.trip.id, places }),
      }).then((r) => r.json());
      if (add.error) throw new Error(add.error);
      window.dispatchEvent(new CustomEvent(SANDBOX_EVENT, { detail: { count: add.count } }));
      setCollected({ id: data.trip.id, title: data.trip.title, saved: add.saved || 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t create the planned trip.');
    } finally {
      setCollecting(false);
    }
  };

  const send = async (msgs: Msg[], askedSoFar: number) => {
    setBusy(true);
    setError('');
    setQuestion(null);
    setPicked([]);
    try {
      const res = await fetch('/api/assistant/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs, asked: askedSoFar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      if (data.action === 'ask') {
        setQuestion({ question: data.question, options: data.options || [], multi: !!data.multi });
        setMessages([...msgs, { role: 'assistant', content: data.question }]);
        setAsked(askedSoFar + 1);
      } else {
        setResults(data.results || []);
        setNote(data.collect && (data.results || []).length ? '' : data.note || '');
        setFilters(data.filters || null);
        setSummary(data.filters?.summary || msgs[0]?.content || '');
        // They asked to create a sandbox trip from these trips: open the confirmation
        if (data.collect && (data.results || []).length) openCollect(data.collect.title, data.collect.kinds, data.results, data.collect.cities, data.collect.areas);
        else setCollectOpen(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const start = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const msgs: Msg[] = [{ role: 'user', content: t }];
    setMessages(msgs);
    setResults(null);
    setAsked(0);
    setInput('');
    onTyping?.(''); // a full request shouldn't filter the list below
    send(msgs, 0);
  };

  const answer = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const msgs: Msg[] = [...messages, { role: 'user', content: t }];
    setMessages(msgs);
    setInput('');
    send(msgs, asked);
  };

  const reset = () => {
    setMessages([]);
    setAsked(0);
    setQuestion(null);
    setResults(null);
    setNote('');
    setError('');
    setInput('');
    setCollectOpen(false);
    setCollected(null);
  };

  /** Create a planned trip in the sandbox and open "Fill with AI" with this conversation. */
  const startPlanning = async () => {
    let user: { id: string } | null = null;
    try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch {}
    const brief = messages.filter((m) => m.role === 'user').map((m) => m.content).join('. ');
    if (!user?.id) {
      router.push(`/login?next=${encodeURIComponent('/trips')}`);
      return;
    }
    setStarting(true);
    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: (summary || brief || 'My next trip').slice(0, 80),
          region: filters?.region || undefined,
          tripType: Array.isArray(filters?.tripTypes) ? filters.tripTypes[0] : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.trip) throw new Error(data.error || 'Couldn’t start the plan.');
      router.push(`/sandbox?trip=${data.trip.id}&fill=1&ask=${encodeURIComponent(brief.slice(0, 600))}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t start the plan.');
      setStarting(false);
    }
  };

  const conversation = messages.length > 0;

  return (
    <div className="bg-white/85 backdrop-blur-sm rounded-2xl border border-[#E4DED4] shadow-sm p-5 sm:p-6 mb-8">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-xl font-semibold text-[#2F4A5C] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#4A6878]" /> Find a trip for you
        </h2>
        {conversation && (
          <button type="button" onClick={reset} className="text-sm text-[#5B6B75] hover:text-[#2F4A5C] inline-flex items-center">
            <RotateCcw className="w-4 h-4 mr-1" /> Start over
          </button>
        )}
      </div>

      {/* Conversation so far */}
      {conversation && (
        <div className="space-y-2 mb-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <p
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                  m.role === 'user' ? 'bg-[#4A6878] text-white rounded-br-sm' : 'bg-[#F3F7F8] text-[#2F4A5C] border border-[#C9D9DF] rounded-bl-sm'
                }`}
              >
                {m.content}
              </p>
            </div>
          ))}
          {busy && (
            <p className="text-sm text-[#6B7A83] flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {results === null && asked < 3 ? 'Thinking…' : 'Looking through the trips…'}
            </p>
          )}
        </div>
      )}

      {/* Follow-up question choices */}
      {question && !busy && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {question.options.map((o) => {
              const on = picked.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => (question.multi ? setPicked((p) => (on ? p.filter((x) => x !== o) : [...p, o])) : answer(o))}
                  className={`px-3 py-1.5 rounded-full border text-sm ${
                    on ? 'bg-[#4A6878] border-[#4A6878] text-white' : 'bg-white border-[#C9D9DF] text-[#2F4A5C] hover:bg-[#E3ECEF]'
                  }`}
                >
                  {o}
                </button>
              );
            })}
            {question.multi && picked.length > 0 && (
              <button type="button" onClick={() => answer(picked.join(', '))} className="px-3 py-1.5 rounded-full bg-[#2F4A5C] text-white text-sm">
                Continue →
              </button>
            )}
            <button type="button" onClick={() => answer('No preference — show me trips')} className="px-3 py-1.5 rounded-full text-sm text-[#5B6B75] underline">
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      {(results === null || !conversation) && !busy && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            conversation ? answer(input) : start(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (!conversation) onTyping?.(e.target.value); // filter the trips below as you type
            }}
            placeholder={conversation ? 'Or type your own answer…' : 'Search trips, or ask: “Japan with my family, two weeks”'}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#4A6878] focus:border-transparent"
          />
          <button type="submit" disabled={!input.trim()} className="px-4 py-3 bg-[#4A6878] text-white rounded-lg hover:bg-[#3F5B6A] disabled:opacity-50" aria-label="Send">
            <Send className="w-5 h-5" />
          </button>
        </form>
      )}
      {!conversation && (
        <p className="mt-2 text-xs text-[#6B7A83]">
          Typing filters the trips below. Press <b>Enter</b> to ask the AI — it can ask a few questions, explain its picks, or build a sandbox trip.
        </p>
      )}
      {!conversation && children && <div className="mt-3">{children}</div>}
      {!conversation && (
        <div className="flex flex-wrap gap-2 mt-3">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => start(ex)} className="px-3 py-1.5 rounded-full border border-[#D9D2C7] bg-white text-sm text-[#2F4A5C] hover:bg-[#FBF9F5]">
              {ex}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {/* Results */}
      {results !== null && !busy && (
        <div className="mt-2">
          {note && <p className="text-sm text-[#5B6B75] mb-3">{note}</p>}
          {results.length > 0 && !collectOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {results.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-[#E4DED4] overflow-hidden flex flex-col">
                  {r.coverImageUrl && <img src={r.coverImageUrl} alt="" loading="lazy" className="w-full h-32 object-cover" />}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-[#2F4A5C]">{r.title}</p>
                      {!r.exact && <span className="shrink-0 text-xs bg-[#F3EBDD] text-[#8A6D3B] px-2 py-0.5 rounded-full">Similar</span>}
                    </div>
                    <p className="text-xs text-[#6B7A83] mt-0.5 flex flex-wrap gap-x-3">
                      {r.tripType && <span>{tripTypeIcon(r.tripType)} {r.tripType}</span>}
                      {r.cities.length > 0 && <span className="inline-flex items-center"><MapPin className="w-3 h-3 mr-0.5" />{r.cities.slice(0, 4).join(', ')}</span>}
                      {r.days > 0 && <span className="inline-flex items-center"><Calendar className="w-3 h-3 mr-0.5" />{r.days} days</span>}
                      {r.userName && <span>by {r.userName}</span>}
                    </p>
                    <p className="text-sm text-[#4A5A63] mt-2 flex-1">{r.reason}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Link href={`/trips/${r.id}`} className="inline-flex items-center px-3 py-1.5 bg-[#4A6878] text-white rounded-lg hover:bg-[#3F5B6A] text-sm">
                        Open trip <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                      {r.places.length > 0 && <SaveToSandbox places={r.places} label="Save its ideas" variant="pill" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Create a planned trip from these trips */}
          {collectOpen && results.length > 0 && (
            <div className="rounded-xl bg-white border-2 border-[#4A6878] p-4 mb-4">
              {collected ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-[#2F4A5C]">
                    <Check className="inline w-5 h-5 text-green-600 mr-1" />
                    Added <b>{collected.saved}</b> {collected.saved === 1 ? 'place' : 'places'} to <b>{collected.title}</b> in your sandbox.
                  </p>
                  <Link href="/sandbox" className="inline-flex items-center px-4 py-2 bg-[#4A6878] text-white rounded-lg hover:bg-[#3F5B6A] text-sm font-medium">
                    <Package className="w-4 h-4 mr-1" /> Open my sandbox
                  </Link>
                </div>
              ) : (
                <>
                  <p className="font-semibold text-[#2F4A5C] mb-3 flex items-center gap-2"><Package className="w-5 h-5" /> Create a planned trip from these trips</p>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <input
                    value={collectTitle}
                    onChange={(e) => setCollectTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 mb-3"
                  />
                  <p className="text-xs font-medium text-gray-700 mb-1">Include</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[['hotel', '🏨 Where to stay'], ['activity', '🎯 Things to do'], ['restaurant', '🍽️ Where to eat']].map(([k, label]) => {
                      const on = collectKinds.includes(k);
                      return (
                        <button key={k} type="button" onClick={() => setCollectKinds((p) => (on ? p.filter((x) => x !== k) : [...p, k]))}
                          className={`px-3 py-1.5 rounded-full border text-sm ${on ? 'bg-[#4A6878] border-[#4A6878] text-white' : 'bg-white border-[#C9D9DF] text-[#2F4A5C]'}`}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {collectAreas.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-gray-700">Only in</span>
                      {collectAreas.map((a) => (
                        <button key={a} type="button" onClick={() => setCollectAreas((p) => p.filter((x) => x !== a))}
                          className="px-3 py-1.5 rounded-full border text-sm bg-[#4A6878] border-[#4A6878] text-white" title="Remove">
                          📍 {a} ✕
                        </button>
                      ))}
                    </div>
                  )}
                  {cityOptions(results).length > 1 && (
                    <>
                      <p className="text-xs font-medium text-gray-700 mb-1">Cities</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <button type="button" onClick={() => setCollectCities([])}
                          className={`px-3 py-1.5 rounded-full border text-sm ${collectCities.length === 0 ? 'bg-[#4A6878] border-[#4A6878] text-white' : 'bg-white border-[#C9D9DF] text-[#2F4A5C]'}`}>
                          All cities
                        </button>
                        {cityOptions(results).map((c) => {
                          const on = collectCities.includes(c);
                          return (
                            <button key={c} type="button" onClick={() => setCollectCities((p) => (on ? p.filter((x) => x !== c) : [...p, c]))}
                              className={`px-3 py-1.5 rounded-full border text-sm ${on ? 'bg-[#4A6878] border-[#4A6878] text-white' : 'bg-white border-[#C9D9DF] text-[#2F4A5C]'}`}>
                              {c}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                  {results.length > 1 && (
                    <details className="mb-3">
                      <summary className="text-xs text-[#5B6B75] underline cursor-pointer select-none">
                        From {collectTrips.length} of {results.length} trips · change
                      </summary>
                      <div className="mt-2">
                  <div className="space-y-1 mb-1">
                    {results.map((r) => (
                      <label key={r.id} className="flex items-center gap-2 text-sm text-[#2F4A5C]">
                        <input type="checkbox" checked={collectTrips.includes(r.id)} onChange={() => setCollectTrips((p) => (p.includes(r.id) ? p.filter((x) => x !== r.id) : [...p, r.id]))} />
                        {r.title}{r.userName ? ` (${r.userName})` : ''}{!r.exact && <span className="text-xs text-[#8A6D3B]">· similar</span>}
                      </label>
                    ))}
                  </div>
                      </div>
                    </details>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={createAndAdd} disabled={collecting}
                      className="inline-flex items-center px-4 py-2 bg-[#2F4A5C] text-white rounded-lg hover:bg-[#24394A] text-sm font-medium disabled:opacity-60">
                      {collecting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                      Create &amp; add {collectPlaces(results).length} places
                    </button>
                    <button type="button" onClick={() => setCollectOpen(false)} className="px-3 py-2 text-sm text-[#5B6B75] underline">Cancel</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* What next? */}
          {!collectOpen && <div className="rounded-xl bg-[#F3F7F8] border border-[#C9D9DF] p-4">
            <p className="text-sm font-medium text-[#2F4A5C] mb-3">Planning a trip like this? Put it in your sandbox:</p>
            <div className="flex flex-col sm:flex-row gap-2">
              {results.length > 0 && !collectOpen && (
                <button type="button" onClick={() => openCollect(summary || 'My next trip', undefined, results)}
                  className="inline-flex items-center justify-center px-4 py-2 bg-white border border-[#C9D9DF] text-[#2F4A5C] rounded-lg hover:bg-[#E3ECEF] text-sm font-medium">
                  <Package className="w-4 h-4 mr-1" /> Save these trips’ places into a new planned trip
                </button>
              )}
              <button type="button" onClick={startPlanning} disabled={starting}
                className="inline-flex items-center justify-center px-4 py-2 bg-[#2F4A5C] text-white rounded-lg hover:bg-[#24394A] text-sm font-medium disabled:opacity-60">
                {starting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />} Let AI plan it day by day
              </button>
            </div>
          </div>}
        </div>
      )}
    </div>
  );
}
