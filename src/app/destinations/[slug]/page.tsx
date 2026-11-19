import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { destination } from '@/lib/destinations';
import { placeFields } from '@/lib/placeDetails';
import { monthYear, daysFromDates } from '@/lib/dates';

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = await destination(slug).catch(() => null);
  if (!d) return { title: 'Destination · Share and Plan' };
  const n = d.trips.length;
  const cities = d.cities.slice(0, 4).map((c) => c.city).join(', ');
  return {
    title: `${d.country} itineraries: ${n} real ${n === 1 ? 'trip' : 'trips'} · Share and Plan`,
    description: `Real ${d.country} itineraries from travellers${cities ? ` (${cities})` : ''}: where they stayed, ate and explored, and what they'd skip.`,
    alternates: { canonical: `https://tripshare.org/destinations/${d.slug}` },
    openGraph: { title: `${d.country}: real itineraries`, url: `https://tripshare.org/destinations/${d.slug}`, siteName: 'Share and Plan', type: 'website', images: d.trips.find((t) => t.coverImageUrl)?.coverImageUrl ? [{ url: d.trips.find((t) => t.coverImageUrl)!.coverImageUrl! }] : undefined },
  };
}

const HATCH = { background: 'repeating-linear-gradient(135deg, #EFEBE3 0 1px, #F6F3EC 1px 12px)' };
type P = { name: string; location: string | null; rating: number | null; review: string | null; liked: boolean | null; imageUrl: string | null; tripId: string; tripTitle: string };

