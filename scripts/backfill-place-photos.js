// One-time: find a Google photo + Maps link for saved places that have no photo.
// Runs once per server (marker file), at most 500 Google searches (free tier is ~5,000/month).
// Only uses a result whose name clearly matches. Prints counts only (deploy logs are public).
const fs = require('fs');
const path = require('path');
const os = require('os');
const { PrismaClient } = require('@prisma/client');

const MARKER = path.join(os.homedir(), '.tripshare_photo_backfill_done');
if (fs.existsSync(MARKER)) { console.log('photo backfill: already done'); process.exit(0); }

// The Google key lives in .env.local on the server (not loaded automatically for scripts)
let KEY = process.env.GOOGLE_PLACES_API_KEY || '';
try {
  const line = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split('\n').find((l) => l.startsWith('GOOGLE_PLACES_API_KEY='));
  if (line) KEY = line.slice('GOOGLE_PLACES_API_KEY='.length).trim().replace(/^["']|["']$/g, '');
} catch {}
if (!KEY) { console.log('photo backfill: no Google key, skipped'); process.exit(0); }

const STOP = new Set(['the', 'a', 'an', 'de', 'la', 'le', 'el', 'and', 'y', 'et', '&', 'hotel', 'restaurant', 'cafe', 'bar', 'museum', 'museo']);
const tokens = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t));
function namesMatch(ours, theirs) {
  const a = tokens(ours); const b = new Set(tokens(theirs));
  if (a.length === 0) return false;
  const hits = a.filter((t) => b.has(t)).length;
  return hits / a.length >= 0.6 || (a.length >= 3 && hits >= 2);
}
const TYPE = { hotel: 'lodging', restaurant: 'restaurant', activity: 'tourist_attraction' };

async function search(query, model) {
  const body = { textQuery: query, languageCode: 'en', pageSize: 5, includedType: TYPE[model], strictTypeFiltering: model !== 'activity' };
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': 'places.id,places.displayName,places.googleMapsUri,places.photos' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Google HTTP ${res.status}`);
  return (await res.json()).places || [];
}

(async () => {
  const prisma = new PrismaClient();
  let searches = 0;
  const totals = {};
  try {
    for (const model of ['hotel', 'restaurant', 'activity']) {
      const rows = await prisma[model].findMany({
        where: { imageUrl: null },
        select: { id: true, name: true, location: true, webUrl: true, city: { select: { name: true, country: true } } },
      });
      let found = 0;
      for (const r of rows) {
        if (searches >= 500) break;
        if (tokens(r.name).length === 0) continue;
        searches++;
        const q = [r.name, r.location, r.city?.name, r.city?.country].filter(Boolean).join(', ').slice(0, 250);
        let places = [];
        try { places = await search(q, model); } catch (e) { if (/HTTP (403|429)/.test(e.message)) throw e; continue; }
        const hit = places.find((p) => namesMatch(r.name, p.displayName?.text || ''));
        if (!hit) continue;
        const photo = hit.photos?.[0]?.name;
        await prisma[model].update({
          where: { id: r.id },
          data: {
            imageUrl: photo ? `/api/places/photo?place=${encodeURIComponent(hit.id)}&name=${encodeURIComponent(photo)}` : null,
            webUrl: r.webUrl || hit.googleMapsUri || null,
          },
        });
        if (photo) found++;
      }
      totals[model] = `${found}/${rows.length}`;
    }
    fs.writeFileSync(MARKER, new Date().toISOString());
    console.log(`photo backfill: searches=${searches} photos found hotels=${totals.hotel} restaurants=${totals.restaurant} activities=${totals.activity}`);
  } catch (e) {
    console.error('photo backfill stopped:', e.message, `(after ${searches} searches)`);
  } finally {
    await prisma.$disconnect();
  }
})();
