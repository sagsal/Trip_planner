'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Megaphone } from 'lucide-react';

/** The owner's current announcement, shown once per visitor until they close it */
const KEY = 'dismissedAnnouncement';

export default function AnnouncementBanner() {
  const pathname = usePathname();
  const [a, setA] = useState<{ id: string; title: string; body: string; linkUrl: string | null; linkLabel: string | null } | null>(null);

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;
    fetch('/api/announcement', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const x = d.announcement;
        let dismissed = '';
        try { dismissed = localStorage.getItem(KEY) || ''; } catch {}
        if (x && x.id !== dismissed) setA(x);
      })
      .catch(() => {});
  }, [pathname]);

  if (!a) return null;
  const close = () => {
    try { localStorage.setItem(KEY, a.id); } catch {}
    setA(null);
  };
  const isExternal = !!a.linkUrl && /^https?:\/\//.test(a.linkUrl);

  return (
    <div role="status" className="fixed z-[60] bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-xl bg-[#13212B] text-white rounded-2xl shadow-2xl p-4 pr-12 flex gap-3">
      <Megaphone className="w-5 h-5 shrink-0 mt-0.5 text-[#9FD3D6]" aria-hidden />
      <div className="min-w-0">
        <p className="font-bold">{a.title}</p>
        {a.body && <p className="text-sm text-white/85 mt-0.5 whitespace-pre-line">{a.body}</p>}
        {a.linkUrl && (
          isExternal ? (
            <a href={a.linkUrl} onClick={close} className="inline-block mt-2 text-sm font-semibold text-[#9FD3D6] underline">{a.linkLabel || 'See what’s new'}</a>
          ) : (
            <Link href={a.linkUrl} onClick={close} className="inline-block mt-2 text-sm font-semibold text-[#9FD3D6] underline">{a.linkLabel || 'See what’s new'}</Link>
          )
        )}
      </div>
      <button type="button" onClick={close} aria-label="Close" className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
