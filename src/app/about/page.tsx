import Link from 'next/link';
import { Compass, PlusCircle } from 'lucide-react';

export const metadata = {
  title: 'About · Share and Plan',
  description: 'Share the details of your trips with fellow travelers, and build new trips from their itineraries.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F6F2EC] pt-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <p className="text-sm font-medium uppercase tracking-wide text-[#6B7A83] mb-3">About Share and Plan</p>
        <h1 className="text-3xl sm:text-5xl font-semibold text-[#2F4A5C] leading-tight mb-6">
          Travel is better when it’s shared.
        </h1>
        <p className="text-lg text-[#4A5A63] leading-relaxed mb-12">
          Share and Plan is a place to record your trips day by day — where you stayed, where you ate, what you did and
          how you got around — and share them with fellow travelers.
        </p>

        <div className="space-y-6 mb-12">
          <section className="bg-white rounded-xl border border-[#E4DED4] p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-[#2F4A5C] mb-2">Share your trips</h2>
            <p className="text-[#4A5A63] leading-relaxed">
              Add each country and city you visited, your hotel or rental, the restaurants and activities for each day,
              your flights, and your own ratings and reviews. Keep a trip private, or share it so others can learn from it.
            </p>
          </section>

          <section className="bg-white rounded-xl border border-[#E4DED4] p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-[#2F4A5C] mb-2">Plan your next one</h2>
            <p className="text-[#4A5A63] leading-relaxed">
              Browse trips from travelers like you — a couple’s getaway, a family holiday, a multi-generational
              adventure — and use their real itineraries as the starting point for your own: the places they loved, the
              ones they’d skip, and the tips you won’t find in a guidebook.
            </p>
          </section>
        </div>

        <p className="text-[#4A5A63] mb-10">
          New here? See <Link href="/how-to" className="underline text-[#2F4A5C] hover:text-[#3F5B6A]">how to use Share and Plan</Link>.
        </p>

        <p className="text-xl font-medium text-[#2F4A5C] mb-6">Real trips, from real travelers.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/trips"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#4A6878] text-white rounded-lg hover:bg-[#3F5B6A] transition-colors font-medium"
          >
            <Compass className="w-5 h-5 mr-2" /> Browse trips
          </Link>
          <Link
            href="/trips/new"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#2F4A5C] border border-[#D9D2C7] rounded-lg hover:bg-[#FBF9F5] transition-colors font-medium"
          >
            <PlusCircle className="w-5 h-5 mr-2" /> Add your trip
          </Link>
        </div>
      </div>
    </div>
  );
}
