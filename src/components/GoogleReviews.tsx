'use client';

import { useState } from 'react';
import { Star, Loader2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

type Review = { author: string; authorUrl: string | null; photo: string | null; rating: number | null; when: string; text: string };
type Data = { name: string; rating: number | null; count: number | null; mapsUrl: string; reviews: Review[] };

/** "Google reviews" button on a place: loads Google's rating and a few reviews when tapped */
export default function GoogleReviews({
  name,
  location,
  city,
  country,
  kind,
}: {
  name: string;
  location?: string | null;
  city?: string | null;
  country?: string | null;
  kind: 'hotel' | 'restaurant' | 'activity';
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<Data | null>(null);
  const [fallback, setFallback] = useState<{ url: string; why: string } | null>(null);
  const [showAll, setShowAll] = useState(false);

  const load = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (data || fallback) return;
    setBusy(true);
    try {
      const qs = new URLSearchParams({ name, kind, ...(location ? { location } : {}), ...(city ? { city } : {}), ...(country ? { country } : {}) });
      const res = await fetch(`/api/places/reviews?${qs}`);
      const d = await res.json().catch(() => ({}));
      if (d.reviews) setData(d);
      else if (d.capped) setFallback({ url: d.mapsUrl, why: '' });
      else if (d.notFound) setFallback({ url: d.mapsUrl, why: 'We couldn’t match this place on Google.' });
      else setFallback({ url: d.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`, why: d.error || '' });
    } catch {
      setFallback({ url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`, why: 'Couldn’t load Google reviews right now.' });
    } finally {
      setBusy(false);
    }
  };

  const stars = (n: number, size = 'w-3.5 h-3.5') => (
    <span className="inline-flex" aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${size} ${i <= Math.round(n) ? 'text-[#E0A526] fill-[#E0A526]' : 'text-[#D9D4CC]'}`} />
      ))}
    </span>
  );

  const shown = data ? (showAll ? data.reviews : data.reviews.slice(0, 2)) : [];

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={load}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3D4C56] hover:text-[#13212B] min-h-[36px]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"/></svg>
        {data?.rating ? (
          <span className="inline-flex items-center gap-1">
            {data.rating.toFixed(1)} {stars(data.rating)}
            {data.count ? <span className="font-normal text-[#5B6A73]">({data.count.toLocaleString()})</span> : null}
          </span>
        ) : (
          'Google reviews'
        )}
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && !busy && (
        <div className="mt-2 rounded-xl bg-[#F8F7F4] border border-[#E2DDD5] p-3 text-sm">
          {fallback && (
            <p className="text-[#3D4C56]">
              {fallback.why && <span>{fallback.why} </span>}
              <a href={fallback.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1F6F78] inline-flex items-center">
                See reviews on Google Maps <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            </p>
          )}
          {data && (
            <div className="flex flex-col gap-3">
              {data.reviews.length === 0 && <p className="text-[#5B6A73]">No written reviews on Google yet.</p>}
              {shown.map((r, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.photo && <img src={r.photo} alt="" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full" />}
                    {r.authorUrl ? (
                      <a href={r.authorUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#13212B] hover:underline">{r.author}</a>
                    ) : (
                      <span className="font-semibold text-[#13212B]">{r.author}</span>
                    )}
                    {r.rating ? stars(r.rating, 'w-3 h-3') : null}
                    {r.when && <span className="text-xs text-[#5B6A73]">{r.when}</span>}
                  </div>
                  {r.text && <p className="text-[#3D4C56] leading-relaxed line-clamp-4">{r.text}</p>}
                </div>
              ))}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                {data.reviews.length > 2 ? (
                  <button type="button" onClick={() => setShowAll((v) => !v)} className="font-semibold text-[#1F6F78]">
                    {showAll ? 'Show fewer' : `Show ${data.reviews.length - 2} more`}
                  </button>
                ) : <span />}
                <a href={data.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#5B6A73] inline-flex items-center hover:text-[#13212B]">
                  Reviews from Google · See all on Google Maps <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
