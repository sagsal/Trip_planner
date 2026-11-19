'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, FormEvent } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CardTrip, parseList, tripDays } from '@/components/TripCard';
import { startSiteTour } from '@/components/SiteTour';
import { monthYear } from '@/lib/dates';
import { placeFields } from '@/lib/placeDetails';

/* Travel-journal look: warm paper, 1px rules, Newsreader headings, Space Mono metadata */
const SERIF = { fontFamily: 'var(--font-newsreader), Georgia, serif' };
const MONO = { fontFamily: 'var(--font-space-mono), ui-monospace, monospace' };
const ACCENT = '#1F6F78';
const HATCH = { background: 'repeating-linear-gradient(135deg, #EFEBE3 0 1px, #F6F3EC 1px 12px)' };

const STEPS = [
  { n: '01', title: 'Share your trip', text: 'Add your cities, hotels, restaurants and activities for each day. Or import your notes and let AI fill it in.' },
  { n: '02', title: 'Find trips like yours', text: 'Ask in plain words, like “a family week in Mexico”, and see real itineraries that fit.' },
  { n: '03', title: 'Plan in your Sandbox', text: 'Save the places you like into planned trips, and let AI arrange them day by day.' },
  { n: '04', title: 'Ask for advice', text: 'Planning a trip? Ask members who’ve been there. They tell you if it’s too many days, which hotel to swap, or what not to miss, and you accept the best ideas with one tap.' },
];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

type AskCard = { id: string; title: string; ask: string | null; countries: string[]; cities: string[]; commentCount: number; matched: string[] };

