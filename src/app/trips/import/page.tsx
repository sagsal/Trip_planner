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
    if (!localStorage.getItem('user')) router.push('/login');
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

  return (
    <div className="min-h-screen bg-[#F6F2EC] pt-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/account" className="inline-flex items-center text-sm text-[#5B6B75] hover:text-[#2F4A5C] mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to my account
        </Link>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#2F4A5C] mb-3">Import a trip from a spreadsheet</h1>
        <p className="text-[#5B6B75] mb-8">
          {aiAvailable
            ? 'Upload your trip notes in any layout: an Excel or CSV spreadsheet, or a Word document. Our AI reader works out the cities, days, hotels, restaurants and activities and fills in the trip form for you to check. Nothing is saved until you click Save.'
            : 'Upload an Excel or CSV file with one row per hotel, restaurant or activity. We’ll fill in the trip form for you to check, and nothing is saved until you click Save.'}
        </p>

        {/* Step 2: upload */}
        <div className="bg-white rounded-xl border border-[#E4DED4] p-5 mb-4">
          <p className="font-medium text-[#2F4A5C] mb-3 flex items-center">
            {aiAvailable && <Sparkles className="w-4 h-4 mr-1.5 text-[#4A6878]" />}
            {aiAvailable ? 'Upload your trip notes' : 'Upload your spreadsheet'}
          </p>
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
            className="flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed border-[#D9D2C7] bg-[#FBF9F5] px-6 py-10 cursor-pointer hover:border-[#4A6878] transition-colors"
          >
            <Upload className="w-8 h-8 text-[#4A6878] mb-2" />
            <span className="text-[#2F4A5C] font-medium">
              {reading ? (aiAvailable ? 'Reading your trip… big files can take a few minutes' : 'Reading…') : 'Click to choose a file, or drag it here'}
            </span>
            <span className="text-xs text-[#6B7A83] mt-1">{aiAvailable ? 'Excel (.xlsx), CSV or Word (.docx)' : 'Excel (.xlsx) or CSV'}</span>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xlsm,.csv,.tsv,.txt,.docx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
          {fileName && !reading && (
            <p className="mt-2 text-sm text-[#6B7A83] flex items-center">
              <FileSpreadsheet className="w-4 h-4 mr-1" /> {fileName}
            </p>
          )}
          {error && (
            <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          {aiAvailable && (
            <div className="mt-5">
              <p className="text-sm text-[#5B6B75] mb-2">…or paste your notes (from an email, notes app, etc.)</p>
              <textarea
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                rows={5}
                placeholder={'e.g. Mexico City, 5–8 March. Stayed at Hotel Carlota. Day 1 lunch at Contramar (amazing tuna tostadas), Frida Kahlo museum…'}
                className="w-full px-3 py-2 border border-[#D9D2C7] rounded-lg text-sm text-black focus:ring-2 focus:ring-[#4A6878] focus:border-transparent"
              />
              <button
                type="button"
                onClick={handlePasted}
                disabled={reading || !pasted.trim()}
                className="mt-2 inline-flex items-center px-4 py-2 bg-[#4A6878] text-white rounded-lg hover:bg-[#3F5B6A] text-sm disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 mr-1.5" /> Read my notes
              </button>
            </div>
          )}
        </div>

        {/* Step 3: preview */}
        {trip && (
          <div className="bg-white rounded-xl border border-[#E4DED4] p-5">
            <p className="font-medium text-[#2F4A5C] mb-1">Check what we found</p>
            {readBy === 'ai' && (
              <p className="text-xs text-[#6B7A83] mb-3">Read by AI. It can make mistakes, so you’ll be able to fix anything in the form.</p>
            )}
            <p className="text-[#2F4A5C]">
              <span className="font-semibold">{trip.title || 'Untitled trip'}</span>
              {trip.startDate && trip.endDate && (
                <span className="text-[#6B7A83]"> · {trip.startDate} to {trip.endDate}</span>
              )}
            </p>
            <ul className="mt-3 divide-y divide-[#EEE8DF] border border-[#EEE8DF] rounded-lg">
              {trip.cities.map((c, i) => (
                <li key={i} className="px-4 py-3 text-sm">
                  <span className="font-medium text-[#2F4A5C]">{c.name}</span>
                  {c.country && <span className="text-[#6B7A83]">, {c.country}</span>}
                  <span className="text-[#6B7A83]">
                    {' '}· {c.numberOfDays} {c.numberOfDays === 1 ? 'day' : 'days'} · {c.hotels.length} hotel
                    {c.hotels.length === 1 ? '' : 's'} · {count(c, 'restaurants')} restaurant
                    {count(c, 'restaurants') === 1 ? '' : 's'} · {count(c, 'activities')} activit
                    {count(c, 'activities') === 1 ? 'y' : 'ies'}
                  </span>
                </li>
              ))}
            </ul>

            {trip.warnings.length > 0 && (
              <div className="mt-4 bg-[#FBF6EC] border border-[#EADFC8] rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-[#8A6D3B] flex items-center mb-1">
                  <AlertTriangle className="w-4 h-4 mr-1" /> Worth checking
                </p>
                <ul className="list-disc pl-5 text-sm text-[#8A6D3B] space-y-0.5">
                  {trip.warnings.slice(0, 12).map((w, i) => <li key={i}>{w}</li>)}
                  {trip.warnings.length > 12 && <li>…and {trip.warnings.length - 12} more</li>}
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={continueToForm}
              className="mt-5 inline-flex items-center px-5 py-2.5 bg-[#4A6878] text-white rounded-lg hover:bg-[#3F5B6A] transition-colors"
            >
              Fill in the trip form <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
