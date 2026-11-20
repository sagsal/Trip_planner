'use client';

import { useEffect } from 'react';

/** Counts one visit per browser session for its channel (utm_source or the referring site). Counts only. */
export default function VisitTracker() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem('ts_tracked')) return;
      sessionStorage.setItem('ts_tracked', '1');
      const q = new URLSearchParams(window.location.search);
      const utm = q.get('utm_source') || q.get('ref') || '';
      const body = JSON.stringify({ utm, ref: document.referrer || '' });
      fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    } catch {}
  }, []);
  return null;
}
