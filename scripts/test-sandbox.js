// Sandbox API check, run after each deploy. Uses a temporary user that is deleted at the end.
// Prints pass/fail only (deploy logs are public).
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';
const j = (r) => r.json().catch(() => ({}));
let failures = 0;
const check = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failures++; };

(async () => {
  const email = `sandbox-test-${Date.now()}@example.invalid`;
  const user = await prisma.user.create({ data: { email, name: 'Sandbox Test', password: 'x' } });
  try {
    const post = (path, body) => fetch(BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(j);
    const patch = (path, body) => fetch(BASE + path, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(j);

    const t = await post('/api/sandbox', { userId: user.id, title: 'Test Greece 2027', region: 'Europe' });
    check('create planned trip', !!t.trip?.id);

    const place = { kind: 'activity', name: 'Falasarna beach', city: 'Chania', country: 'Greece', sourceRating: 5, sourceReview: 'Sunset!' };
    const s1 = await post('/api/sandbox/places', { userId: user.id, sandboxTripId: t.trip.id, places: [place, { kind: 'restaurant', name: 'Tamam', city: 'Chania', country: 'Greece' }] });
    check('save two places', s1.saved === 2 && s1.count === 2);

    const s2 = await post('/api/sandbox/places', { userId: user.id, sandboxTripId: t.trip.id, places: [place] });
    check('duplicate is skipped', s2.saved === 0 && s2.alreadyThere === 1);

    const s3 = await post('/api/sandbox/places', { userId: user.id, sandboxTripId: null, places: [{ kind: 'hotel', name: 'Test Hotel', city: 'Athens', country: 'Greece' }] });
    check('save to Unsorted', s3.saved === 1);

    const list = await fetch(`${BASE}/api/sandbox?userId=${user.id}`).then(j);
    check('list trips and places', list.trips?.length === 1 && list.places?.length === 3);

    const beach = list.places.find((p) => p.name === 'Falasarna beach');
    const p1 = await patch(`/api/sandbox/places/${beach.id}`, { userId: user.id, note: 'go at sunset', dayNumber: 2 });
    check('note and day saved', p1.place?.note === 'go at sunset' && p1.place?.dayNumber === 2);

    const other = await prisma.user.create({ data: { email: `x-${email}`, name: 'Other', password: 'x' } });
    const p2 = await patch(`/api/sandbox/places/${beach.id}`, { userId: other.id, note: 'hacked' });
    check("someone else can't edit it", p2.error && !p2.place);
    await prisma.user.delete({ where: { id: other.id } });

    const hotel = list.places.find((p) => p.name === 'Test Hotel');
    const p3 = await patch(`/api/sandbox/places/${hotel.id}`, { userId: user.id, sandboxTripId: t.trip.id });
    check('move from Unsorted to trip', p3.place?.sandboxTripId === t.trip.id);

    const d1 = await fetch(`${BASE}/api/sandbox/trips/${t.trip.id}?userId=${user.id}`, { method: 'DELETE' }).then(j);
    const after = await fetch(`${BASE}/api/sandbox?userId=${user.id}`).then(j);
    check('delete trip moves places to Unsorted', d1.ok && after.trips.length === 0 && after.places.every((p) => p.sandboxTripId === null));

    const c = await fetch(`${BASE}/api/sandbox?userId=${user.id}&countOnly=1`).then(j);
    check('counter', c.count === 3);
  } catch (e) {
    console.log('FAIL sandbox test crashed:', e.message);
    failures++;
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    await prisma.$disconnect();
    console.log(`sandbox test: ${failures === 0 ? 'all passed' : failures + ' failed'}`);
  }
})();
