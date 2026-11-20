'use client';

import { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';

/**
 * Shown on a trip page right after its author publishes it (?published=1):
 * a ready-written line and one-tap sharing, because a personal message brings more people than any post.
 */
export default function PublishedShare({ tripId, title }: { tripId: string; title: string }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get('published') === '1') {
        setShow(true);
        q.delete('published');
        const rest = q.toString();
        window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash);
        fetch(`/og/pin/${tripId}.png`).catch(() => {}); // get the Pinterest image ready
      }
    } catch {}
  }, [tripId]);
  if (!show) return null;

  const origin = window.location.origin;
  const tag = (src: string) => `${origin}/trips/${tripId}?utm_source=${src}&utm_medium=author`;
  const line = `I just shared my ${title} trip on tripshare: where we stayed, what we ate and what we'd skip. Have a look, and add yours if you've been somewhere good:`;
  const enc = encodeURIComponent;
  const links = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${enc(`${line} ${tag('whatsapp')}`)}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(tag('facebook'))}` },
    { label: 'Pinterest', href: `https://www.pinterest.com/pin/create/button/?url=${enc(tag('pinterest'))}&media=${enc(`${origin}/og/pin/${tripId}.png`)}&description=${enc(title)}` },
    { label: 'Email', href: `mailto:?subject=${enc(`My trip: ${title}`)}&body=${enc(`${line}\n\n${tag('email')}`)}` },
  ];
  const copy = async (what: 'link' | 'message') => {
    const text = what === 'link' ? tag('link') : `${line} ${tag('message')}`;
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopied(what);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <section className="border border-[#13212B] bg-white p-4 sm:p-5 mb-6" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.14em] text-[#1F6F78] mb-1">YOUR TRIP IS LIVE</p>
          <h2 className="font-normal text-[24px] leading-tight mb-2">Tell a few friends</h2>
        </div>
        <button type="button" onClick={() => setShow(false)} aria-label="Close" className="p-2 -m-2 text-[#5B6A73]"><X className="w-5 h-5" /></button>
      </div>
      <p className="text-[15px] text-[#3A4A54] mb-3">A personal message works best. Here’s a line you can send as it is or change:</p>
      <p className="border-l-2 border-[#1F6F78] pl-3 text-[15px] italic mb-4">{line}</p>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <a key={l.label} href={l.href} target={l.href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer"
            className="inline-flex items-center min-h-[44px] px-4 border border-[#E2DDD5] font-mono text-xs tracking-[0.08em] hover:bg-[#F6F3EE]">
            {l.label.toUpperCase()}
          </a>
        ))}
        <button type="button" onClick={() => copy('message')} className="inline-flex items-center gap-1.5 min-h-[44px] px-4 border border-[#E2DDD5] font-mono text-xs tracking-[0.08em] hover:bg-[#F6F3EE]">
          {copied === 'message' && <Check className="w-4 h-4 text-[#1F6F78]" />}COPY MESSAGE
        </button>
        <button type="button" onClick={() => copy('link')} className="inline-flex items-center gap-1.5 min-h-[44px] px-4 border border-[#E2DDD5] font-mono text-xs tracking-[0.08em] hover:bg-[#F6F3EE]">
          {copied === 'link' && <Check className="w-4 h-4 text-[#1F6F78]" />}COPY LINK
        </button>
      </div>
    </section>
  );
}
