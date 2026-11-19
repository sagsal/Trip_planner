import { NextRequest, NextResponse } from 'next/server';
import { ANTHROPIC_API_KEY, runImport } from '@/lib/importAi';

/** AI trip import: starts a background job (see src/lib/importAi.ts) and reports on it. */
export const dynamic = 'force-dynamic';

/*
 * Reading a big spreadsheet can take Claude more than a minute, longer than the
 * web server waits for one request. So POST starts a background job and returns
 * its id right away; the page then asks GET ?job=ID every few seconds until done.
 * Jobs live in memory (one server process) and are forgotten after 30 minutes.
 */
type Job = { status: 'running' | 'done' | 'error'; trip?: any; error?: string; created: number };
const g = globalThis as unknown as { __tripImportJobs?: Map<string, Job> };
const jobs: Map<string, Job> = g.__tripImportJobs || (g.__tripImportJobs = new Map());
function cleanupJobs() {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, job] of jobs) if (job.created < cutoff) jobs.delete(id);
}
/** GET: whether AI import is set up, or (with ?job=ID) the status of an import. */
export async function GET(request: NextRequest) {
  const id = new URL(request.url).searchParams.get('job');
  if (!id) return NextResponse.json({ available: !!ANTHROPIC_API_KEY });
  const job = jobs.get(id);
  if (!job) return NextResponse.json({ status: 'error', error: 'This import has expired. Please upload the file again.' }, { status: 404 });
  if (job.status === 'running') return NextResponse.json({ status: 'running' });
  if (job.status === 'error') return NextResponse.json({ status: 'error', error: job.error });
  return NextResponse.json({ status: 'done', trip: job.trip });
}

export async function POST(request: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI import is not set up yet.' }, { status: 503 });
  }

  let text = '';
  let fileName = '';
  try {
    const body = await request.json();
    text = typeof body?.text === 'string' ? body.text : '';
    fileName = typeof body?.fileName === 'string' ? body.fileName.slice(0, 200) : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  text = text.trim();
  if (!text) return NextResponse.json({ error: 'The file looks empty.' }, { status: 400 });

  cleanupJobs();
  const jobId = crypto.randomUUID();
  jobs.set(jobId, { status: 'running', created: Date.now() });
  // Run in the background; the page polls GET ?job=ID
  runImport(text, fileName)
    .then((result) => jobs.set(jobId, { ...result, created: Date.now() }))
    .catch((e) => jobs.set(jobId, { status: 'error', error: e instanceof Error ? e.message : 'The AI couldn’t read this file right now.', created: Date.now() }));
  return NextResponse.json({ jobId });
}

