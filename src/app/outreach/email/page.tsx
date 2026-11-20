'use client';

import { useRef, useState } from 'react';

/*
 * The outreach email for travel bloggers, ready to copy into Gmail with its pictures.
 * Inline styles and absolute image links only, so it survives pasting into an email.
 */
const SITE = 'https://tripshare.org';
const ink = '#13212B', quiet = '#5B6A73', teal = '#1F6F78', rule = '#E2DDD5';
const serif = "Georgia, 'Times New Roman', serif";
const mono = "'Courier New', Courier, monospace";

const SUBJECTS = [
  'Your [destination] itinerary + a small idea',
  'Loved your [destination] trip: would you share it here?',
  'A home for your [destination] itinerary, with a link back to you',
];

export default function OutreachEmail() {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState('');

  const copy = async () => {
    const el = ref.current;
    if (!el) return;
    try {
      const html = el.innerHTML;
      const text = el.innerText;
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) }),
      ]);
      setCopied('Copied. Paste it into a new Gmail message.');
    } catch {
      // Fallback: select it so Ctrl/Cmd+C works
      const r = document.createRange();
      r.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
      setCopied('Selected. Press Ctrl+C (or Cmd+C), then paste into Gmail.');
    }
    setTimeout(() => setCopied(''), 6000);
  };

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-[#13212B] pt-16">
      <div className="max-w-[760px] mx-auto px-5 py-8">
        <p className="font-mono text-xs tracking-[0.14em] text-[#1F6F78] mb-2">OUTREACH · FOR YOU ONLY (NOT LINKED ANYWHERE)</p>
        <h1 className="font-normal text-[34px] leading-tight mb-3">Email to travel bloggers</h1>
        <ol className="list-decimal pl-5 text-[15px] text-[#3A4A54] space-y-1 mb-4">
          <li>Press <b>Copy email</b>, open a new Gmail message and paste. The pictures come with it.</li>
          <li>Replace the <b>[brackets]</b>: their first name and the destination they write about.</li>
          <li>Pick a subject below, send one at a time from your own address, and mark it Sent in your list.</li>
        </ol>
        <div className="border border-[#E2DDD5] bg-white px-4 py-3 mb-4">
          <p className="font-mono text-[11px] tracking-[0.12em] text-[#5B6A73] mb-1.5">SUBJECT LINES</p>
          <ul className="space-y-1 text-[15px]">{SUBJECTS.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button type="button" onClick={copy} className="min-h-[48px] px-5 bg-[#13212B] text-[#F8F6F1] font-mono text-xs tracking-[0.1em] hover:bg-[#24394A]">COPY EMAIL</button>
          {copied && <span className="text-sm text-[#1F6F78]" role="status">{copied}</span>}
        </div>

        {/* The email itself */}
        <div className="bg-white border border-[#E2DDD5] p-5 sm:p-8">
          <div ref={ref}>
            <div style={{ maxWidth: 600, fontFamily: serif, fontSize: 17, lineHeight: 1.55, color: ink }}>
              <p style={{ margin: '0 0 16px' }}>Hi [First name],</p>
              <p style={{ margin: '0 0 16px' }}>
                I’m Scott Greene, and I built <a href={SITE} style={{ color: teal }}>tripshare.org</a>, a free, ad-free site where travellers share real day-by-day trips: where they stayed, ate and explored, and what they’d skip. Here’s what a trip looks like:
              </p>
              <a href={`${SITE}/creators`} style={{ display: 'block', textDecoration: 'none' }}>
                <img src={`${SITE}/outreach/trip-review.jpg`} alt="A shared trip on tripshare.org: stays, days and the traveller’s honest review" width={600} style={{ display: 'block', width: '100%', maxWidth: 600, height: 'auto', border: `1px solid ${rule}` }} />
              </a>
              <p style={{ margin: '8px 0 20px', fontFamily: mono, fontSize: 11, letterSpacing: '0.08em', color: quiet, textTransform: 'uppercase' }}>A real trip on the site</p>

              <p style={{ margin: '0 0 12px' }}>I’m inviting a small group of travel bloggers to be <b>founding contributors</b>:</p>
              <table role="presentation" cellPadding={0} cellSpacing={0} style={{ width: '100%', maxWidth: 600, borderCollapse: 'collapse', margin: '0 0 20px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: 150, verticalAlign: 'top', paddingRight: 18 }}>
                      <img src={`${SITE}/outreach/phone-share.jpg`} alt="Share a trip in 5 minutes, on a phone" width={140} style={{ display: 'block', width: 140, height: 'auto' }} />
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                      {[
                        ['01', 'Share a trip you’ve already written in about 5 minutes. Paste the post or your notes, and AI does the typing.'],
                        ['02', 'Your name and a link to your blog on the trip, plus a Founding contributor mark.'],
                        ['03', 'Your places appear on country pages built for search, and you get a monthly note when people use them.'],
                      ].map(([n, t]) => (
                        <p key={n} style={{ margin: '0 0 12px', paddingBottom: 12, borderBottom: `1px solid ${rule}` }}>
                          <span style={{ fontFamily: mono, fontSize: 13, color: teal, marginRight: 8 }}>{n}</span>
                          {t}
                        </p>
                      ))}
                    </td>
                  </tr>
                </tbody>
              </table>

              <p style={{ margin: '0 0 22px' }}>
                <a href={`${SITE}/creators`} style={{ display: 'inline-block', background: ink, color: '#F8F6F1', textDecoration: 'none', padding: '13px 22px', fontFamily: mono, fontSize: 13, letterSpacing: '0.08em' }}>SEE HOW IT WORKS</a>
              </p>
              <p style={{ margin: '0 0 16px' }}>
                Would you be up for sharing one trip?
              </p>
              <p style={{ margin: '0 0 4px' }}>Thanks,</p>
              <p style={{ margin: '0 0 2px' }}>Scott Greene</p>
              <p style={{ margin: '0 0 20px', fontFamily: mono, fontSize: 12, color: quiet }}>
                <a href={SITE} style={{ color: quiet }}>tripshare.org</a>
              </p>
              <p style={{ margin: 0, fontSize: 14, color: quiet }}>P.S. If this isn’t for you, just reply “no thanks” and I won’t follow up.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
