// One-off check of the AI trip finder and "Fill with AI" (uses a temporary user, deleted afterwards).
// Prints counts and public trip/place names only.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';
const post = (p, b) => fetch(BASE + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then((r) => r.json().catch(() => ({})));

(async () => {
  const user = await prisma.user.create({ data: { email: `assistant-test-${Date.now()}@example.invalid`, name: 'Assistant Test', password: 'x' } });
  try {
    const t0 = Date.now();
    const ask = await post('/api/assistant/find', { messages: [{ role: 'user', content: 'Japan with my family' }], asked: 0 });
    console.log(`finder first step: ${ask.action} ${ask.action === 'ask' ? '→ "' + ask.question + '" options=' + (ask.options || []).length : ''} (${Date.now() - t0}ms)`);

    const t1 = Date.now();
    const find = await post('/api/assistant/find', { messages: [{ role: 'user', content: 'A food trip to Mexico City for a couple, about 5 days' }], asked: 3 });
    console.log(`finder results: ${find.action} count=${(find.results || []).length} ${(find.results || []).map((r) => r.title + (r.exact ? '' : ' (similar)')).join(' | ')} note="${find.note || ''}" (${Date.now() - t1}ms)${find.error ? ' error=' + find.error : ''}`);

    const trip = await post('/api/sandbox', { userId: user.id, title: 'Test Mexico City' });
    const t2 = Date.now();
    const start = await post('/api/assistant/fill', {
      userId: user.id,
      sandboxTripId: trip.trip.id,
      request: '4 days in Mexico City, couple, love food and markets, boutique hotel in Roma or Condesa, one day trip to Teotihuacan',
    });
    if (!start.jobId) throw new Error('no job: ' + JSON.stringify(start));
    let res;
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      res = await fetch(`${BASE}/api/assistant/fill?job=${start.jobId}&userId=${user.id}`).then((r) => r.json());
      if (res.status !== 'running') break;
    }
    if (res.status !== 'done') throw new Error(res.error || res.status);
    const items = res.plan.items;
    const by = (f) => items.filter(f).length;
    console.log(`fill: ${Math.round((Date.now() - t2) / 1000)}s cities=${res.plan.cities.map((c) => c.name + ' ' + c.days + 'd').join(', ')} items=${items.length} hotels=${by((i) => i.kind === 'hotel')} activities=${by((i) => i.kind === 'activity')} restaurants=${by((i) => i.kind === 'restaurant')} fromTravelers=${by((i) => i.source === 'traveler')} google=${by((i) => i.source === 'google')} withPhotos=${by((i) => i.imageUrl)}`);
    for (let d = 1; d <= 4; d++) console.log(`  day ${d}: ${items.filter((i) => i.dayNumber === d).map((i) => i.name).join(' | ')}`);
    console.log(`  hotel: ${items.filter((i) => i.kind === 'hotel').map((i) => i.name).join(' | ')}`);

    const add = await post('/api/sandbox/places', { userId: user.id, sandboxTripId: trip.trip.id, places: items.slice(0, 5) });
    console.log(`add to sandbox: saved=${add.saved}`);
  } catch (e) {
    console.log('assistant test FAILED:', e.message);
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    await prisma.$disconnect();
  }
})();
