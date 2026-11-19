'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Loader2, Users, Map as MapIcon, Package, MessageCircle, ShieldCheck, Table2, BarChart3 } from 'lucide-react';
import { REGIONS, countriesIn } from '@/lib/regions';
import { ALL_COUNTRIES } from '@/lib/profile';

/* Site owner's dashboard: totals and breakdowns only (no names or emails). */

type Row = { label: string; count: number };
type Protected = { rows: Row[]; hidden: { groups: number; people: number } | null };
interface Stats {
  days: number;
  generatedAt: string;
  members: { total: number; new: number; weekly: { start: string; count: number }[]; byRegion: Protected; byCountry: Protected; byAge: Protected };
  trips: {
    shared: number; drafts: number; private: number; new: number; newShared: number;
    weekly: { start: string; count: number }[]; topCountries: Row[]; topCities: Row[]; types: Row[];
  };
  planning: { sandboxTrips: number; newSandboxTrips: number; savedPlaces: number; newSavedPlaces: number };
  feedback: { openTrips: number; comments: number; newComments: number; accepted: number };
  costs: { googleReviewsThisMonth: number; googleReviewsCap: number };
  health: { backup: { at: string | null; ok: boolean | null } };
}

const ACCENT = '#1F6F78';
const PERIODS = [7, 30, 90, 365];
const fmtWeek = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

function Tile({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white border border-[#E2DDD5] rounded-2xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6A73]">{label}</p>
      <p className="text-3xl font-extrabold tracking-tight mt-1 tabular-nums">{value}</p>
      {sub && <p className="text-sm text-[#5B6A73] mt-0.5">{sub}</p>}
    </div>
  );
}

/** Horizontal bars, one colour; label and count in ink, never in the bar colour */
function BarList({ rows, hidden, empty = 'Nothing yet', unit = '' }: { rows: Row[]; hidden?: Protected['hidden']; empty?: string; unit?: string }) {
  if (!rows.length && !hidden) return <p className="text-sm text-[#5B6A73]">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => (
        <li key={r.label} className="group" title={`${r.label}: ${r.count}${unit}`}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#13212B] truncate pr-2">{r.label}</span>
            <span className="text-[#3D4C56] tabular-nums">{r.count}</span>
          </div>
          <div className="h-2.5 rounded-full bg-[#F1EEE8]">
            <div className="h-full rounded-full group-hover:opacity-80" style={{ width: `${Math.max(3, (r.count / max) * 100)}%`, background: ACCENT }} />
          </div>
        </li>
      ))}
      {hidden && (
        <li className="text-xs text-[#5B6A73] pt-1">
          + {hidden.people} {hidden.people === 1 ? 'person' : 'people'} in {hidden.groups} smaller {hidden.groups === 1 ? 'group' : 'groups'} (fewer than 5 each, hidden for privacy)
        </li>
      )}
    </ul>
  );
}

