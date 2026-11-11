/**
 * Import a trip from a spreadsheet (Excel .xlsx or .csv), entirely in the browser.
 *
 * One row per place. Columns (any order, names are flexible):
 *   Trip Title | Start Date | End Date | City | Country | Day | Type | Name | Address | Rating | Review
 * Type is Hotel, Restaurant or Activity. Trip Title / dates only need to be on the first row.
 *
 * No extra packages: .xlsx files are zip archives of XML, read with the browser's
 * built-in DecompressionStream and DOMParser.
 */

export interface ImportedPlace {
  name: string;
  location: string;
  rating: number;
  review: string;
  imageUrl?: string | null; // e.g. from My Travel Sandbox
  webUrl?: string | null;
  stayType?: 'rental' | null;
}

export interface ImportedCity {
  name: string;
  country: string;
  numberOfDays: number;
  hotels: ImportedPlace[];
  days: { dayNumber: number; restaurants: ImportedPlace[]; activities: ImportedPlace[] }[];
}

export interface ImportedTrip {
  title: string;
  startDate: string; // YYYY-MM-DD or ''
  endDate: string;
  cities: ImportedCity[];
  warnings: string[];
  rowCount: number;
  source?: 'file' | 'sandbox';
  region?: string;
  tripType?: string;
}

/* ---------------------------- reading files ---------------------------- */

export async function readSpreadsheet(file: File): Promise<string[][]> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.csv') || lower.endsWith('.tsv') || lower.endsWith('.txt') || file.type === 'text/csv') {
    return parseCsv(await file.text());
  }
  if (lower.endsWith('.xlsx') || lower.endsWith('.xlsm')) {
    return readXlsx(await file.arrayBuffer());
  }
  if (lower.endsWith('.xls')) {
    throw new Error('Old .xls files can’t be read. In Excel, choose File → Save As → Excel Workbook (.xlsx) or CSV, then upload that.');
  }
  throw new Error('Please upload an Excel (.xlsx) or CSV file.');
}

export function parseCsv(text: string): string[][] {
  text = text.replace(/^﻿/, '');
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const counts = { ',': (firstLine.match(/,/g) || []).length, ';': (firstLine.match(/;/g) || []).length, '\t': (firstLine.match(/\t/g) || []).length };
  const delim = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][1] > 0
    ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    : ',') as string;

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else { inQuotes = false; }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      row.push(cell); cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row); }
  return rows;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser can’t read Excel files. Please save the sheet as CSV and upload that, or use a newer browser.');
  }
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

const XLSX_PARTS = /^xl\/(sharedStrings\.xml|workbook\.xml|_rels\/workbook\.xml\.rels|worksheets\/[^/]+\.xml)$/;

async function unzip(buf: ArrayBuffer, wanted: RegExp = XLSX_PARTS): Promise<Map<string, Uint8Array>> {
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  // Find "end of central directory" record
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('This doesn’t look like an Excel (.xlsx) file.');
  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const files = new Map<string, Uint8Array>();
  const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (view.getUint32(p, true) !== 0x02014b50) break;
    const method = view.getUint16(p + 10, true);
    const compSize = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const localOffset = view.getUint32(p + 42, true);
    const name = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;

    if (!wanted.test(name)) continue;
    const lNameLen = view.getUint16(localOffset + 26, true);
    const lExtraLen = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + lNameLen + lExtraLen;
    const raw = bytes.subarray(start, start + compSize);
    files.set(name, method === 0 ? raw : await inflateRaw(raw));
  }
  return files;
}