function PlaceRow({ p, kind }: { p: P; kind: string }) {
  const f = placeFields(p);
  const meta = [p.location, p.rating ? `★ ${p.rating}/5` : '', p.liked === true ? 'Loved it' : p.liked === false ? 'Would skip' : ''].filter(Boolean).join(' · ');
  return (
    <li className="flex gap-4 sm:gap-6 py-4 border-b border-[#E2DDD5]">
      <span className="hidden sm:block w-12 shrink-0 font-mono text-[13px] text-[#1F6F78] pt-1">{kind}</span>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <span className="font-serif text-[21px] leading-snug">{p.name}</span>
        {meta && <span className="font-mono text-[11px] tracking-[0.06em] uppercase text-[#5B6A73]">{meta}</span>}
        {f.review && <span className="font-serif italic text-[17px] leading-relaxed text-[#2A3A44] line-clamp-3">“{f.review}”</span>}
        <Link href={`/trips/${p.tripId}`} className="font-mono text-[11px] tracking-[0.08em] text-[#1F6F78] hover:text-[#13212B] uppercase">From: {p.tripTitle} →</Link>
      </div>
      {f.imageUrl && <img src={f.imageUrl} alt="" loading="lazy" className="w-20 h-20 shrink-0 object-cover border border-[#E2DDD5]" />}
    </li>
  );
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await destination(slug).catch(() => null);
  if (!d) notFound();
  const cover = d.trips.find((t) => t.coverImageUrl)?.coverImageUrl;
  const places = d.cities.reduce((n, c) => n + c.stays.length + c.eats.length + c.todo.length, 0);

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-[#13212B] pt-16">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-6 sm:pt-8 pb-20">
        <Link href="/destinations" className="inline-block font-mono text-xs tracking-[0.1em] text-[#5B6A73] hover:text-[#13212B] py-2.5">← ALL DESTINATIONS</Link>
        <div className="flex flex-wrap gap-x-12 gap-y-6 items-end justify-between pt-4 pb-8 border-b border-[#13212B]">
          <div className="flex-[1_1_520px] min-w-0 flex flex-col gap-4">
            <p className="font-mono text-xs tracking-[0.14em] text-[#1F6F78] uppercase">{d.trips.length} {d.trips.length === 1 ? 'trip' : 'trips'} · {places} places · {d.cities.length} {d.cities.length === 1 ? 'city' : 'cities'}</p>
            <h1 className="font-normal text-[44px] sm:text-[64px] lg:text-[80px] leading-[1.0] tracking-[-0.02em]">{d.country}</h1>
            <p className="font-serif text-xl text-[#3A4A54] max-w-2xl">Real trips from members: where they stayed, ate and explored, and what they’d skip.</p>
          </div>
          <Link href="/sandbox" className="inline-flex items-center min-h-[48px] px-5 bg-[#13212B] text-[#F8F6F1] font-mono text-xs tracking-[0.1em] hover:bg-[#24394A]">PLAN A {d.country.toUpperCase()} TRIP</Link>
        </div>

        {cover && (
          <figure className="mt-8 border border-[#E2DDD5] bg-white p-2.5 sm:p-3.5">
            <div className="relative h-[220px] sm:h-[360px] border border-[#E2DDD5] overflow-hidden" style={HATCH}>
              <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
            </div>
          </figure>
        )}

        <section className="pt-12">
          <h2 className="font-normal text-[34px] sm:text-[40px] pb-3 border-b border-[#13212B]">Trips to {d.country}</h2>
          {d.trips.map((t) => {
            const days = daysFromDates(t.startDate, t.endDate) || t.cities_data.reduce((n, c) => n + (c.numberOfDays || 0), 0);
            const meta = [days ? `${days} days` : '', monthYear(t.startDate), t.tripType || ''].filter(Boolean).join(' · ');
            return (
              <Link key={t.id} href={`/trips/${t.id}`} className="group flex flex-wrap gap-x-7 gap-y-3 py-5 border-b border-[#E2DDD5] items-start">
                <div className="relative w-[148px] h-[104px] shrink-0 border border-[#E2DDD5] overflow-hidden" style={HATCH}>
                  {t.coverImageUrl && <img src={t.coverImageUrl} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />}
                </div>
                <div className="flex-[1_1_280px] min-w-0 flex flex-col gap-2">
                  {meta && <span className="font-mono text-[11px] tracking-[0.12em] text-[#5B6A73] uppercase">{meta}</span>}
                  <span className="font-serif text-[26px] leading-tight group-hover:text-[#1F6F78]">{t.title}</span>
                  <span className="font-mono text-[13px] uppercase">{t.cities_data.map((c) => c.name).join(' → ')}</span>
                </div>
                <span className="font-mono text-xs tracking-[0.08em] text-[#1F6F78] pt-1">READ →</span>
              </Link>
            );
          })}
        </section>

        {d.cities.map((c) => (
          <section key={c.city} className="pt-14">
            <h2 className="font-normal text-[34px] sm:text-[40px] pb-3 border-b border-[#13212B]">{c.city}</h2>
            {c.stays.length > 0 && (
              <>
                <h3 className="font-mono font-normal text-[11px] tracking-[0.14em] text-[#5B6A73] pt-6 pb-1">WHERE MEMBERS STAYED</h3>
                <ul>{c.stays.slice(0, 8).map((p, i) => <PlaceRow key={i} p={p} kind="STAY" />)}</ul>
              </>
            )}
            {c.eats.length > 0 && (
              <>
                <h3 className="font-mono font-normal text-[11px] tracking-[0.14em] text-[#5B6A73] pt-6 pb-1">WHERE THEY ATE</h3>
                <ul>{c.eats.slice(0, 10).map((p, i) => <PlaceRow key={i} p={p} kind="EAT" />)}</ul>
              </>
            )}
            {c.todo.length > 0 && (
              <>
                <h3 className="font-mono font-normal text-[11px] tracking-[0.14em] text-[#5B6A73] pt-6 pb-1">WHAT THEY DID</h3>
                <ul>{c.todo.slice(0, 10).map((p, i) => <PlaceRow key={i} p={p} kind="DO" />)}</ul>
              </>
            )}
          </section>
        ))}

        <div className="mt-16 border border-[#13212B] bg-white px-5 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-[1_1_260px]">
            <p className="font-serif text-[24px] leading-tight">Been to {d.country}?</p>
            <p className="text-[15px] text-[#5B6A73] mt-1">Share your trip in 5 minutes: paste your notes and AI does the typing.</p>
          </div>
          <Link href="/trips/import" className="inline-flex items-center min-h-[48px] px-5 border border-[#13212B] font-mono text-xs tracking-[0.1em] hover:bg-[#13212B] hover:text-[#F8F6F1]">SHARE YOUR TRIP</Link>
        </div>
      </div>
    </div>
  );
}
