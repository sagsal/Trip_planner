'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, FileSpreadsheet, AlertTriangle, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { readSpreadsheet, readFileAsText, rowsToTrip, IMPORT_STORAGE_KEY, type ImportedTrip } from '@/lib/tripImport';

export default function ImportTripPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [trip, setTrip] = useState<ImportedTrip | null>(null);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [readBy, setReadBy] = useState<'ai' | 'template' | null>(null);
  const [pasted, setPasted] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('user')) { router.push('/login?next=/trips/import'); return; }
    // A trip read from the member's own email (trips@tripshare.org): show it to check
    const pending = new URLSearchParams(window.location.search).get('pending');
    if (pending) {
      setReading(true);
      setFileName('Your email');
      fetch(`/api/import/pending?id=${encodeURIComponent(pending)}`, { cache: 'no-store' })
        .then(async (r) => {
          const d = await r.json().catch(() => ({}));
          if (!r.ok || !d.trip) throw new Error(d.error || 'This draft wasn’t found.');
          setTrip({ warnings: [], ...d.trip });
          setReadBy('ai');
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'This draft wasn’t found.'))
        .finally(() => setReading(false));
    }
    fetch('/api/import/ai')
      .then((r) => r.json())
      .then((d) => setAiAvailable(!!d.available))
      .catch(() => setAiAvailable(false));
  }, [router]);

  const isSpreadsheet = (name: string) => /\.(xlsx|xlsm|csv|tsv)$/i.test(name);

  // Start an AI import, then check every few seconds until it's finished (big files can take a few minutes)
  const readWithAi = async (text: string, name: string): Promise<ImportedTrip> => {
    const res = await fetch('/api/import/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, fileName: name }),
    });
    const start = await res.json().catch(() => ({}));
    if (!res.ok || !start.jobId) throw new Error(start.error || 'The AI couldn’t read this file.');

    const deadline = Date.now() + 6 * 60_000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 3000));
      const poll = await fetch(`/api/import/ai?job=${encodeURIComponent(start.jobId)}`, { cache: 'no-store' })
        .then((r) => r.json())
        .catch(() => ({ status: 'running' })); // a brief network hiccup: keep waiting
      if (poll.status === 'done' && poll.trip) return poll.trip as ImportedTrip;
      if (poll.status === 'error') throw new Error(poll.error || 'The AI couldn’t read this file.');
    }
    throw new Error('The AI took too long. Please try again, or split the file into smaller parts.');
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setTrip(null);
    setError('');
    setReadBy(null);
    setReading(true);
    try {
      if (aiAvailable) {
        try {
          const text = await readFileAsText(file);
          setTrip(await readWithAi(text, file.name));
          setReadBy('ai');
          return;
        } catch (aiError) {
          // AI unavailable or failed: fall back to the template reader for spreadsheets.
          // If that can't read it either, show the AI's reason (more useful than the template's).
          if (!isSpreadsheet(file.name)) throw aiError;
          let fallback: ImportedTrip;
          try {
            fallback = rowsToTrip(await readSpreadsheet(file));
          } catch {
            throw aiError;
          }
          fallback.warnings.unshift(
            `The AI reader wasn’t available (${aiError instanceof Error ? aiError.message : 'error'}), so this was read using the template columns.`
          );
          setTrip(fallback);
          setReadBy('template');
          return;
        }
      }
      if (!isSpreadsheet(file.name)) {
        throw new Error('Word documents need the AI reader, which isn’t set up yet. Please upload an Excel or CSV file.');
      }
      setTrip(rowsToTrip(await readSpreadsheet(file)));
      setReadBy('template');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this file.');
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handlePasted = async () => {
    if (!pasted.trim()) return;
    setFileName('Pasted text');
    setTrip(null);
    setError('');
    setReadBy(null);
    setReading(true);
    try {
      setTrip(await readWithAi(pasted, 'pasted text'));
      setReadBy('ai');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this text.');
    } finally {
      setReading(false);
    }
  };

  const continueToForm = () => {
    if (!trip) return;
    sessionStorage.setItem(IMPORT_STORAGE_KEY, JSON.stringify(trip));
    router.push('/trips/new?import=1');
  };

  const count = (c: ImportedTrip['cities'][number], key: 'restaurants' | 'activities') =>
    c.days.reduce((n, d) => n + d[key].length, 0);

  const BTN = 'inline-flex items-center justify-center gap-2 min-h-[48px] px-5 font-mono text-xs tracking-[0.1em] uppercase disabled:opacity-50';
  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept=".xlsx,.xlsm,.csv,.tsv,.txt,.docx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      className="sr-only"
      onChange={(e) => handleFile(e.target.files?.[0])}
    />
  );

  return (
    <div className="min-h-screen bg-[#F8F6F1] text-[#13212B] pt-16">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-12">
        <Link href="/account" className="inline-flex items-center gap-1 font-mono text-xs tracking-[0.1em] text-[#5B6A73] hover:text-[#13212B] py-2 mb-4">
          <ArrowLeft className="w-4 h-4" /> MY JOURNAL
        </Link>
        <p className="font-mono text-xs tracking-[0.14em] text-[#1F6F78] mb-3">SHARE A TRIP IN 5 MINUTES</p>
        <h1 className="text-[40px] sm:text-[52px] font-normal leading-[1.05] tracking-[-0.02em] mb-4">Paste your notes. We’ll do the typing.</h1>
        <p className="font-serif text-xl text-[#3A4A54] mb-8">
          An itinerary email, notes from your phone, a message you sent a friend: paste whatever you have. AI fills in the cities, days, hotels, restaurants and activities, and you check it before anything is shared.
        </p>

        {/* The main way: paste */}
        {aiAvailable ? (
          <div className="border border-[#13212B] bg-white p-4 sm:p-5 mb-6">
            <label htmlFor="notes" className="block font-serif text-[22px] mb-2">Your trip notes</label>
            <textarea
              id="notes"
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={9}
              placeholder={'e.g. Mexico City, March 2025, 5 days. Stayed at Hotel Carlota in Juárez (great with teens). Day 1: lunch at Contramar, the tuna tostadas. Frida Kahlo museum, book ahead. Skip the hop-on bus…'}
              className="w-full px-3 py-3 border border-[#E2DDD5] text-base leading-relaxed bg-[#FFFFFF] focus:outline-none focus:border-[#13212B]"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button" onClick={handlePasted} disabled={reading || !pasted.trim()} className={`${BTN} bg-[#13212B] text-[#F8F6F1] hover:bg-[#24394A]`}>
                <Sparkles className="w-4 h-4" /> {reading ? 'Reading your trip…' : 'Turn this into a trip'}
              </button>
              <span className="text-sm text-[#5B6A73]">Short notes are fine. Three honest places beat none.</span>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-start gap-2 border border-[#13212B] bg-white p-5 mb-6 cursor-pointer">
            <span className="font-serif text-[22px]">Upload your spreadsheet</span>
            <span className="text-sm text-[#5B6A73]">Excel (.xlsx) or CSV, one row per hotel, restaurant or activity.</span>
            <span className={`${BTN} border border-[#13212B] mt-1`}><Upload className="w-4 h-4" /> Choose a file</span>
            {fileInput}
          </label>
        )}

        {reading && <p className="font-mono text-xs tracking-[0.1em] text-[#1F6F78] mb-4">READING YOUR TRIP… THIS CAN TAKE UP TO A MINUTE</p>}
        {fileName && !reading && !error && trip && (
          <p className="mb-4 text-sm text-[#5B6A73] flex items-center gap-1"><FileSpreadsheet className="w-4 h-4" /> Read from: {fileName}</p>
        )}
        {error && <p className="mb-6 text-sm text-red-800 bg-red-50 border border-red-200 px-3 py-2">{error}</p>}

        {/* The result */}
        {trip && (
          <div className="border border-[#1F6F78] bg-white p-4 sm:p-5 mb-8">
            <p className="font-mono text-[11px] tracking-[0.12em] text-[#1F6F78] mb-2">CHECK WHAT WE FOUND</p>
            <p className="font-serif text-[26px] leading-tight">{trip.title || 'Untitled trip'}</p>
            {trip.startDate && trip.endDate && <p className="font-mono text-xs text-[#5B6A73] mt-1">{trip.startDate} TO {trip.endDate}</p>}
            {readBy === 'ai' && <p className="text-sm text-[#5B6A73] mt-2">Read by AI. It can make mistakes, and you can fix anything on the next page.</p>}
            <ul className="mt-4 border-t border-[#13212B]">
              {trip.cities.map((c, i) => (
                <li key={i} className="py-3 border-b border-[#E2DDD5] flex flex-wrap gap-x-4 gap-y-1 items-baseline">
                  <span className="font-serif text-xl">{c.name}{c.country ? `, ${c.country}` : ''}</span>
                  <span className="font-mono text-[11px] tracking-[0.06em] text-[#5B6A73] uppercase">
                    {c.numberOfDays} {c.numberOfDays === 1 ? 'day' : 'days'} · {c.hotels.length} {c.hotels.length === 1 ? 'stay' : 'stays'} · {count(c, 'restaurants')} {count(c, 'restaurants') === 1 ? 'restaurant' : 'restaurants'} · {count(c, 'activities')} {count(c, 'activities') === 1 ? 'thing to do' : 'things to do'}
                  </span>
                </li>
              ))}
            </ul>
            {trip.warnings.length > 0 && (
              <div className="mt-4 border border-[#EADFC8] bg-[#FBF6EC] px-4 py-3">
                <p className="text-sm font-medium text-[#8A6D3B] flex items-center gap-1 mb-1"><AlertTriangle className="w-4 h-4" /> Worth checking</p>
                <ul className="list-disc pl-5 text-sm text-[#8A6D3B] space-y-0.5">
                  {trip.warnings.slice(0, 12).map((w, i) => <li key={i}>{w}</li>)}
                  {trip.warnings.length > 12 && <li>…and {trip.warnings.length - 12} more</li>}
                </ul>
              </div>
            )}
            <button type="button" onClick={continueToForm} className={`${BTN} mt-5 bg-[#13212B] text-[#F8F6F1] hover:bg-[#24394A]`}>
              Check it and add what you’d skip <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Other ways */}
        <h2 className="font-mono text-[11px] tracking-[0.14em] text-[#5B6A73] font-normal pb-3 border-b border-[#13212B]">OTHER WAYS TO SHARE</h2>
        <ul>
          {aiAvailable && (
            <li className="py-4 border-b border-[#E2DDD5] flex flex-wrap gap-x-6 gap-y-2 items-center justify-between">
              <div className="min-w-0 flex-[1_1_260px]">
                <p className="font-serif text-xl">Upload a file</p>
                <p className="text-sm text-[#5B6A73]">A spreadsheet or Word document, in any layout.</p>
              </div>
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
                className={`${BTN} border border-[#13212B] cursor-pointer hover:bg-[#13212B] hover:text-[#F8F6F1]`}
              >
                <Upload className="w-4 h-4" /> Choose a file
                {fileInput}
              </label>
            </li>
          )}
          <li className="py-4 border-b border-[#E2DDD5] flex flex-wrap gap-x-6 gap-y-2 items-center justify-between">
            <div className="min-w-0 flex-[1_1_260px]">
              <p className="font-serif text-xl">Email it to us</p>
              <p className="text-sm text-[#5B6A73]">Forward an itinerary or booking email to <b className="text-[#13212B]">trips@tripshare.org</b> from the address you signed up with. We’ll email you a draft to check.</p>
            </div>
            <a href="mailto:trips@tripshare.org?subject=My%20trip" className={`${BTN} border border-[#13212B] hover:bg-[#13212B] hover:text-[#F8F6F1]`}>Open email</a>
          </li>
          <li className="py-4 border-b border-[#E2DDD5] flex flex-wrap gap-x-6 gap-y-2 items-center justify-between">
            <div className="min-w-0 flex-[1_1_260px]">
              <p className="font-serif text-xl">Talk it through</p>
              <p className="text-sm text-[#5B6A73]">No notes? Tell us about it in a 15-minute chat and we’ll write it up for you to check.</p>
            </div>
            <a href="mailto:hello@tripshare.org?subject=Can%20you%20write%20up%20my%20trip%3F" className={`${BTN} border border-[#13212B] hover:bg-[#13212B] hover:text-[#F8F6F1]`}>Ask for a chat</a>
          </li>
          <li className="py-4 border-b border-[#E2DDD5] flex flex-wrap gap-x-6 gap-y-2 items-center justify-between">
            <div className="min-w-0 flex-[1_1_260px]">
              <p className="font-serif text-xl">Type it yourself</p>
              <p className="text-sm text-[#5B6A73]">Fill in the trip form city by city.</p>
            </div>
            <Link href="/trips/new" className={`${BTN} border border-[#13212B] hover:bg-[#13212B] hover:text-[#F8F6F1]`}>Open the form</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
