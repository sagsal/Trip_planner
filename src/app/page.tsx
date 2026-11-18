'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import TripCard, { CardTrip } from '@/components/TripCard';
import { startSiteTour } from '@/components/SiteTour';

const STEPS = [
  { n: '1', title: 'Share your trip', text: 'Add your cities, hotels, restaurants and activities for each day. Or import your notes and let AI fill it in.' },
  { n: '2', title: 'Find trips like yours', text: 'Ask in plain words, like “a family week in Mexico”, and see real itineraries that fit.' },
  { n: '3', title: 'Plan in your Sandbox', text: 'Save the places you like into planned trips, and let AI arrange them day by day.' },
  { n: '4', title: 'Get feedback', text: 'Share a planned trip in Help me plan. Members tell you if it’s too many days, which hotel to swap, or what not to miss, and you accept the best ideas with one tap.' },
];

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [successMessage, setSuccessMessage] = useState('');
  const [q, setQ] = useState('');
  const [trips, setTrips] = useState<CardTrip[] | null>(null);

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) setSuccessMessage(message);
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/trips?public=true&limit=6')
      .then((r) => r.json())
      .then((d) =>
        setTrips(
          (d.trips || []).filter((t: any) => t.isPublic && !t.isDraft && !t.title?.includes('TEMPLATE') && !t.title?.includes('DATABASE:')).slice(0, 3)
        )
      )
      .catch(() => setTrips([]));
  }, []);

  const ask = (text: string) => {
    const t = text.trim();
    router.push(t ? `/trips?ask=${encodeURIComponent(t)}` : '/trips');
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(q);
  };

  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#13212B] pt-16">
      {successMessage && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="bg-[#E3F0F0] border border-[#C3DEDF] text-[#16535A] px-5 py-3 rounded-xl">{successMessage}</div>
        </div>
      )}

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 pt-8 sm:pt-16 pb-10 flex flex-wrap gap-8 sm:gap-12 items-center">
        <div className="flex-[1_1_440px] min-w-0 flex flex-col gap-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#1F6F78]">Real trips from real travelers</p>
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold leading-[1.05] tracking-tight">
            Build your next trip with help from fellow travelers
          </h1>
          <p className="text-lg sm:text-[19px] leading-relaxed text-[#4A5963]">
            Share where you stayed, ate and explored, day by day. Then borrow the best of other people’s trips to plan your own.
          </p>
          <form onSubmit={onSubmit} className="flex flex-wrap gap-2.5 bg-white border border-[#E2DCD2] rounded-2xl p-2 shadow-[0_6px_24px_rgba(19,33,43,0.06)]">
            <label htmlFor="home-ask" className="sr-only">Where do you want to go?</label>
            <input
              id="home-ask"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Try: a family week in Mexico"
              className="flex-[1_1_220px] min-w-0 border-0 outline-none text-base px-3.5 py-3 bg-transparent text-[#13212B] placeholder:text-[#8A969D]"
            />
            <button type="submit" className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-[#1F6F78] hover:bg-[#16535A] text-white font-semibold px-5 min-h-[48px]">
              <Search className="w-4 h-4 mr-2" /> Find trips
            </button>
          </form>
        </div>
        <div className="flex-[1_1_400px] min-w-0 grid grid-cols-2 gap-3.5">
          <img src="/sea-warm.jpg" alt="" className="col-span-2 h-44 sm:h-64 w-full object-cover rounded-[20px] bg-[#C9DCDD]" />
          <img src="/sea-side-beach-0e.jpg" alt="" className="h-28 sm:h-44 w-full object-cover rounded-[20px] bg-[#E6D7C3]" />
          <img src="/pexels-bella-white-201200-635279.jpg" alt="" className="h-28 sm:h-44 w-full object-cover rounded-[20px] bg-[#D5DCCB]" />
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 pb-14">
        <h2 className="text-3xl font-extrabold tracking-tight mb-6">How it works</h2>
        <div className="flex flex-wrap gap-5">
          {STEPS.map((s) => (
            <div key={s.n} className="flex-[1_1_230px] min-w-0 bg-white border border-[#ECE7DF] rounded-[20px] p-6 flex flex-col gap-3">
              <span className="w-11 h-11 rounded-xl bg-[#E3F0F0] text-[#1F6F78] flex items-center justify-center font-extrabold">{s.n}</span>
              <h3 className="text-xl font-bold">{s.title}</h3>
              <p className="text-[#4A5963] leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[#4A5963]">
          New here? <button type="button" onClick={startSiteTour} className="font-semibold text-[#1F6F78] underline">Take the 2-minute guided tour</button>.
        </p>
      </section>

      {/* Recently shared */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <h2 className="text-3xl font-extrabold tracking-tight">Recently shared</h2>
          <Link href="/trips" className="inline-flex items-center font-semibold text-[#1F6F78] hover:text-[#16535A]">
            See all trips <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {trips === null
            ? [1, 2, 3].map((i) => <div key={i} className="h-[380px] rounded-[20px] bg-white border border-[#ECE7DF] animate-pulse" />)
            : trips.map((t) => <TripCard key={t.id} t={t} />)}
          {trips !== null && trips.length < 3 && (
            <div className="border-2 border-dashed border-[#DCD5CA] rounded-[20px] flex flex-col items-center justify-center gap-3 p-8 text-center min-h-[320px]">
              <h3 className="text-xl font-bold">Your trip could be here</h3>
              <p className="text-[#5B6A73] max-w-xs">Share a trip you loved so others can build on it.</p>
              <Link href="/trips/new" className="px-5 py-3 rounded-xl bg-[#13212B] text-white font-semibold hover:bg-[#24394A]">Add your trip</Link>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-[#ECE7DF] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-7 flex flex-wrap gap-5 justify-between text-sm text-[#5B6A73]">
          <span>Share and Plan · tripshare.org</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/about" className="hover:text-[#13212B]">About</Link>
            <Link href="/how-to" className="hover:text-[#13212B]">How to use</Link>
            <Link href="/privacy" className="hover:text-[#13212B]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#13212B]">Terms</Link>
            <button type="button" onClick={startSiteTour} className="hover:text-[#13212B]">Take the tour</button>
          </div>
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