/** "Members are asking": the Advice section, right under the hero */
function AdviceBand({ asking }: { asking: { signedIn: boolean; list: AskCard[]; openCount: number } }) {
  const BTN = 'inline-flex items-center justify-center min-h-[48px] px-5 font-mono text-xs tracking-[0.1em]';
  return (
    <section className="border-b border-[#E2DDD5] bg-white">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-12 sm:py-14 flex flex-wrap gap-x-12 gap-y-8 items-start">
        <div className="flex-[1_1_300px] min-w-0 flex flex-col gap-4">
          <p style={{ ...MONO, color: ACCENT }} className="text-xs tracking-[0.14em]">ADVICE</p>
          <h2 style={SERIF} className="font-normal text-[36px] sm:text-[44px] leading-[1.05] tracking-[-0.015em]">Ask someone who’s been there</h2>
          <p className="text-base leading-relaxed text-[#3A4A54] max-w-md">
            Planning a trip? Members who’ve been to the same places tell you if it’s too many days, which hotel they’d pick, and what not to miss.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {asking.signedIn ? (
              <>
                <Link href="/sandbox" style={MONO} className={`${BTN} bg-[#13212B] text-[#F8F6F1] hover:bg-[#24394A]`}>ASK ABOUT YOUR TRIP</Link>
                <Link href="/feedback" style={MONO} className={`${BTN} border border-[#13212B] hover:bg-[#13212B] hover:text-[#F8F6F1]`}>GIVE ADVICE</Link>
              </>
            ) : (
              <>
                <Link href="/register" style={MONO} className={`${BTN} bg-[#13212B] text-[#F8F6F1] hover:bg-[#24394A]`}>JOIN TO ASK</Link>
                <Link href="/login?next=/feedback" style={MONO} className={`${BTN} border border-[#13212B] hover:bg-[#13212B] hover:text-[#F8F6F1]`}>SIGN IN</Link>
              </>
            )}
          </div>
        </div>

        <div className="flex-[2_1_520px] min-w-0">
          <div className="flex justify-between items-baseline gap-3 pb-3 border-b border-[#13212B]">
            <span style={MONO} className="text-[11px] tracking-[0.14em] text-[#5B6A73]">MEMBERS ARE ASKING</span>
            {asking.signedIn && asking.openCount > asking.list.length && (
              <Link href="/feedback" style={{ ...MONO, color: ACCENT }} className="text-xs tracking-[0.1em] py-1">ALL {asking.openCount} →</Link>
            )}
          </div>
          {asking.signedIn && asking.list.length > 0 ? (
            asking.list.map((a) => (
              <Link key={a.id} href={`/feedback/${a.id}`} className="group flex flex-wrap gap-x-6 gap-y-2 py-5 border-b border-[#E2DDD5] items-start">
                <div className="flex-[1_1_300px] min-w-0 flex flex-col gap-1.5">
                  <span style={MONO} className="text-[11px] tracking-[0.1em] text-[#5B6A73] uppercase">
                    {[a.countries.slice(0, 2).join(', '), a.commentCount ? plural(a.commentCount, 'reply', 'replies') : 'No replies yet'].filter(Boolean).join(' · ')}
                  </span>
                  <span style={SERIF} className="text-[24px] leading-tight group-hover:text-[#1F6F78]">{a.title}</span>
                  {a.ask && <span style={SERIF} className="italic text-[17px] text-[#3A4A54] line-clamp-2">“{a.ask}”</span>}
                </div>
                {a.matched.length > 0 ? (
                  <span style={MONO} className="text-[11px] tracking-[0.08em] uppercase px-2.5 py-1.5 bg-[#1F6F78] text-white">You’ve been to {a.matched.slice(0, 2).join(' & ')}</span>
                ) : (
                  <span style={{ ...MONO, color: ACCENT }} className="text-xs tracking-[0.08em] pt-1">HELP →</span>
                )}
              </Link>
            ))
          ) : (
            <div className="py-6 flex flex-col gap-3">
              <p style={SERIF} className="italic text-[22px] text-[#3A4A54]">
                {asking.signedIn ? 'No one is asking right now. Be the first.' : '“Is 4 days in Bogotá too many?” “Where should we stay in Cartagena?”'}
              </p>
              <p className="text-[15px] text-[#5B6A73]">
                {asking.signedIn
                  ? 'Open a planned trip in your Sandbox and tap Ask for advice. Members who’ve been there are told about it.'
                  : 'Members ask questions like these about the trips they’re planning, and members who’ve been there answer. Requests are visible to signed-in members.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function tripMeta(t: CardTrip) {
  const country = parseList(t.countries)[0] || t.region || '';
  const days = tripDays(t);
  return [country, days ? plural(days, 'day', 'days') : '', monthYear(t.startDate)].filter(Boolean).join(' · ').toUpperCase();
}

function TripRow({ t }: { t: CardTrip }) {
  const route = (t.cities_data || []).map((c) => c.name).join(' → ');
  return (
    <Link href={`/trips/${t.id}`} className="group flex flex-wrap gap-x-7 gap-y-4 py-6 border-b border-[#E2DDD5] items-start">
      <div className="relative w-[148px] h-[104px] shrink-0 border border-[#E2DDD5] overflow-hidden" style={HATCH}>
        {t.coverImageUrl && (
          <img src={t.coverImageUrl} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
      </div>
      <div className="flex-[1_1_280px] min-w-0 flex flex-col gap-2">
        {tripMeta(t) && <span style={MONO} className="text-[11px] tracking-[0.12em] text-[#5B6A73]">{tripMeta(t)}</span>}
        <span style={SERIF} className="text-[26px] sm:text-[30px] leading-[1.15] group-hover:text-[#1F6F78]">{t.title}</span>
        {route && <span style={MONO} className="text-[13px] text-[#13212B] uppercase">{route}</span>}
      </div>
      <span style={{ ...MONO, color: ACCENT }} className="text-xs tracking-[0.08em] pt-1">READ →</span>
    </Link>
  );
}

/** A real page from the newest shared trip: its first city's stays, meals and things to do */
function SamplePage({ t }: { t: CardTrip }) {
  const city = (t.cities_data || []).find((c) => c.hotels.length + c.restaurants.length + c.activities.length > 0);
  if (!city) return null;
  const rows = [
    ...city.hotels.slice(0, 1).map((p: any) => ({ kind: 'STAY', p })),
    ...city.activities.slice(0, 3).map((p: any) => ({ kind: 'DO', p })),
    ...city.restaurants.slice(0, 3).map((p: any) => ({ kind: 'EAT', p })),
  ].slice(0, 6);
  const days = city.numberOfDays;
  return (
    <aside aria-label="A page from a shared trip" className="flex-[2_1_340px] min-w-0 border border-[#E2DDD5] bg-white">
      <div style={MONO} className="px-5 py-4 border-b border-[#E2DDD5] flex justify-between gap-3 text-[11px] tracking-[0.12em] text-[#5B6A73]">
        <span>FROM A SHARED TRIP</span>
        {days ? <span>{plural(days, 'DAY', 'DAYS')}</span> : null}
      </div>
      <div className="px-5 pt-5 pb-1">
        <h3 style={SERIF} className="text-[30px] font-medium leading-tight">{city.name}</h3>
        <p style={MONO} className="text-xs text-[#5B6A73] uppercase mt-1">{[city.country, t.title].filter(Boolean).join(' · ')}</p>
      </div>
      <ol className="px-5 pt-2 pb-3">
        {rows.map(({ kind, p }, i) => {
          const img = placeFields(p).imageUrl;
          return (
            <li key={i} className="flex gap-4 py-3.5 border-b border-[#EFEBE3] last:border-b-0">
              <span style={{ ...MONO, color: ACCENT }} className="w-12 shrink-0 text-[13px] pt-0.5">{kind}</span>
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <span style={SERIF} className="text-[19px] leading-snug">{p.name}</span>
                {(p.location || p.rating) && (
                  <span style={MONO} className="text-[11px] tracking-[0.04em] text-[#5B6A73] uppercase truncate">
                    {[p.location, p.rating ? `${p.rating}/5` : ''].filter(Boolean).join(' · ')}
                  </span>
                )}
              </div>
              {img && <img src={img} alt="" loading="lazy" className="w-12 h-12 object-cover border border-[#E2DDD5] shrink-0" />}
            </li>
          );
        })}
      </ol>
      <Link href={`/trips/${t.id}`} style={{ ...MONO, color: ACCENT }} className="block px-5 py-4 border-t border-[#E2DDD5] text-xs tracking-[0.1em] hover:bg-[#F8F6F1]">
        OPEN THE WHOLE TRIP →
      </Link>
    </aside>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [successMessage, setSuccessMessage] = useState('');
  const [q, setQ] = useState('');
  const [trips, setTrips] = useState<CardTrip[] | null>(null);
  const [covers, setCovers] = useState<CardTrip[]>([]);
  const [slide, setSlide] = useState(0);
  const [asking, setAsking] = useState<{ signedIn: boolean; list: AskCard[]; openCount: number } | null>(null);

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) setSuccessMessage(message);
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/trips?public=true&limit=24')
      .then((r) => r.json())
      .then((d) => {
        const shared = (d.trips || []).filter((t: any) => t.isPublic && !t.isDraft && !t.title?.includes('TEMPLATE') && !t.title?.includes('DATABASE:'));
        setTrips(shared.slice(0, 3));
        // Every shared trip's cover photo, for the rotating picture at the top
        const seen = new Set<string>();
        setCovers(shared.filter((t: CardTrip) => t.coverImageUrl && !seen.has(t.coverImageUrl) && seen.add(t.coverImageUrl)));
      })
      .catch(() => setTrips([]));
  }, []);

  // Advice: live requests for members; an invitation for everyone else
  useEffect(() => {
    let signedIn = false;
    try { signedIn = !!localStorage.getItem('user'); } catch {}
    if (!signedIn) { setAsking({ signedIn: false, list: [], openCount: 0 }); return; }
    fetch('/api/advice/summary', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.signedIn) return setAsking({ signedIn: false, list: [], openCount: 0 });
        const seen = new Set<string>();
        const list = [...(d.wanted || []), ...(d.latest || [])].filter((x: AskCard) => !seen.has(x.id) && seen.add(x.id)).slice(0, 3);
        setAsking({ signedIn: true, list, openCount: d.openCount || 0 });
      })
      .catch(() => setAsking({ signedIn: false, list: [], openCount: 0 }));
  }, []);

  // Cycle the top picture every few seconds (held still for people who prefer less motion)
  useEffect(() => {
    if (covers.length < 2) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setSlide((i) => (i + 1) % covers.length), 5500);
    return () => clearInterval(id);
  }, [covers.length]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = q.trim();
    router.push(t ? `/trips?ask=${encodeURIComponent(t)}` : '/trips');
  };

  const cover = covers[slide] || null;

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-[#13212B] pt-16">
      {successMessage && (
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-6">
          <div className="border border-[#C3DEDF] bg-[#EEF5F4] text-[#16535A] px-5 py-3">{successMessage}</div>
        </div>
      )}

      {/* Hero */}
      <section className="border-b border-[#E2DDD5]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-10 sm:pt-[72px] pb-14 sm:pb-20 flex flex-wrap gap-10 sm:gap-14 items-stretch">
          <div className="flex-[1_1_480px] min-w-0 flex flex-col gap-6 sm:gap-7">
            <p style={{ ...MONO, color: ACCENT }} className="text-xs tracking-[0.14em]">REAL TRIPS FROM REAL TRAVELERS</p>
            <h1 style={SERIF} className="font-normal text-[44px] sm:text-[60px] lg:text-[76px] leading-[1.02] tracking-[-0.02em]">
              Build your next trip with help from <em className="italic" style={{ color: ACCENT }}>fellow travelers</em>
            </h1>
            <p style={SERIF} className="text-xl sm:text-[22px] leading-normal text-[#3A4A54] max-w-[560px]">
              Share where you stayed, ate and explored, day by day. Then borrow the best of other people’s trips to plan your own.
            </p>
            <form onSubmit={onSubmit} className="mt-1 flex flex-wrap border border-[#13212B] bg-white max-w-[600px]">
              <label htmlFor="home-ask" className="sr-only">Where do you want to go?</label>
              <input
                id="home-ask"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="A family week in Mexico…"
                style={SERIF}
                className="flex-[1_1_240px] min-w-0 border-0 outline-none px-5 py-4 text-xl bg-transparent text-[#13212B] placeholder:text-[#7A858B]"
              />
              <button type="submit" style={MONO}
                className="w-full sm:w-auto min-h-[60px] px-6 bg-[#13212B] hover:bg-[#24394A] text-[#F8F6F1] text-[13px] tracking-[0.1em] inline-flex items-center justify-center gap-2.5 sm:border-l border-[#13212B]">
                FIND TRIPS
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </form>
            <p style={MONO} className="text-xs text-[#5B6A73] tracking-[0.04em]">
              New here?{' '}
              <button type="button" onClick={startSiteTour} style={{ color: ACCENT }} className="underline underline-offset-[3px]">Take the 2-minute guided tour →</button>
            </p>
          </div>

          {/* Photo plate */}
          <figure className="flex-[1_1_380px] min-w-0 m-0 flex flex-col">
            <div className="border border-[#E2DDD5] bg-white p-3.5 pb-0 flex flex-col gap-3.5 flex-grow">
              <div className="relative flex-grow min-h-[260px] sm:min-h-[380px] border border-[#E2DDD5] overflow-hidden" style={HATCH}>
                {covers.length === 0 ? (
                  <img src="/sea-warm.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  covers.map((t, i) => (
                    <img
                      key={t.id}
                      src={t.coverImageUrl!}
                      alt=""
                      loading={i === 0 ? 'eager' : 'lazy'}
                      aria-hidden={i !== slide}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-in-out ${i === slide ? 'opacity-100' : 'opacity-0'}`}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ))
                )}
              </div>
              <figcaption style={MONO} className="flex justify-between gap-3 px-0.5 pb-3.5 text-[11px] tracking-[0.08em] text-[#5B6A73] uppercase">
                {cover ? (
                  <>
                    <Link href={`/trips/${cover.id}`} className="truncate hover:text-[#13212B]">{cover.title}</Link>
                    <span className="shrink-0 flex items-center gap-3">
                      {monthYear(cover.startDate)}
                      {covers.length > 1 && (
                        <span className="hidden sm:inline">{String(slide + 1).padStart(2, '0')} / {String(covers.length).padStart(2, '0')}</span>
                      )}
                    </span>
                  </>
                ) : (
                  <span>Share and Plan</span>
                )}
              </figcaption>
            </div>
          </figure>
        </div>
      </section>

      {asking && <AdviceBand asking={asking} />}

      {/* How it works: a contents page */}
      <section className="border-b border-[#E2DDD5]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-14 sm:py-[72px] flex flex-wrap gap-8 sm:gap-12">
          <div className="flex-[1_1_240px] min-w-0 flex flex-col gap-3.5">
            <p style={MONO} className="text-xs tracking-[0.14em] text-[#5B6A73]">CONTENTS</p>
            <h2 style={SERIF} className="font-normal text-[40px] sm:text-[44px] leading-[1.05] tracking-[-0.015em]">How it works</h2>
          </div>
          <ol className="flex-[3_1_560px] min-w-0 border-t border-[#13212B]">
            {STEPS.map((s) => (
              <li key={s.n} className="flex flex-wrap gap-x-8 gap-y-2 py-6 border-b border-[#E2DDD5]">
                <span style={{ ...MONO, color: ACCENT }} className="w-14 shrink-0 text-[13px] pt-2">{s.n}</span>
                <h3 style={SERIF} className="flex-[1_1_200px] font-medium text-[26px] sm:text-[28px] leading-tight">{s.title}</h3>
                <p className="flex-[2_1_300px] text-base leading-relaxed text-[#3A4A54] pt-1">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Recently shared + a real page from a trip */}
      <section className="border-b border-[#E2DDD5]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-14 sm:py-[72px] flex flex-wrap gap-12 items-start">
          <div className="flex-[3_1_560px] min-w-0">
            <div className="flex flex-wrap justify-between items-baseline gap-3 mb-6">
              <h2 style={SERIF} className="font-normal text-[40px] sm:text-[44px] tracking-[-0.015em]">Recently shared</h2>
              <Link href="/trips" style={{ ...MONO, color: ACCENT }} className="text-xs tracking-[0.1em] py-3">SEE ALL TRIPS →</Link>
            </div>
            <div className="border-t border-[#13212B]">
              {trips === null
                ? [1, 2, 3].map((i) => <div key={i} className="h-[153px] border-b border-[#E2DDD5] animate-pulse bg-[#F2EFE8]" />)
                : trips.map((t) => <TripRow key={t.id} t={t} />)}
              <div className="flex flex-wrap gap-x-7 gap-y-4 py-6 border-b border-dashed border-[#CFC8BC] items-center justify-between">
                <div className="flex flex-col gap-1.5">
                  <span style={SERIF} className="italic text-[26px]">Your trip could be here</span>
                  <span className="text-[15px] text-[#5B6A73]">Share a trip you loved so others can build on it.</span>
                </div>
                <Link href="/trips/new" style={MONO} className="px-5 py-3.5 border border-[#13212B] text-xs tracking-[0.1em] hover:bg-[#13212B] hover:text-[#F8F6F1]">ADD YOUR TRIP</Link>
              </div>
            </div>
          </div>
          {trips && trips[0] && <SamplePage t={trips[0]} />}
        </div>
      </section>

      <footer>
        <div style={MONO} className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-7 pb-10 flex flex-wrap gap-x-7 gap-y-4 justify-between text-xs tracking-[0.06em] text-[#5B6A73]">
          <span>SHARE AND PLAN · TRIPSHARE.ORG</span>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1">
            <Link href="/about" className="py-1.5 hover:text-[#13212B]">About</Link>
            <Link href="/how-to" className="py-1.5 hover:text-[#13212B]">How to use</Link>
            <Link href="/privacy" className="py-1.5 hover:text-[#13212B]">Privacy</Link>
            <Link href="/terms" className="py-1.5 hover:text-[#13212B]">Terms</Link>
            <button type="button" onClick={startSiteTour} className="py-1.5 hover:text-[#13212B]">Take the tour</button>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomeContent />
    </Suspense>
  );
}
