'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, MapPin, ArrowRight } from 'lucide-react';
import { monthYear } from '@/lib/dates';
import { tripTypeIcon } from '@/lib/regions';

interface FeedbackTrip {
  id: string;
  title: string;
  region: string | null;
  tripType: string | null;
  startDate: string | null;
  ask: string | null;
  cities: string[];
  countries: string[];
  photo: string | null;
  placeCount: number;
  commentCount: number;
  mine: boolean;
}

export default function HelpMePlanPage() {
  const [trips, setTrips] = useState<FeedbackTrip[] | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);

  useEffect(() => {
    fetch('/api/feedback', { cache: 'no-store' })
      .then(async (r) => {
        if (r.status === 401) { setNeedsSignIn(true); setTrips([]); return; }
        const d = await r.json();
        setTrips(d.trips || []);
      })
      .catch(() => setTrips([]));
  }, []);

  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#13212B] pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Help me plan</h1>
        <p className="text-[#4A5963] max-w-2xl mb-6">
          Trips members are planning right now. Share what you know: too many days somewhere, a hotel you’d skip, or the place they shouldn’t miss.
        </p>

        <div className="mb-8 rounded-2xl bg-[#F1F6F6] border border-[#D4E5E6] p-4 sm:p-5 text-sm text-[#16535A] flex flex-wrap items-center justify-between gap-3">
          <span>Planning a trip yourself? Open it in your Sandbox and press <b>Ask for feedback</b>.</span>
          <Link href="/sandbox" className="inline-flex items-center font-semibold text-[#1F6F78] hover:text-[#16535A]">
            Go to my Sandbox <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {needsSignIn ? (
          <div className="text-center py-14 bg-white border border-[#ECE7DF] rounded-[20px]">
            <h2 className="text-lg font-bold mb-2">Sign in to see and help with members’ trips</h2>
            <p className="text-[#5B6A73] mb-6">Help me plan is for members only.</p>
            <Link href="/login?next=/feedback" className="inline-flex items-center px-6 py-3 bg-[#13212B] text-white rounded-xl font-semibold hover:bg-[#24394A]">Sign in</Link>
          </div>
        ) : trips === null ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => <div key={i} className="h-[320px] rounded-[20px] bg-white border border-[#ECE7DF] animate-pulse" />)}
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-14 bg-white border border-[#ECE7DF] rounded-[20px]">
            <MessageCircle className="w-12 h-12 text-[#C9D2D6] mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">No trips are asking for advice yet</h2>
            <p className="text-[#5B6A73]">Be the first: open a planned trip in your Sandbox and press “Ask for feedback”.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map((t) => (
              <Link key={t.id} href={`/feedback/${t.id}`} className="bg-white border border-[#ECE7DF] rounded-[20px] overflow-hidden flex flex-col hover:shadow-[0_8px_28px_rgba(19,33,43,0.08)] transition-shadow">
                <div className="relative h-40 bg-[#E6DED2]">
                  {t.photo && <img src={t.photo} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    {t.mine && <span className="bg-[#13212B] text-white rounded-full px-3 py-1 text-xs font-semibold">Your trip</span>}
                    {t.tripType && <span className="bg-white rounded-full px-3 py-1 text-xs font-semibold">{tripTypeIcon(t.tripType)} {t.tripType}</span>}
                  </div>
                </div>
                <div className="p-5 flex flex-col gap-2 flex-1">
                  <h2 className="text-xl font-bold line-clamp-2">{t.title}</h2>
                  <p className="text-sm text-[#5B6A73]">
                    {[monthYear(t.startDate), t.countries.join(', ') || t.region].filter(Boolean).join(' · ')}
                  </p>
                  {t.cities.length > 0 && (
                    <p className="flex items-start gap-1.5 text-sm text-[#2A3A44]">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#8A969D]" />
                      <span className="line-clamp-2">{t.cities.join(' · ')}</span>
                    </p>
                  )}
                  {t.ask && <p className="text-sm text-[#4A5963] italic line-clamp-3">“{t.ask}”</p>}
                  <div className="mt-auto pt-2 flex items-center justify-between text-sm">
                    <span className="text-[#5B6A73]">{t.placeCount} places planned</span>
                    <span className="inline-flex items-center font-semibold text-[#1F6F78]">
                      <MessageCircle className="w-4 h-4 mr-1" /> {t.commentCount} {t.commentCount === 1 ? 'comment' : 'comments'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