/** Weekly columns (one series): hover a column for its exact value */
function Weekly({ data, label }: { data: { start: string; count: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const [hover, setHover] = useState<number | null>(null);
  const h = hover !== null ? data[hover] : null;
  return (
    <div>
      <p className="text-sm text-[#3D4C56] h-5 mb-2 tabular-nums">
        {h ? <>Week of {fmtWeek(h.start)}: <b>{h.count}</b> {label}</> : <span className="text-[#8A969D]">Hover a week for its number</span>}
      </p>
      <div className="flex items-end gap-1.5 h-28 border-b border-[#E2DDD5]" role="img" aria-label={`${label} per week, last ${data.length} weeks`}>
        {data.map((d, i) => (
          <div key={d.start} className="flex-1 h-full flex items-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} tabIndex={0}>
            <div className="w-full rounded-t-[4px]" style={{ height: `${d.count ? Math.max(4, (d.count / max) * 100) : 0}%`, background: ACCENT, opacity: hover === null || hover === i ? 1 : 0.45 }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-[#8A969D] mt-1">
        <span>{fmtWeek(data[0]?.start || '')}</span>
        <span>This week</span>
      </div>
    </div>
  );
}

function Card({ title, icon, children, wide }: { title: string; icon: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <section className={`bg-white border border-[#E2DDD5] rounded-2xl p-4 sm:p-5 ${wide ? 'lg:col-span-2' : ''}`}>
      <h2 className="font-normal mb-3 flex items-center gap-2">{icon}{title}</h2>
      {children}
    </section>
  );
}

interface Member {
  id: string; name: string; email: string; joined: string; from: string | null; age: string | null;
  shared: number; drafts: number; private: number; planned: number; saved: number; comments: number;
  blocked: boolean; isYou: boolean;
}

/** Every account (owner only): who joined when, and what they've done */
function Accounts() {
  const [list, setList] = useState<Member[] | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  useEffect(() => {
    if (!open || list) return;
    fetch('/api/admin/members', { cache: 'no-store' }).then((r) => r.json()).then((d) => setList(d.members || [])).catch(() => setList([]));
  }, [open, list]);
  const [busy, setBusy] = useState('');
  const act = async (m: Member, action: 'block' | 'unblock' | 'delete') => {
    if (action === 'block' && !confirm(`Block ${m.name}?\n\nThey won’t be able to sign in, and their trips and comments will be hidden from everyone. You can unblock them later.`)) return;
    if (action === 'delete') {
      const typed = prompt(`Delete ${m.name} (${m.email}) for good?\n\nThis removes the account and everything it made: ${m.shared + m.drafts + m.private} trips, ${m.planned} planned trips, ${m.saved} saved places and ${m.comments} comments. It can’t be undone (only by restoring a nightly backup).\n\nType DELETE to confirm.`);
      if ((typed || '').trim().toUpperCase() !== 'DELETE') return;
    }
    setBusy(m.id);
    try {
      const r = await fetch('/api/admin/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id, action }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { alert(d.error || 'Something went wrong.'); return; }
      setList((prev) => (prev || []).flatMap((x) => (x.id !== m.id ? [x] : action === 'delete' ? [] : [{ ...x, blocked: action === 'block' }])));
    } finally {
      setBusy('');
    }
  };
  const shown = (list || []).filter((m) => !q || `${m.name} ${m.email} ${m.from || ''}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <section className="mt-5 bg-white border border-[#E2DDD5] rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-normal flex items-center gap-2"><Users className="w-4 h-4 text-[#1F6F78]" />Accounts{list ? ` (${list.length})` : ''}</h2>
        <button type="button" onClick={() => setOpen((v) => !v)} className="px-3 min-h-[40px] rounded-xl border border-[#E2DDD5] text-sm font-semibold">
          {open ? 'Hide accounts' : 'Show all accounts'}
        </button>
      </div>
      {open && (
        <div className="mt-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or country" aria-label="Search accounts"
            className="w-full sm:w-80 px-3 py-2 border border-[#E2DDD5] rounded-xl text-sm mb-3" />
          {!list ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#8A969D]" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="text-left text-[#5B6A73] border-b border-[#E2DDD5]">
                    <th className="font-medium py-2 pr-3">Name</th>
                    <th className="font-medium py-2 pr-3">Email</th>
                    <th className="font-medium py-2 pr-3">Joined</th>
                    <th className="font-medium py-2 pr-3">From</th>
                    <th className="font-medium py-2 pr-3">Age</th>
                    <th className="font-medium py-2 pr-3 text-right" title="Shared / drafts / private">Trips</th>
                    <th className="font-medium py-2 pr-3 text-right">Planned</th>
                    <th className="font-medium py-2 pr-3 text-right">Saved</th>
                    <th className="font-medium py-2 pr-3 text-right">Comments</th>
                    <th className="font-medium py-2 text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((m) => (
                    <tr key={m.id} className="border-b border-[#F1EEE8] align-top">
                      <td className="py-2 pr-3 font-semibold">
                        {m.name}
                        {m.isYou && <span className="ml-1.5 text-xs font-semibold text-[#1F6F78]">(you)</span>}
                        {m.blocked && <span className="ml-1.5 text-xs font-semibold bg-[#F6E7DC] text-[#8A4B24] rounded-full px-2 py-0.5">Blocked</span>}
                      </td>
                      <td className="py-2 pr-3 break-all">{m.email}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{new Date(m.joined).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td className="py-2 pr-3">{m.from || <span className="text-[#8A969D]">—</span>}</td>
                      <td className="py-2 pr-3">{m.age || <span className="text-[#8A969D]">—</span>}</td>
                      <td className="py-2 pr-3 text-right tabular-nums" title={`${m.shared} shared, ${m.drafts} drafts, ${m.private} private`}>{m.shared} / {m.drafts} / {m.private}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{m.planned}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{m.saved}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{m.comments}</td>
                      <td className="py-1.5 text-right whitespace-nowrap">
                        {!m.isYou && (
                          <>
                            <button type="button" disabled={busy === m.id} onClick={() => act(m, m.blocked ? 'unblock' : 'block')}
                              className="px-2.5 min-h-[34px] rounded-lg border border-[#E2DDD5] text-xs font-semibold mr-1.5 disabled:opacity-50">
                              {m.blocked ? 'Unblock' : 'Block'}
                            </button>
                            <button type="button" disabled={busy === m.id} onClick={() => act(m, 'delete')}
                              className="px-2.5 min-h-[34px] rounded-lg border border-[#F0C9B5] text-[#B4532A] text-xs font-semibold disabled:opacity-50">
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-[#5B6A73] mt-2">Trips = shared / drafts / private. Oldest accounts first.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}


/* ---------------- Messages: email members, or post a site banner ---------------- */
function Messages() {
  const [mode, setMode] = useState<'email' | 'banner'>('email');
  const [info, setInfo] = useState<{ configured: boolean; from: string; history: { id: string; subject: string; sentCount: number; failed: number; createdAt: string }[] } | null>(null);
  const [aud, setAud] = useState({ joinedFrom: '', joinedTo: '', region: '', country: '' });
  const [count, setCount] = useState<number | null>(null);
  const [msg, setMsg] = useState({ subject: '', body: '', linkUrl: 'https://tripshare.org', linkLabel: 'See what’s new' });
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [banners, setBanners] = useState<{ id: string; title: string; body: string; active: boolean; createdAt: string }[]>([]);
  const [banner, setBanner] = useState({ title: '', body: '', linkUrl: '/', linkLabel: 'Take a look' });

  const loadInfo = () => fetch('/api/admin/messages', { cache: 'no-store' }).then((r) => r.json()).then(setInfo).catch(() => {});
  const loadBanners = () => fetch('/api/admin/announcements', { cache: 'no-store' }).then((r) => r.json()).then((d) => setBanners(d.announcements || [])).catch(() => {});
  useEffect(() => { loadInfo(); loadBanners(); }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      fetch('/api/admin/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'count', audience: aud }) })
        .then((r) => r.json()).then((d) => setCount(typeof d.count === 'number' ? d.count : null)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [aud]);

  const post = async (action: 'test' | 'send') => {
    if (action === 'send' && !confirm(`Send “${msg.subject}” to ${count} ${count === 1 ? 'member' : 'members'} now?`)) return;
    setBusy(action); setNote('');
    try {
      const r = await fetch('/api/admin/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, audience: aud, ...msg }) });
      const d = await r.json().catch(() => ({}));
      if (action === 'test') setNote(r.ok ? `Test sent to ${d.to}. Check your inbox (and spam).` : `Couldn’t send: ${d.error || 'something went wrong'}`);
      else { setNote(r.ok ? `Sent to ${d.sent} ${d.sent === 1 ? 'member' : 'members'}${d.failed ? `, ${d.failed} failed (${d.error})` : ''}.` : `Couldn’t send: ${d.error || 'something went wrong'}`); loadInfo(); }
    } finally { setBusy(''); }
  };

  const postBanner = async (action: 'post' | 'end', id?: string) => {
    setBusy(action); setNote('');
    try {
      const r = await fetch('/api/admin/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action === 'post' ? { action, ...banner } : { action, id }) });
      const d = await r.json().catch(() => ({}));
      setNote(r.ok ? (action === 'post' ? 'Banner is live. Visitors see it until they close it.' : 'Banner ended.') : d.error || 'Something went wrong.');
      if (r.ok && action === 'post') setBanner({ title: '', body: '', linkUrl: '/', linkLabel: 'Take a look' });
      loadBanners();
    } finally { setBusy(''); }
  };

  const field = 'w-full px-3 py-2.5 border border-[#E2DDD5] rounded-xl text-sm bg-white';
  const live = banners.find((b) => b.active);

  return (
    <section className="mt-5 bg-white border border-[#E2DDD5] rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="font-normal flex items-center gap-2"><MessageCircle className="w-4 h-4 text-[#1F6F78]" />Messages to members</h2>
        <div role="tablist" className="flex rounded-xl border border-[#E2DDD5] overflow-hidden">
          {(['email', 'banner'] as const).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => { setMode(k); setNote(''); }}
              className={`px-3 min-h-[40px] text-sm ${mode === k ? 'bg-[#13212B] text-white font-semibold' : 'text-[#3D4C56]'}`}>
              {k === 'email' ? 'Email' : 'Site banner'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'email' ? (
        <div className="flex flex-col gap-3">
          {info && !info.configured && (
            <p className="text-sm rounded-xl bg-[#FDF3E7] border border-[#F0D9B5] text-[#8A5A1F] px-3 py-2">Email isn’t connected yet — add the Resend key (RESEND_API_KEY) as a GitHub secret. You can still write and preview.</p>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6A73] mb-2">Who gets it</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <label className="text-xs text-[#5B6A73]">Joined from<input type="date" value={aud.joinedFrom} onChange={(e) => setAud({ ...aud, joinedFrom: e.target.value })} className={`${field} mt-1`} /></label>
              <label className="text-xs text-[#5B6A73]">Joined to<input type="date" value={aud.joinedTo} onChange={(e) => setAud({ ...aud, joinedTo: e.target.value })} className={`${field} mt-1`} /></label>
              <label className="text-xs text-[#5B6A73]">Region
                <select value={aud.region} onChange={(e) => setAud({ ...aud, region: e.target.value, country: '' })} className={`${field} mt-1`}>
                  <option value="">Any</option>{REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <label className="text-xs text-[#5B6A73]">Country
                <select value={aud.country} onChange={(e) => setAud({ ...aud, country: e.target.value })} className={`${field} mt-1`}>
                  <option value="">Any</option>{(aud.region ? countriesIn(aud.region) : ALL_COUNTRIES).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
            </div>
            <p className="text-sm mt-2"><b className="tabular-nums">{count ?? '…'}</b> {count === 1 ? 'member' : 'members'} will get this <span className="text-[#5B6A73]">(never blocked members or people who unsubscribed)</span></p>
          </div>
          <label className="text-sm font-medium">Subject<input value={msg.subject} onChange={(e) => setMsg({ ...msg, subject: e.target.value })} placeholder="Share and Plan has been revamped" className={`${field} mt-1`} /></label>
          <label className="text-sm font-medium">Message
            <textarea value={msg.body} onChange={(e) => setMsg({ ...msg, body: e.target.value })} rows={7} className={`${field} mt-1`}
              placeholder={'Hi {name},\n\nThanks for joining Share and Plan back in August. We’ve rebuilt the site…'} />
            <span className="block text-xs text-[#5B6A73] font-normal mt-1">{'{name}'} becomes each person’s first name. Leave a blank line between paragraphs.</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="text-sm font-medium">Button link (optional)<input value={msg.linkUrl} onChange={(e) => setMsg({ ...msg, linkUrl: e.target.value })} className={`${field} mt-1`} /></label>
            <label className="text-sm font-medium">Button text<input value={msg.linkLabel} onChange={(e) => setMsg({ ...msg, linkLabel: e.target.value })} className={`${field} mt-1`} /></label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!!busy || !msg.subject || !msg.body} onClick={() => post('test')} className="px-4 min-h-[44px] rounded-xl border border-[#E2DDD5] text-sm font-semibold disabled:opacity-50">
              {busy === 'test' ? 'Sending…' : 'Send a test to me'}
            </button>
            <button type="button" disabled={!!busy || !msg.subject || !msg.body || !count} onClick={() => post('send')} className="px-4 min-h-[44px] rounded-xl bg-[#1F6F78] text-white text-sm font-semibold disabled:opacity-50">
              {busy === 'send' ? 'Sending… (keep this page open)' : `Send to ${count ?? 0} ${count === 1 ? 'member' : 'members'}`}
            </button>
          </div>
          {note && <p className="text-sm text-[#16535A]">{note}</p>}
          {info && info.history.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6A73] mb-1">Sent before</p>
              <ul className="text-sm divide-y divide-[#F1EEE8]">
                {info.history.map((h) => (
                  <li key={h.id} className="py-1.5 flex justify-between gap-3">
                    <span className="truncate">{h.subject}</span>
                    <span className="text-[#5B6A73] whitespace-nowrap tabular-nums">{new Date(h.createdAt).toLocaleDateString()} · {h.sentCount} sent{h.failed ? `, ${h.failed} failed` : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {info && <p className="text-xs text-[#8A969D]">Sent from {info.from}. Replies go to your email. Every message includes an unsubscribe link.</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {live && (
            <div className="rounded-xl bg-[#13212B] text-white p-3 flex flex-wrap items-start justify-between gap-2">
              <div><p className="text-xs text-[#9FD3D6] font-semibold">Live now</p><p className="font-bold">{live.title}</p>{live.body && <p className="text-sm text-white/85">{live.body}</p>}</div>
              <button type="button" disabled={!!busy} onClick={() => postBanner('end', live.id)} className="px-3 min-h-[36px] rounded-lg bg-white/10 text-sm font-semibold">End banner</button>
            </div>
          )}
          <p className="text-sm text-[#5B6A73]">A short message at the bottom of the screen for everyone who visits, until they close it. Posting a new one replaces the current one.</p>
          <label className="text-sm font-medium">Headline<input value={banner.title} onChange={(e) => setBanner({ ...banner, title: e.target.value })} placeholder="We’ve had a makeover!" className={`${field} mt-1`} /></label>
          <label className="text-sm font-medium">Message (optional)<textarea value={banner.body} onChange={(e) => setBanner({ ...banner, body: e.target.value })} rows={2} placeholder="New Sandbox, Help me plan, and a cleaner look." className={`${field} mt-1`} /></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="text-sm font-medium">Link (optional)<input value={banner.linkUrl} onChange={(e) => setBanner({ ...banner, linkUrl: e.target.value })} placeholder="/how-to" className={`${field} mt-1`} /></label>
            <label className="text-sm font-medium">Link text<input value={banner.linkLabel} onChange={(e) => setBanner({ ...banner, linkLabel: e.target.value })} className={`${field} mt-1`} /></label>
          </div>
          <button type="button" disabled={!!busy || !banner.title} onClick={() => postBanner('post')} className="self-start px-4 min-h-[44px] rounded-xl bg-[#1F6F78] text-white text-sm font-semibold disabled:opacity-50">
            {live ? 'Replace the live banner' : 'Post banner'}
          </button>
          {note && <p className="text-sm text-[#16535A]">{note}</p>}
        </div>
      )}
    </section>
  );
}

export default function AdminDashboard() {
  const [days, setDays] = useState(30);
  const [s, setS] = useState<Stats | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'denied' | 'error'>('loading');
  const [asTable, setAsTable] = useState(false);

  useEffect(() => {
    setState((x) => (x === 'ok' ? 'ok' : 'loading'));
    fetch(`/api/admin/stats?days=${days}`, { cache: 'no-store' })
      .then(async (r) => {
        if (r.status === 404 || r.status === 401) { setState('denied'); return; }
        if (!r.ok) { setState('error'); return; }
        setS(await r.json());
        setState('ok');
      })
      .catch(() => setState('error'));
  }, [days]);

  if (state === 'denied') {
    return (
      <div className="min-h-screen bg-[#F8F6F1] pt-24 px-4 text-center">
        <h1 className="text-2xl font-normal mb-2">Page not found</h1>
        <Link href="/" className="font-semibold text-[#1F6F78]">Go to the homepage</Link>
      </div>
    );
  }
  if (!s) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] pt-24 flex justify-center text-[#5B6A73]">
        {state === 'error' ? 'Couldn’t load the numbers. Try again in a moment.' : <Loader2 className="w-6 h-6 animate-spin" />}
      </div>
    );
  }

  const m = s.members, t = s.trips, p = s.planning, f = s.feedback;
  const reviewsPct = Math.min(100, Math.round((s.costs.googleReviewsThisMonth / Math.max(1, s.costs.googleReviewsCap)) * 100));
  const period = days === 365 ? 'last 12 months' : `last ${days} days`;

  const tables: [string, Row[]][] = [
    ['Members by region', m.byRegion.rows], ['Members by country', m.byCountry.rows], ['Members by age', m.byAge.rows],
    ['Top countries in shared trips', t.topCountries], ['Top cities in shared trips', t.topCities], ['Types of trip', t.types],
  ];

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-[#13212B] pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h1 className="text-3xl font-normal tracking-tight">Site dashboard</h1>
            <p className="text-sm text-[#5B6A73]">Only you can see this page · updated {new Date(s.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Time period" className="flex rounded-xl border border-[#E2DDD5] bg-white overflow-hidden">
              {PERIODS.map((d) => (
                <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)}
                  className={`px-3 min-h-[40px] text-sm ${days === d ? 'bg-[#13212B] text-white font-semibold' : 'text-[#3D4C56] hover:bg-[#F6F3EE]'}`}>
                  {d === 365 ? '12 mo' : `${d} days`}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setAsTable((v) => !v)} className="inline-flex items-center px-3 min-h-[40px] rounded-xl border border-[#E2DDD5] bg-white text-sm">
              {asTable ? <><BarChart3 className="w-4 h-4 mr-1.5" /> Charts</> : <><Table2 className="w-4 h-4 mr-1.5" /> Table view</>}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <Tile label="Members" value={m.total} sub={`+${m.new} in the ${period}`} />
          <Tile label="Shared trips" value={t.shared} sub={`+${t.newShared} in the ${period}`} />
          <Tile label="Planned trips" value={p.sandboxTrips} sub={`${p.savedPlaces} places saved`} />
          <Tile label="Feedback comments" value={f.comments} sub={`${f.openTrips} trips open · ${f.accepted} accepted`} />
        </div>

        {asTable ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tables.map(([title, rows]) => (
              <section key={title} className="bg-white border border-[#E2DDD5] rounded-2xl p-4">
                <h2 className="font-normal mb-2">{title}</h2>
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-[#5B6A73]"><th className="font-medium py-1">Name</th><th className="font-medium py-1 text-right">Count</th></tr></thead>
                  <tbody>
                    {rows.length ? rows.map((r) => (
                      <tr key={r.label} className="border-t border-[#F1EEE8]"><td className="py-1.5">{r.label}</td><td className="py-1.5 text-right tabular-nums">{r.count}</td></tr>
                    )) : <tr><td className="py-1.5 text-[#5B6A73]" colSpan={2}>Nothing yet</td></tr>}
                  </tbody>
                </table>
              </section>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="New members per week" icon={<Users className="w-4 h-4 text-[#1F6F78]" />}>
              <Weekly data={m.weekly} label="new members" />
            </Card>
            <Card title="New shared trips per week" icon={<MapIcon className="w-4 h-4 text-[#1F6F78]" />}>
              <Weekly data={t.weekly} label="trips shared" />
            </Card>
            <Card title="Where members are from" icon={<Users className="w-4 h-4 text-[#1F6F78]" />}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6A73] mb-2">Region</p>
              <BarList rows={m.byRegion.rows} hidden={m.byRegion.hidden} />
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6A73] mt-4 mb-2">Country</p>
              <BarList rows={m.byCountry.rows} hidden={m.byCountry.hidden} />
            </Card>
            <Card title="Members’ ages" icon={<Users className="w-4 h-4 text-[#1F6F78]" />}>
              <BarList rows={m.byAge.rows} hidden={m.byAge.hidden} />
            </Card>
            <Card title="Most-shared countries" icon={<MapIcon className="w-4 h-4 text-[#1F6F78]" />}>
              <BarList rows={t.topCountries} unit=" trips" />
            </Card>
            <Card title="Most-shared cities" icon={<MapIcon className="w-4 h-4 text-[#1F6F78]" />}>
              <BarList rows={t.topCities} unit=" trips" />
            </Card>
            <Card title="Trips" icon={<MapIcon className="w-4 h-4 text-[#1F6F78]" />}>
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                {[['Shared', t.shared], ['Drafts', t.drafts], ['Private', t.private]].map(([l, n]) => (
                  <div key={l as string} className="bg-[#F6F3EE] rounded-xl py-2.5"><p className="text-xl font-extrabold tabular-nums">{n}</p><p className="text-xs text-[#5B6A73]">{l}</p></div>
                ))}
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6A73] mb-2">Types of trip</p>
              <BarList rows={t.types} />
            </Card>
            <Card title="Planning and feedback" icon={<Package className="w-4 h-4 text-[#1F6F78]" />}>
              <ul className="text-sm flex flex-col gap-2">
                <li className="flex justify-between"><span>New planned trips ({period})</span><b className="tabular-nums">{p.newSandboxTrips}</b></li>
                <li className="flex justify-between"><span>Places saved ({period})</span><b className="tabular-nums">{p.newSavedPlaces}</b></li>
                <li className="flex justify-between"><span>Trips asking for advice</span><b className="tabular-nums">{f.openTrips}</b></li>
                <li className="flex justify-between"><span>New comments ({period})</span><b className="tabular-nums">{f.newComments}</b></li>
                <li className="flex justify-between"><span>Suggestions accepted (all time)</span><b className="tabular-nums">{f.accepted}</b></li>
              </ul>
            </Card>
            <Card title="Costs and health" icon={<ShieldCheck className="w-4 h-4 text-[#1F6F78]" />} wide>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Google review lookups this month</span>
                    <span className="tabular-nums">{s.costs.googleReviewsThisMonth} of {s.costs.googleReviewsCap}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#F1EEE8]"><div className="h-full rounded-full" style={{ width: `${Math.max(reviewsPct ? 2 : 0, reviewsPct)}%`, background: ACCENT }} /></div>
                  <p className="text-xs text-[#5B6A73] mt-1">The first 1,000 each month are free; the site stops at the cap.</p>
                </div>
                <div className="text-sm">
                  <p className="flex justify-between"><span>Last database backup</span>
                    <span className={s.health.backup.ok === false ? 'text-[#B4532A] font-semibold' : ''}>
                      {s.health.backup.ok === false ? '⚠ Last backup failed' : s.health.backup.at ? `✓ ${s.health.backup.at}` : 'Not run yet'}
                    </span>
                  </p>
                  <p className="text-xs text-[#5B6A73] mt-1">Backups run nightly at 03:17 server time and are kept for 30 days.</p>
                </div>
              </div>
            </Card>
          </div>
        )}
        <Messages />
        <Accounts />
        <p className="text-xs text-[#8A969D] mt-5">Charts show totals only. Groups of fewer than 5 members are combined so no one can be singled out. Test accounts aren’t counted.</p>
      </div>
    </div>
  );
}
