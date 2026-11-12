import Link from 'next/link';
import TourButton from '@/components/TourButton';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'How to use · Share and Plan',
  description: 'A quick guide to adding your trips, importing your notes, browsing other travelers’ trips and planning in your Travel Sandbox.',
};

type Step = { title: string; body: ReactNode };
type Section = { id: string; icon: string; title: string; intro: string; steps: Step[]; tip?: ReactNode };

const SECTIONS: Section[] = [
  {
    id: 'start',
    icon: '👋',
    title: 'Getting started',
    intro: 'A free account lets you save trips, collect ideas and share with other travelers.',
    steps: [
      { title: 'Create an account', body: <>Tap <b>Menu → Create an account</b> and enter your name, email and a password.</> },
      { title: 'Find your way around', body: <>The <b>Menu</b> at the top right has everything. The <b>📦 sandbox icon</b> next to it shows how many places you’ve saved.</> },
      { title: 'Your account page', body: <>After signing in you land on <b>My account & trips</b>: buttons to add or import a trip, and a list of all your trips (drafts, private and shared).</> },
    ],
  },
  {
    id: 'add',
    icon: '🧳',
    title: 'Add a trip',
    intro: 'Record a trip day by day — where you stayed, ate and what you did. Save it as a draft any time and come back to it.',
    steps: [
      { title: 'Trip information', body: <>Choose the <b>Region</b> and <b>Type of trip</b> (couple, family, multi-generational…) and your <b>dates</b>. The number of days is worked out for you, and the trip is named automatically from its countries and cities.</> },
      { title: 'Flights', body: <>Under <b>Getting there</b> and <b>Getting home</b>, add one line per flight — e.g. YYZ → JFK, then JFK → ATH — and pick the airline from the list.</> },
      { title: 'Countries and cities', body: <>Pick a country, then <b>Add a city</b> with how many days you spent there. Add more cities, or another country.</> },
      { title: 'How you got to each city', body: <>In each city, choose ✈️ flight, 🚗 car, ⛴️ boat, 🚆 train or 🚌 bus and add the details.</> },
      { title: 'Where you stayed', body: <>Tap <b>Add hotel or rental</b>. For a hotel, start typing its name and pick it from the list. For an Airbnb or VRBO, choose <b>Rental</b> and type a name (pasting the link is optional).</> },
      { title: 'Each day', body: <>Add restaurants and activities to the day you did them. Start typing a name and pick from the suggestions — the address, photo and map link fill in for you. Add your star rating and review.</> },
      { title: 'Cover photo', body: <>In Trip information, tap <b>Choose a cover photo</b> and pick a picture of the country.</> },
      { title: 'Save', body: <><b>Save as draft</b> to finish later (drafts are only visible to you), or <b>Save Trip</b> to share it with everyone.</> },
    ],
    tip: <>Can’t remember a name? Under any hotel, restaurant or activity search, tap <b>✨ Describe it</b> and write what you remember — “the vegetarian place on Parque España” or “across from the Hyatt”. Tap a photo to see it bigger before choosing.</>,
  },
  {
    id: 'import',
    icon: '✨',
    title: 'Import your notes',
    intro: 'Already have your trip in a spreadsheet, a Word document or an email? Let the site fill in the form for you.',
    steps: [
      { title: 'Open the import page', body: <>On your account page tap <b>Import your notes</b> (or <b>Menu → Import your notes</b>).</> },
      { title: 'Upload or paste', body: <>Upload an Excel, CSV or Word file — any layout is fine — or paste your notes into the box. It can take up to a minute for big files.</> },
      { title: 'Check and continue', body: <>You’ll see the cities, days and places it found, plus anything worth checking. Tap <b>Fill in the trip form</b>, review it, and save.</> },
    ],
    tip: <>Nothing is saved until you press Save — so you can always fix anything the reader got wrong.</>,
  },
  {
    id: 'browse',
    icon: '🧭',
    title: 'Browse other travelers’ trips',
    intro: 'See real itineraries day by day, with photos, ratings and honest reviews.',
    steps: [
      { title: 'Find a trip', body: <>Tap <b>Menu → Browse trips</b> and open any trip that catches your eye.</> },
      { title: 'Read it day by day', body: <>Each city shows where they stayed, how they got there, and what they did and ate on each day — with links to Google Maps or Airbnb.</> },
    ],
  },
  {
    id: 'sandbox',
    icon: '📦',
    title: 'Plan with My Travel Sandbox',
    intro: 'Your planning space. Collect ideas from any trip while you plan as many future trips as you like.',
    steps: [
      { title: 'Save what you like', body: <>On any trip, tap <b>＋</b> next to a hotel, restaurant or activity — or <b>Save this day</b> / <b>Save this city</b> to grab a whole itinerary.</> },
      { title: 'Choose which trip it’s for', body: <>Pick one of your planned trips, start a new one (e.g. “Greece 2027”), or put it in <b>Unsorted</b> to decide later.</> },
      { title: 'Organise your plan', body: <>Open the 📦 sandbox. Each planned trip groups its places by country and city. Add your own notes, put places on days, or move them to another trip.</> },
      { title: 'Turn it into a trip', body: <>When you’re ready, tap <b>Turn into a trip</b>. Everything is filled into a new draft trip — after you travel, add your own ratings and reviews and share it.</> },
    ],
    tip: <>Each saved place keeps the original traveler’s rating and review, and a link back to their trip.</>,
  },
  {
    id: 'manage',
    icon: '🔒',
    title: 'Drafts, private and shared trips',
    intro: 'You decide who sees each trip.',
    steps: [
      { title: 'Draft', body: <>Still working on it. Only you can see it. Open it from <b>My trips</b> to keep adding.</> },
      { title: 'Private', body: <>Finished, but just for you.</> },
      { title: 'Shared', body: <>Visible to everyone on Browse trips, so others can learn from it and save ideas into their own sandbox.</> },
    ],
  },
];

