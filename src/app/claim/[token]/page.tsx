'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

/** A trip typed up for someone: they check it, sign in, and it becomes their draft to publish */
export default function ClaimPage() {
  const { token } = useParams() as { token: string };
  const router = useRouter();
  const [d, setD] = useState<{ title: string; cities: { name: string; country: string; days: number }[]; places: number; claimed: boolean } | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    try { setSignedIn(!!localStorage.getItem('user')); } catch {}
    fetch(`/api/claim/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setD(j); })
      .catch((e) => setErr(e?.message || 'This link isn’t valid.'));
  }, [token]);

  const next = `/claim/${token}`;
  const claim = async () => {
    setBusy(true); setErr('');
    try {
      const r = await fetch(`/api/claim/${encodeURIComponent(token)}`, { method: 'POST' });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) { router.push(`/login?next=${encodeURIComponent(next)}`); return; }
      if (!r.ok) throw new Error(j.error || 'Something went wrong. Please try again.');
      router.push(`/trips/import?pending=${encodeURIComponent(j.pendingId)}`);
    } catch (e: any) {
      setErr(e?.message || 'Something went wrong.');
      setBusy(false);
    }
  };

  const days = d?.cities.reduce((n, c) => n + (c.days || 0), 0) || 0;
  return (
    <div className="min-h-screen bg-[#F8F6F1] text-[#13212B] pt-16">
      <div className="max-w-[680px] mx-auto px-5 py-10">
        <p className="font-mono text-xs tracking-[0.14em] text-[#1F6F78] mb-2">TYPED UP FOR YOU</p>
        <h1 className="font-normal text-[34px] sm:text-[40px] leading-tight mb-3">Your trip is ready to check</h1>
        <p className="text-[16px] text-[#3A4A54] mb-6">
          Someone put your trip notes into a day-by-day page for you. Have a look, change anything you like, and publish it when you’re happy. Nothing is public until you do.
        </p>
        {err && <p className="border border-red-200 bg-red-50 text-red-700 px-4 py-3 mb-4" role="alert">{err}</p>}
        {!d && !err && <p className="font-mono text-xs tracking-[0.1em] text-[#5B6A73]">LOADING…</p>}
        {d && (
          <section className="border border-[#E2DDD5] bg-white p-5 mb-6">
            <h2 className="font-normal text-[26px] leading-tight mb-2">{d.title}</h2>
            <p className="font-mono text-xs tracking-[0.1em] text-[#5B6A73] mb-4">
              {[days ? `${days} DAYS` : '', d.cities.length ? `${d.cities.length} ${d.cities.length === 1 ? 'PLACE' : 'PLACES'}` : '', d.places ? `${d.places} STAYS, MEALS & SIGHTS` : ''].filter(Boolean).join(' · ')}
            </p>
            <ol className="border-t border-[#E2DDD5]">
              {d.cities.map((c, i) => (
                <li key={i} className="flex justify-between gap-3 py-2.5 border-b border-[#E2DDD5]">
                  <span>{c.name}{c.country ? <span className="text-[#5B6A73]">, {c.country}</span> : null}</span>
                  <span className="font-mono text-xs tracking-[0.08em] text-[#5B6A73]">{c.days} {c.days === 1 ? 'DAY' : 'DAYS'}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
        {d && d.claimed && <p className="text-[15px] text-[#3A4A54] mb-4">This trip has been claimed. If it was you, sign in and press the button again to open it.</p>}
        {d && (signedIn ? (
          <button type="button" onClick={claim} disabled={busy} className="min-h-[48px] px-6 bg-[#13212B] text-[#F8F6F1] font-mono text-xs tracking-[0.1em] hover:bg-[#24394A] disabled:opacity-60">
            {busy ? 'OPENING…' : 'CHECK IT AND PUBLISH'}
          </button>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Link href={`/register?next=${encodeURIComponent(next)}`} className="inline-flex items-center min-h-[48px] px-6 bg-[#13212B] text-[#F8F6F1] font-mono text-xs tracking-[0.1em] hover:bg-[#24394A]">
              CREATE A FREE ACCOUNT
            </Link>
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="inline-flex items-center min-h-[48px] px-6 border border-[#13212B] font-mono text-xs tracking-[0.1em] hover:bg-white">
              I HAVE AN ACCOUNT
            </Link>
          </div>
        ))}
        <p className="mt-6 text-sm text-[#5B6A73]">Free, no ads. Your name shows on the trip only if you choose. You can delete it any time.</p>
      </div>
    </div>
  );
}
