// Counts only (deploy logs are public): how many places have a photo link, and what kind.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  for (const m of ['hotel', 'restaurant', 'activity']) {
    const rows = await prisma[m].findMany({ select: { imageUrl: true, webUrl: true } });
    const kind = (u) => (!u ? 'none' : u.startsWith('/api/places/photo') ? 'google' : /tripadvisor|tacdn/.test(u) ? 'tripadvisor' : 'other');
    const c = {};
    for (const r of rows) c[kind(r.imageUrl)] = (c[kind(r.imageUrl)] || 0) + 1;
    console.log(`photo stats: ${m}s total=${rows.length} ` + Object.entries(c).map(([k, v]) => `${k}=${v}`).join(' ') + ` withLink=${rows.filter((r) => r.webUrl).length}`);
  }
  await prisma.$disconnect();
})().catch((e) => { console.error('photo stats failed:', e.message); process.exit(0); });
