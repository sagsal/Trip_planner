import Link from 'next/link';
import type { Metadata } from 'next';
import { destinationIndex } from '@/lib/destinations';

export const revalidate = 600;
export const metadata: Metadata = {
  title: 'Destinations: real trips by country · tripshare',
  description: 'Real itineraries from travellers, by country: where they stayed, ate and explored, and what they would skip.',
  alternates: { canonical: 'https://tripshare.org/destinations' },
};

const HATCH = { background: 'repeating-linear-gradient(135deg, #EFEBE3 0 1px, #F6F3EC 1px 12px)' };

export default async function DestinationsPage() {
  const places = await destinationIndex().catch(() => []);
  return (
    <div className="min-h-screen bg-[#F8F6F1] text-[#13212B] pt-16">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <p className="font-mono text-xs tracking-[0.14em] text-[#1F6F78] mb-3">DESTINATIONS</p>
        <h1 className="text-[40px] sm:text-[60px] font-normal leading-[1.02] tracking-[-0.02em] mb-4">Where members have been</h1>
        <p className="font-serif text-xl text-[#3A4A54] max-w-2xl mb-10">Real trips, by country: where people stayed, ate and explored, and what they’d skip.</p>
        <ul className="border-t border-[#13212B]">
          {places.map((d) => (
            <li key={d.slug}>
              <Link href={`/destinations/${d.slug}`} className="group flex flex-wrap gap-x-7 gap-y-3 py-5 border-b border-[#E2DDD5] items-center">
                <div className="relative w-[120px] h-[84px] shrink-0 border border-[#E2DDD5] overflow-hidden" style={HATCH}>
                  {d.cover && <img src={d.cover} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />}
                </div>
                <div className="flex-[1_1_260px] min-w-0 flex flex-col gap-1.5">
                  <span className="font-mono text-[11px] tracking-[0.12em] text-[#5B6A73] uppercase">{d.trips} {d.trips === 1 ? 'trip' : 'trips'}{d.cities.length ? ` · ${d.cities.length} ${d.cities.length === 1 ? 'city' : 'cities'}` : ''}</span>
                  <span className="font-serif text-[30px] leading-tight group-hover:text-[#1F6F78]">{d.country}</span>
                  {d.cities.length > 0 && <span className="font-mono text-[13px] uppercase truncate">{d.cities.slice(0, 6).join(' · ')}</span>}
                </div>
                <span className="font-mono text-xs tracking-[0.08em] text-[#1F6F78]">EXPLORE →</span>
              </Link>
            </li>
          ))}
        </ul>
        {places.length === 0 && <p className="font-serif italic text-xl py-8">No shared trips yet.</p>}
      </div>
    </div>
  );
}
