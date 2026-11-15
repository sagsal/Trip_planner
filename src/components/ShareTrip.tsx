'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Link2, Check, Mail, X } from 'lucide-react';

/** "Share" on a trip page: the phone's own share sheet where there is one, else copy / WhatsApp / Facebook / email */
export default function ShareTrip({ title, text, className = '' }: { title: string; text?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const url = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const message = text || `Have a look at this trip: ${title}`;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (boxRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    // Place the menu just under the button, kept on screen; it floats above everything (the cover photo clips its own contents)
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      const w = 256;
      const left = Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8);
      const below = r.bottom + 8;
      const h = menuRef.current?.offsetHeight || 330;
      const top = below + h > window.innerHeight - 8 ? Math.max(8, r.top - h - 8) : below;
      setPos({ top, left });
    };
    place();
    const raf = requestAnimationFrame(place);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const onClick = async () => {
    const nav: any = typeof navigator !== 'undefined' ? navigator : null;
    // Phones: the built-in share sheet (Messages, WhatsApp, Instagram, …)
    if (nav?.share && /Android|iPhone|iPad|iPod/i.test(nav.userAgent || '')) {
      try { await nav.share({ title, text: message, url }); return; } catch (e: any) { if (e?.name === 'AbortError') return; }
    }
    setOpen((o) => !o);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch {}
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const enc = encodeURIComponent;
  const links = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${enc(`${message} ${url}`)}`, color: '#25D366' },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, color: '#1877F2' },
    { label: 'X', href: `https://x.com/intent/post?text=${enc(message)}&url=${enc(url)}`, color: '#13212B' },
  ];

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={onClick}
        aria-expanded={open}
        className="inline-flex items-center px-4 min-h-[44px] rounded-xl bg-white border border-[#E2DCD2] text-[#13212B] text-sm font-semibold hover:bg-[#F6F3EE]"
      >
        <Share2 className="w-4 h-4 mr-1.5" /> Share
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: 256 }}
          className="z-[80] bg-white rounded-2xl border border-[#E2DCD2] shadow-xl p-2 text-[#13212B]"
        >
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="text-sm font-bold">Share this trip</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="p-1 text-[#5B6A73]"><X className="w-4 h-4" /></button>
          </div>
          <button type="button" role="menuitem" onClick={copy} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#F6F3EE] text-sm text-left">
            {copied ? <Check className="w-4 h-4 text-[#1F6F78]" /> : <Link2 className="w-4 h-4" />}
            {copied ? 'Link copied' : 'Copy link'}
          </button>
          {links.map((l) => (
            <a key={l.label} role="menuitem" href={l.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#F6F3EE] text-sm">
              <span className="w-4 h-4 rounded-full" style={{ background: l.color }} aria-hidden />
              {l.label}
            </a>
          ))}
          <a role="menuitem" href={`mailto:?subject=${enc(title)}&body=${enc(`${message}\n\n${url}`)}`} onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#F6F3EE] text-sm">
            <Mail className="w-4 h-4" /> Email
          </a>
          <p className="px-3 pt-1.5 pb-1 text-xs text-[#5B6A73]">For Instagram, copy the link and add it to your story or bio.</p>
        </div>,
        document.body
      )}
    </div>
  );
}