function colIndex(ref: string): number {
  const letters = (ref.match(/^[A-Z]+/) || ['A'])[0];
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

async function readXlsx(buf: ArrayBuffer): Promise<string[][]> {
  const sheets = await readXlsxSheets(buf, true);
  return sheets[0]?.rows || [];
}

/** Every sheet (tab) in an .xlsx file, in workbook order. */
export async function readXlsxSheets(buf: ArrayBuffer, firstOnly = false): Promise<{ name: string; rows: string[][] }[]> {
  const files = await unzip(buf);
  const dec = new TextDecoder();
  const parse = (name: string) => {
    const f = files.get(name);
    return f ? new DOMParser().parseFromString(dec.decode(f), 'application/xml') : null;
  };

  // Shared strings
  const shared: string[] = [];
  const ss = parse('xl/sharedStrings.xml');
  if (ss) {
    for (const si of Array.from(ss.getElementsByTagName('si'))) {
      shared.push(Array.from(si.getElementsByTagName('t')).map((t) => t.textContent || '').join(''));
    }
  }

  // Sheets in workbook order, resolved through the workbook relationships
  const wb = parse('xl/workbook.xml');
  const rels = parse('xl/_rels/workbook.xml.rels');
  const RELS_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const targets: { name: string; path: string }[] = [];
  for (const sh of Array.from(wb?.getElementsByTagName('sheet') || [])) {
    const rid = sh.getAttribute('r:id') || sh.getAttributeNS(RELS_NS, 'id');
    const rel = rels && Array.from(rels.getElementsByTagName('Relationship')).find((r) => r.getAttribute('Id') === rid);
    const target = rel?.getAttribute('Target');
    if (!target) continue;
    const path = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`;
    if (files.has(path)) targets.push({ name: sh.getAttribute('name') || path, path });
  }
  if (targets.length === 0) {
    for (const k of Array.from(files.keys()).filter((k) => k.startsWith('xl/worksheets/')).sort()) {
      targets.push({ name: k.replace(/^.*\//, '').replace(/\.xml$/, ''), path: k });
    }
  }
  if (targets.length === 0) throw new Error('Couldn’t find a sheet in this Excel file.');

  const out: { name: string; rows: string[][] }[] = [];
  for (const t of firstOnly ? targets.slice(0, 1) : targets) {
    const sheet = parse(t.path);
    if (!sheet) continue;
    const rows: string[][] = [];
    for (const r of Array.from(sheet.getElementsByTagName('row'))) {
      const cells: string[] = [];
      for (const c of Array.from(r.getElementsByTagName('c'))) {
        const idx = colIndex(c.getAttribute('r') || '');
        const type = c.getAttribute('t');
        const v = c.getElementsByTagName('v')[0]?.textContent ?? '';
        let value = v;
        if (type === 's') value = shared[Number(v)] ?? '';
        else if (type === 'inlineStr') value = Array.from(c.getElementsByTagName('t')).map((x) => x.textContent || '').join('');
        else if (type === 'b') value = v === '1' ? 'TRUE' : 'FALSE';
        while (cells.length < idx) cells.push('');
        cells[idx] = value;
      }
      rows.push(cells);
    }
    out.push({ name: t.name, rows });
  }
  return out;
}

/** Plain text of a Word (.docx) document, one paragraph per line (tables as tab-separated rows). */
async function readDocxText(buf: ArrayBuffer): Promise<string> {
  const files = await unzip(buf, /^word\/document\.xml$/);
  const xml = files.get('word/document.xml');
  if (!xml) throw new Error('This doesn’t look like a Word (.docx) document.');
  const doc = new DOMParser().parseFromString(new TextDecoder().decode(xml), 'application/xml');
  const lines: string[] = [];
  const body = doc.getElementsByTagName('w:body')[0] || doc.documentElement;
  const paraText = (p: Element) =>
    Array.from(p.getElementsByTagName('*'))
      .map((n) => (n.tagName === 'w:t' ? n.textContent || '' : n.tagName === 'w:tab' ? '\t' : n.tagName === 'w:br' ? ' ' : ''))
      .join('');
  for (const node of Array.from(body.children)) {
    if (node.tagName === 'w:p') lines.push(paraText(node));
    else if (node.tagName === 'w:tbl') {
      for (const tr of Array.from(node.getElementsByTagName('w:tr'))) {
        lines.push(
          Array.from(tr.getElementsByTagName('w:tc'))
            .map((tc) => Array.from(tc.getElementsByTagName('w:p')).map(paraText).join(' '))
            .join('\t')
        );
      }
    }
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Excel serial dates (e.g. 46143) shown as YYYY-MM-DD so the AI reads them correctly. */
function cellForText(v: string): string {
  if (/^\d{5}(\.\d+)?$/.test(v) && Number(v) > 30000 && Number(v) < 60000) {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(v)) * 86400000);
    return `${v} (${d.toISOString().slice(0, 10)} if this is a date)`;
  }
  return v.replace(/[\t\r\n]+/g, ' ');
}

/**
 * Any supported file as plain text for the AI reader:
 * spreadsheets as tab-separated rows (every tab), Word documents as paragraphs.
 */
export async function readFileAsText(file: File): Promise<string> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.docx')) return readDocxText(await file.arrayBuffer());
  if (lower.endsWith('.doc')) {
    throw new Error('Old .doc files can’t be read. In Word, choose File → Save As → Word Document (.docx), then upload that.');
  }
  if (lower.endsWith('.xlsx') || lower.endsWith('.xlsm')) {
    const sheets = await readXlsxSheets(await file.arrayBuffer());
    return sheets
      .map((sh) => `### Sheet: ${sh.name}\n` + sh.rows.filter((r) => r.some((c) => c && c.trim())).map((r) => r.map(cellForText).join('\t')).join('\n'))
      .join('\n\n');
  }
  if (lower.endsWith('.xls')) {
    throw new Error('Old .xls files can’t be read. In Excel, choose File → Save As → Excel Workbook (.xlsx) or CSV, then upload that.');
  }
  // CSV / TSV / plain text
  const text = await file.text();
  if (lower.endsWith('.csv') || lower.endsWith('.tsv')) {
    return parseCsv(text).filter((r) => r.some((c) => c && c.trim())).map((r) => r.map(cellForText).join('\t')).join('\n');
  }
  return text;
}

/* ------------------------- turning rows into a trip ------------------------- */

const HEADERS: Record<string, string[]> = {
  title: ['triptitle', 'tripname', 'title', 'trip'],
  startDate: ['startdate', 'start', 'from', 'datefrom', 'arrival'],
  endDate: ['enddate', 'end', 'to', 'dateto', 'departure'],
  city: ['city', 'town', 'destination'],
  country: ['country', 'nation'],
  day: ['day', 'daynumber', 'dayno', 'dayof'],
  type: ['type', 'category', 'kind', 'what'],
  name: ['name', 'place', 'placename', 'venue', 'hotelrestaurantactivity'],
  address: ['address', 'location', 'where'],
  rating: ['rating', 'stars', 'score'],
  review: ['review', 'notes', 'note', 'comment', 'comments', 'description'],
};

const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z]/g, '');

