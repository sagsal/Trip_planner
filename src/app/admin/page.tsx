'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Loader2, Users, Map as MapIcon, Package, MessageCircle, ShieldCheck, Table2, BarChart3 } from 'lucide-react';

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
    <div className="bg-white border border-[#ECE7DF] rounded-2xl p-4">
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
      <div className="flex items-end gap-1.5 h-28 border-b border-[#E2DCD2]" role="img" aria-label={`${label} per week, last ${data.length} weeks`}>
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
    <section className={`bg-white border border-[#ECE7DF] rounded-2xl p-4 sm:p-5 ${wide ? 'lg:col-span-2' : ''}`}>
      <h2 className="font-bold mb-3 flex items-center gap-2">{icon}{title}</h2>
      {children}
    </section>
  );
}

interface Member {
  id: string; name: string; email: string; joined: string; from: string | null; age: string | null;
  shared: number; drafts: number; private: number; planned: number; saved: number; comments: number;
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
  const shown = (list || []).filter((m) => !q || `${m.name} ${m.email} ${m.from || ''}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <section className="mt-5 bg-white border border-[#ECE7DF] rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold flex items-center gap-2"><Users className="w-4 h-4 text-[#1F6F78]" />Accounts{list ? ` (${list.length})` : ''}</h2>
        <button type="button" onClick={() => setOpen((v) => !v)} className="px-3 min-h-[40px] rounded-xl border border-[#E2DCD2] text-sm font-semibold">
          {open ? 'Hide accounts' : 'Show all accounts'}
        </button>
      </div>
      {open && (
        <div className="mt-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or country" aria-label="Search accounts"
            className="w-full sm:w-80 px-3 py-2 border border-[#E2DCD2] rounded-xl text-sm mb-3" />
          {!list ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#8A969D]" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="text-left text-[#5B6A73] border-b border-[#ECE7DF]">
                    <th className="font-medium py-2 pr-3">Name</th>
                    <th className="font-medium py-2 pr-3">Email</th>
                    <th className="font-medium py-2 pr-3">Joined</th>
                    <th className="font-medium py-2 pr-3">From</th>
                    <th className="font-medium py-2 pr-3">Age</th>
                    <th className="font-medium py-2 pr-3 text-right" title="Shared / drafts / private">Trips</th>
                    <th className="font-medium py-2 pr-3 text-right">Planned</th>
                    <th className="font-medium py-2 pr-3 text-right">Saved</th>
                    <th className="font-medium py-2 text-right">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((m) => (
                    <tr key={m.id} className="border-b border-[#F1EEE8] align-top">
                      <td className="py-2 pr-3 font-semibold">{m.name}</td>
                      <td className="py-2 pr-3 break-all">{m.email}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{new Date(m.joined).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td className="py-2 pr-3">{m.from || <span className="text-[#8A969D]">—</span>}</td>
                      <td className="py-2 pr-3">{m.age || <span className="text-[#8A969D]">—</span>}</td>
                      <td className="py-2 pr-3 text-right tabular-nums" title={`${m.shared} shared, ${m.drafts} drafts, ${m.private} private`}>{m.shared} / {m.drafts} / {m.private}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{m.planned}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{m.saved}</td>
                      <td className="py-2 text-right tabular-nums">{m.comments}</td>
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
      <div className="min-h-screen bg-[#FBFAF7] pt-24 px-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <Link href="/" className="font-semibold text-[#1F6F78]">Go to the homepage</Link>
      </div>
    );
  }
  if (!s) {
    return (
      <div className="min-h-screen bg-[#FBFAF7] pt-24 flex justify-center text-[#5B6A73]">
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
    <div className="min-h-screen bg-[#FBFAF7] text-[#13212B] pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Site dashboard</h1>
            <p className="text-sm text-[#5B6A73]">Only you can see this page · updated {new Date(s.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Time period" className="flex rounded-xl border border-[#E2DCD2] bg-white overflow-hidden">
              {PERIODS.map((d) => (
                <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)}
                  className={`px-3 min-h-[40px] text-sm ${days === d ? 'bg-[#13212B] text-white font-semibold' : 'text-[#3D4C56] hover:bg-[#F6F3EE]'}`}>
                  {d === 365 ? '12 mo' : `${d} days`}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setAsTable((v) => !v)} className="inline-flex items-center px-3 min-h-[40px] rounded-xl border border-[#E2DCD2] bg-white text-sm">
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
              <section key={title} className="bg-white border border-[#ECE7DF] rounded-2xl p-4">
                <h2 className="font-bold mb-2">{title}</h2>
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
                <li className="flex justify-between"><span>Trips open for feedback</span><b className="tabular-nums">{f.openTrips}</b></li>
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
        <Accounts />
        <p className="text-xs text-[#8A969D] mt-5">Charts show totals only. Groups of fewer than 5 members are combined so no one can be singled out. Test accounts aren’t counted.</p>
      </div>
    </div>
  );
}
