import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'For travel bloggers: share your itineraries · tripshare',
  description: 'Share an itinerary you’ve already written in about 5 minutes, with your name and a link back to your blog. Free, no ads.',
  alternates: { canonical: 'https://tripshare.org/creators' },
  openGraph: { title: 'For travel bloggers · tripshare', images: [{ url: 'https://tripshare.org/outreach/trip-review.jpg' }] },
};

const GETS = [
  { n: '01', title: 'Your name and a link to your blog', text: 'Every trip you share can show your name and link back to your blog or Instagram, so readers who like your trip can read the full story.' },
  { n: '02', title: 'Founding contributor', text: 'The first 50 members to share a trip carry a Founding contributor mark on their trips, for good.' },
  { n: '03', title: 'Found by people planning', text: 'Your places appear on country pages built for search, and members save them into the trips they are planning.' },
  { n: '04', title: 'You hear when it helps', text: 'Once a month we tell you how many people saved places from your trips.' },
];

const STEPS = [
  { n: '01', title: 'Paste what you’ve already written', text: 'A post, your notes or an old itinerary email. AI turns it into a day-by-day trip: cities, stays, restaurants, things to do.' },
  { n: '02', title: 'Check it and add your verdicts', text: 'Fix anything, add a rating, and say what you loved and what you’d skip. That honesty is what members come for.' },
  { n: '03', title: 'Turn on credit', text: 'On your dashboard, choose the name to show and the link to your blog. It’s off by default, so it’s your call.' },
];

const FAQ = [
  { q: 'Will this compete with my blog?', a: 'Share the itinerary (the days, the places and your quick verdicts), not your whole article. Your link sends readers to the full post.' },
  { q: 'What does it cost?', a: 'Nothing. There are no ads and no paywall, and we never sell your information.' },
  { q: 'Who owns what I post?', a: 'You do. Edit or delete your trips any time. See our Terms of Use and Privacy Policy.' },
  { q: 'How big is the site?', a: 'Small and new. We’re inviting a first group of bloggers to help shape it, which is why the founding contributor mark exists.' },
];

const MONO = 'font-mono text-xs tracking-[0.14em]';

