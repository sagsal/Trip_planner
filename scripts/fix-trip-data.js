// One-off data check and fix, run once after a deploy. Trips here are public; prints titles and day counts only.
//  1. Fixes the "Belompan" misspelling (Belmopan, Belize) in trip titles and city names.
//  2. Reports every shared trip whose cities' days don't add up to the trip's dates.
//  3. For the Belize trip (approved by the site owner), trims the extra day from the city with room to spare.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const daysBetween = (a, b) => (a && b ? Math.round((new Date(b) - new Date(a)) / 86400000) + 1 : 0);

(async () => {
  const trips = await prisma.trip.findMany({
    where: { isDraft: false },
    select: {
      id: true, title: true, startDate: true, endDate: true,
      cities_data: { select: { id: true, name: true, numberOfDays: true, createdAt: true, restaurants: { select: { dayNumber: true } }, activities: { select: { dayNumber: true } } }, orderBy: { createdAt: 'asc' } },
    },
  });
  let renamed = 0;
  for (const t of trips) {
    if (t.title.includes('Belompan')) {
      await prisma.trip.update({ where: { id: t.id }, data: { title: t.title.replace(/Belompan/g, 'Belmopan') } });
      console.log(`renamed trip: "${t.title}" -> "${t.title.replace(/Belompan/g, 'Belmopan')}"`); renamed++;
    }
    for (const c of t.cities_data) {
      if (c.name.includes('Belompan')) {
        await prisma.city.update({ where: { id: c.id }, data: { name: c.name.replace(/Belompan/g, 'Belmopan') } });
        console.log(`renamed city: ${c.name} -> ${c.name.replace(/Belompan/g, 'Belmopan')}`); renamed++;
      }
    }
  }
  console.log(`spelling fixes: ${renamed}`);

  for (const t of trips) {
    const want = daysBetween(t.startDate, t.endDate);
    const sum = t.cities_data.reduce((n, c) => n + (c.numberOfDays || 0), 0);
    if (!want || sum === want) continue;
    const detail = t.cities_data.map((c) => {
      const used = Math.max(0, ...[...c.restaurants, ...c.activities].map((p) => p.dayNumber || 0));
      return `${c.name} ${c.numberOfDays}d (places up to day ${used})`;
    }).join(', ');
    console.log(`days don't add up: "${t.title}": dates ${want} days, cities ${sum} days: ${detail}`);
    if (/Belize/.test(t.title) && sum > want) {
      let extra = sum - want;
      const order = [...t.cities_data].reverse(); // trim from the last city first
      for (const c of order) {
        if (!extra) break;
        const used = Math.max(1, ...[...c.restaurants, ...c.activities].map((p) => p.dayNumber || 0));
        const room = (c.numberOfDays || 1) - used;
        const cut = Math.min(room, extra);
        if (cut > 0) {
          await prisma.city.update({ where: { id: c.id }, data: { numberOfDays: c.numberOfDays - cut } });
          console.log(`  fixed: ${c.name} ${c.numberOfDays} -> ${c.numberOfDays - cut} days`);
          extra -= cut;
        }
      }
      if (extra) console.log(`  could not trim ${extra} day(s) without moving places; left as is`);
    }
  }
})().catch((e) => console.log('data check skipped:', e.message)).finally(() => prisma.$disconnect());