function toIsoDate(value: string, warnings: string[]): string {
  const v = (value || '').trim();
  if (!v) return '';
  if (/^\d+(\.\d+)?$/.test(v) && Number(v) > 20000 && Number(v) < 80000) {
    // Excel date serial number
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(v)) * 86400000);
    return d.toISOString().slice(0, 10);
  }
  let m = v.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (m) {
    let [a, b] = [Number(m[1]), Number(m[2])];
    const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    // Ambiguous like 03/04/2026: assume month/day unless the first number can't be a month
    let month = a, day = b;
    if (a > 12) { day = a; month = b; }
    else if (a <= 12 && b <= 12) warnings.push(`Please check the date "${v}" — it was read as month/day/year.`);
    return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  const t = Date.parse(v);
  if (!isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  warnings.push(`Couldn’t read the date "${v}".`);
  return '';
}

function typeOf(value: string): 'hotel' | 'restaurant' | 'activity' | null {
  const v = norm(value);
  if (!v) return null;
  // Food first, so words like "dinner" aren't mistaken for hotels ("inn")
  if (/(restaurant|food|eat|dinner|lunch|breakfast|brunch|cafe|coffee|bar|drink|meal)/.test(v)) return 'restaurant';
  if (/(hotel|stay|lodg|hostel|accom|airbnb|resort|bnb|motel|guesthouse)/.test(v) || v === 'inn') return 'hotel';
  if (/(activit|attraction|sight|tour|museum|see|visit|experience|thing|park|beach|hike|show|todo)/.test(v)) return 'activity';
  return null;
}

export function rowsToTrip(rows: string[][]): ImportedTrip {
  const warnings: string[] = [];
  const clean = rows.map((r) => r.map((c) => (c ?? '').toString().trim()));
  const headerIdx = clean.findIndex((r) => r.some((c) => c !== ''));
  if (headerIdx < 0) throw new Error('The spreadsheet is empty.');
  const header = clean[headerIdx].map(norm);

  const col: Record<string, number> = {};
  for (const [key, aliases] of Object.entries(HEADERS)) {
    const i = header.findIndex((h) => aliases.includes(h));
    if (i >= 0) col[key] = i;
  }
  if (col.city === undefined || col.name === undefined) {
    throw new Error('The first row needs column headings, including at least "City" and "Name". Download the template to see the layout.');
  }
  const get = (r: string[], key: string) => (col[key] === undefined ? '' : r[col[key]] || '');

  const trip: ImportedTrip = { title: '', startDate: '', endDate: '', cities: [], warnings, rowCount: 0 };
  const cityMap = new Map<string, ImportedCity>();
  let lastCity = '';
  let lastCountry = '';

  clean.slice(headerIdx + 1).forEach((r, i) => {
    if (r.every((c) => c === '')) return;
    const line = headerIdx + i + 2;
    if (!trip.title && get(r, 'title')) trip.title = get(r, 'title');
    if (!trip.startDate && get(r, 'startDate')) trip.startDate = toIsoDate(get(r, 'startDate'), warnings);
    if (!trip.endDate && get(r, 'endDate')) trip.endDate = toIsoDate(get(r, 'endDate'), warnings);

    // City/country can be left blank to repeat the row above
    const cityName = get(r, 'city') || lastCity;
    const country = get(r, 'country') || (get(r, 'city') ? '' : lastCountry);
    const name = get(r, 'name');
    if (!cityName) { if (name) warnings.push(`Row ${line}: skipped "${name}" — no city.`); return; }
    lastCity = cityName; lastCountry = country;

    const key = `${cityName.toLowerCase()}|${country.toLowerCase()}`;
    let city = cityMap.get(key);
    if (!city) {
      city = { name: cityName, country, numberOfDays: 1, hotels: [], days: [] };
      cityMap.set(key, city);
      trip.cities.push(city);
      if (!country) warnings.push(`"${cityName}" has no country — you can add it in the form.`);
    }
    if (!name) return;

    const rawRating = parseFloat(get(r, 'rating'));
    const place: ImportedPlace = {
      name,
      location: get(r, 'address'),
      rating: isNaN(rawRating) ? 0 : Math.max(0, Math.min(5, Math.round(rawRating))),
      review: get(r, 'review'),
    };

    const kind = typeOf(get(r, 'type'));
    if (kind === 'hotel') { city.hotels.push(place); trip.rowCount++; return; }
    if (!kind) warnings.push(`Row ${line}: "${name}" has no Type (Hotel, Restaurant or Activity) — added as an activity.`);

    const dayMatch = get(r, 'day').match(/\d+/);
    const dayNumber = dayMatch ? Math.max(1, Math.min(90, Number(dayMatch[0]))) : 1;
    if (!dayMatch && get(r, 'day') === '' && col.day !== undefined) warnings.push(`Row ${line}: "${name}" has no Day — put on Day 1.`);
    city.numberOfDays = Math.max(city.numberOfDays, dayNumber);
    let day = city.days.find((d) => d.dayNumber === dayNumber);
    if (!day) { day = { dayNumber, restaurants: [], activities: [] }; city.days.push(day); }
    (kind === 'restaurant' ? day.restaurants : day.activities).push(place);
    trip.rowCount++;
  });

  if (trip.cities.length === 0) throw new Error('No cities found. Each row needs a City.');
  for (const c of trip.cities) {
    if (c.hotels.length > 1) warnings.push(`${c.name} has ${c.hotels.length} hotels — the form shows the first one; all are kept when you save.`);
  }
  return trip;
}

export const IMPORT_STORAGE_KEY = 'tripshare:importedTrip';