export default function HowToPage() {
  return (
    <div className="min-h-screen bg-[#F6F2EC] pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <p className="text-sm font-medium uppercase tracking-wide text-[#6B7A83] mb-3">How to use</p>
        <h1 className="text-3xl sm:text-5xl font-semibold text-[#2F4A5C] leading-tight mb-4">Share your trips. Plan your next one.</h1>
        <p className="text-lg text-[#4A5A63] mb-5">A quick guide to everything on Share and Plan.</p>
        <TourButton className="mb-8" />
        <p className="text-sm text-[#5B6B75] mb-3">Or jump to what you need:</p>

        {/* Contents */}
        <nav aria-label="Contents" className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-12">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex items-center gap-2 px-3 py-2.5 bg-white border border-[#E4DED4] rounded-lg text-[#2F4A5C] hover:bg-[#FBF9F5] text-sm font-medium"
            >
              <span className="text-lg">{s.icon}</span> {s.title}
            </a>
          ))}
        </nav>

        <div className="space-y-10">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 bg-white rounded-2xl border border-[#E4DED4] p-6 sm:p-8">
              <h2 className="text-2xl font-semibold text-[#2F4A5C] flex items-center gap-2 mb-1">
                <span>{s.icon}</span> {s.title}
              </h2>
              <p className="text-[#5B6B75] mb-6">{s.intro}</p>
              <ol className="space-y-4">
                {s.steps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="shrink-0 w-8 h-8 rounded-full bg-[#E3ECEF] text-[#3F5B6A] font-semibold flex items-center justify-center">{i + 1}</span>
                    <div>
                      <p className="font-medium text-[#2F4A5C]">{step.title}</p>
                      <p className="text-[#4A5A63] text-sm sm:text-base leading-relaxed">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {s.tip && (
                <p className="mt-6 text-sm text-[#3F5B6A] bg-[#F3F7F8] border border-[#C9D9DF] rounded-lg px-4 py-3">
                  <span className="font-semibold">Tip: </span>
                  {s.tip}
                </p>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-xl font-medium text-[#2F4A5C] mb-4">Ready?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/trips/new" className="px-6 py-3 bg-[#4A6878] text-white rounded-lg hover:bg-[#3F5B6A] font-medium">Add your trip</Link>
            <Link href="/trips" className="px-6 py-3 bg-white border border-[#D9D2C7] text-[#2F4A5C] rounded-lg hover:bg-[#FBF9F5] font-medium">Browse trips</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
