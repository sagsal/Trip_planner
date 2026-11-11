// Moves photo/link details that were stored as JSON inside `review` into the
// imageUrl / webUrl columns, leaving `review` as the traveller's own words.
// Safe to run many times: only rows whose review is that JSON are changed.
// Prints counts only (no trip content), because deploy logs are public.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const KEYS = ['locationId', 'imageUrl', 'webUrl', 'numReviews'];

function split(review) {
  const t = (review || '').trim();
  if (!(t.startsWith('{') && t.endsWith('}'))) return null;
  try {
    const j = JSON.parse(t);
    if (!j || typeof j !== 'object' || !KEYS.some((k) => k in j)) return null;
    const own = typeof j.review === 'string' ? j.review : typeof j.userReview === 'string' ? j.userReview : '';
    return {
      review: own || null,
      imageUrl: typeof j.imageUrl === 'string' && j.imageUrl ? j.imageUrl : null,
      webUrl: typeof j.webUrl === 'string' && /^https:\/\//.test(j.webUrl) ? j.webUrl : null,
    };
  } catch {
    return null;
  }
}

async function fix(model, name) {
  const rows = await prisma[model].findMany({ where: { review: { startsWith: '{' } }, select: { id: true, review: true, imageUrl: true, webUrl: true } });
  let changed = 0;
  for (const r of rows) {
    const s = split(r.review);
    if (!s) continue;
    await prisma[model].update({
      where: { id: r.id },
      data: { review: s.review, imageUrl: r.imageUrl || s.imageUrl, webUrl: r.webUrl || s.webUrl },
    });
    changed++;
  }
  console.log(`place details: ${name} fixed ${changed}`);
}

(async () => {
  try {
    await fix('hotel', 'hotels');
    await fix('restaurant', 'restaurants');
    await fix('activity', 'activities');
  } catch (e) {
    console.error('place details fix failed:', e.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