export default function CreatorsPage() {
  return (
    <div className="min-h-screen bg-[#F8F6F1] text-[#13212B] pt-16">
      {/* Hero */}
      <section className="border-b border-[#E2DDD5]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-10 sm:pt-16 pb-12 sm:pb-16">
          <p className={`${MONO} text-[#1F6F78] mb-4`}>FOR TRAVEL BLOGGERS</p>
          <h1 className="font-normal text-[42px] sm:text-[64px] leading-[1.02] tracking-[-0.02em] max-w-4xl">Your best itineraries, helping people plan, with your name on them</h1>
          <p className="font-serif text-xl sm:text-[22px] text-[#3A4A54] max-w-2xl mt-5">
            tripshare is a free, ad-free site where travellers share real day-by-day trips, including what they’d skip. Share a trip you’ve already written about in about five minutes, with a link back to your blog.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/register?next=/trips/import" className="inline-flex items-center min-h-[52px] px-6 bg-[#13212B] text-[#F8F6F1] font-mono text-xs tracking-[0.1em] hover:bg-[#24394A]">SHARE YOUR FIRST TRIP</Link>
            <Link href="/destinations" className="inline-flex items-center min-h-[52px] px-6 border border-[#13212B] font-mono text-xs tracking-[0.1em] hover:bg-[#13212B] hover:text-[#F8F6F1]">SEE THE TRIPS</Link>
          </div>
          <figure className="mt-10 border border-[#E2DDD5] bg-white p-2.5 sm:p-3.5">
            <img src="/outreach/trip-review.jpg" alt="A shared trip on tripshare: where the family stayed, their honest review and photo" className="w-full h-auto border border-[#E2DDD5]" />
            <figcaption className="font-mono text-[11px] tracking-[0.08em] text-[#5B6A73] uppercase pt-3 pb-0.5">A real trip on the site: stays, days and the traveller’s own verdicts</figcaption>
          </figure>
        </div>
      </section>

      {/* What you get */}
      <section className="border-b border-[#E2DDD5]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-12 sm:py-16 flex flex-wrap gap-8 sm:gap-12">
          <h2 className="flex-[1_1_240px] font-normal text-[36px] sm:text-[44px] leading-[1.05]">What you get</h2>
          <ol className="flex-[3_1_560px] min-w-0 border-t border-[#13212B]">
            {GETS.map((g) => (
              <li key={g.n} className="flex flex-wrap gap-x-8 gap-y-2 py-6 border-b border-[#E2DDD5]">
                <span className="w-14 shrink-0 font-mono text-[13px] text-[#1F6F78] pt-2">{g.n}</span>
                <h3 className="flex-[1_1_200px] font-medium text-[24px] sm:text-[26px] leading-tight">{g.title}</h3>
                <p className="flex-[2_1_300px] text-base leading-relaxed text-[#3A4A54] pt-1">{g.text}</p>
              </li>
            ))}
          </ol>
          <div className="w-full border border-[#E2DDD5] bg-white px-5 py-4">
            <p className="font-mono text-[11px] tracking-[0.12em] text-[#5B6A73] mb-1">HOW CREDIT LOOKS ON A TRIP</p>
            <p className="font-mono text-xs tracking-[0.08em] uppercase text-[#5B6A73]">
              Shared by <span className="text-[#1F6F78] underline underline-offset-4">[Your name] ↗</span> <span className="text-[#1F6F78]">· Founding contributor</span>
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-[#E2DDD5]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-12 sm:py-16 flex flex-wrap gap-10 sm:gap-14 items-start">
          <div className="flex-[3_1_520px] min-w-0">
            <h2 className="font-normal text-[36px] sm:text-[44px] leading-[1.05] mb-6">Five minutes, start to finish</h2>
            <ol className="border-t border-[#13212B]">
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-6 py-6 border-b border-[#E2DDD5]">
                  <span className="w-12 shrink-0 font-mono text-[13px] text-[#1F6F78] pt-2">{s.n}</span>
                  <div>
                    <h3 className="font-medium text-[24px] leading-tight mb-1.5">{s.title}</h3>
                    <p className="text-base leading-relaxed text-[#3A4A54]">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <figure className="flex-[1_1_260px] max-w-[340px] mx-auto">
            <img src="/outreach/phone-share.jpg" alt="The Share a trip in 5 minutes page on a phone" className="w-full h-auto" />
            <figcaption className="font-mono text-[11px] tracking-[0.08em] text-[#5B6A73] uppercase pt-3 text-center">Paste your notes; AI does the typing</figcaption>
          </figure>
        </div>
      </section>

      {/* Where it shows */}
      <section className="border-b border-[#E2DDD5]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-12 sm:py-16">
          <h2 className="font-normal text-[36px] sm:text-[44px] leading-[1.05] mb-3">Where your trip shows up</h2>
          <p className="font-serif text-xl text-[#3A4A54] max-w-2xl mb-8">On its own page, and on the country page that gathers every member’s stays, restaurants and things to do.</p>
          <figure className="border border-[#E2DDD5] bg-white p-2.5 sm:p-3.5">
            <img src="/outreach/destination.jpg" alt="A country page on tripshare" className="w-full h-auto border border-[#E2DDD5]" />
          </figure>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-12 sm:py-16 flex flex-wrap gap-8 sm:gap-12">
          <h2 className="flex-[1_1_240px] font-normal text-[36px] sm:text-[44px] leading-[1.05]">Good questions</h2>
          <dl className="flex-[3_1_560px] min-w-0 border-t border-[#13212B]">
            {FAQ.map((f) => (
              <div key={f.q} className="py-5 border-b border-[#E2DDD5]">
                <dt className="font-serif text-[22px] leading-snug mb-1">{f.q}</dt>
                <dd className="text-base leading-relaxed text-[#3A4A54]">{f.a}</dd>
              </div>
            ))}
          </dl>
          <div className="w-full border border-[#13212B] bg-white px-5 py-5 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0 flex-[1_1_260px]">
              <p className="font-serif text-[24px] leading-tight">Ready to share one trip?</p>
              <p className="text-[15px] text-[#5B6A73] mt-1">Questions first? Email <a href="mailto:hello@tripshare.org" className="text-[#1F6F78] underline">hello@tripshare.org</a>.</p>
            </div>
            <Link href="/register?next=/trips/import" className="inline-flex items-center min-h-[52px] px-6 bg-[#13212B] text-[#F8F6F1] font-mono text-xs tracking-[0.1em] hover:bg-[#24394A]">SHARE YOUR FIRST TRIP</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
