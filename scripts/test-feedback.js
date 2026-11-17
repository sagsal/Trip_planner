// "Help me plan" check, run after each deploy. Temporary users, deleted at the end. Prints pass/fail only.
const { PrismaClient } = require('@prisma/client');
const sessionCookie = require('./session-token');
const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';
let failures = 0;
const check = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failures++; };
const call = async (cookie, method, path, body) => {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  return { status: r.status, ...d };
};

(async () => {
  const stamp = Date.now();
  const owner = await prisma.user.create({ data: { email: `fb-owner-${stamp}@example.invalid`, name: 'Olivia Planner', password: 'x' } });
  const member = await prisma.user.create({ data: { email: `fb-member-${stamp}@example.invalid`, name: 'Marco Helper', password: 'x' } });
  const O = sessionCookie(owner.id), M = sessionCookie(member.id);
  try {
    const trip = await prisma.sandboxTrip.create({ data: { userId: owner.id, title: 'Test Italy 2027', region: 'Europe' } });
    const hotel = await prisma.savedPlace.create({ data: { userId: owner.id, sandboxTripId: trip.id, kind: 'hotel', name: 'Test Hotel Firenze', city: 'Florence', country: 'Italy' } });

    check('not open: members can’t see it', (await call(M, 'GET', `/api/feedback/${trip.id}`)).status === 404);
    check('only the owner can open it', (await call(M, 'POST', `/api/feedback/${trip.id}`, { action: 'open' })).status === 403);
    const opened = await call(O, 'POST', `/api/feedback/${trip.id}`, { action: 'open', ask: 'Too many days in Florence?' });
    check('owner opens it for feedback', opened.ok && opened.open);

    check('signed out: list refused', (await call('', 'GET', '/api/feedback')).status === 401);
    const list = await call(M, 'GET', '/api/feedback');
    check('member sees it in Help me plan', (list.trips || []).some((t) => t.id === trip.id && t.ask));

    const swap = await call(M, 'POST', `/api/feedback/${trip.id}/comments`, {
      targetType: 'place', targetKey: hotel.id, reaction: 'swap', text: 'Better location',
      suggestion: { kind: 'hotel', name: 'Test Hotel Oltrarno', city: 'Florence', country: 'Italy' },
    });
    check('member suggests a swap', swap.ok && swap.id);
    check('swap without a place is refused', (await call(M, 'POST', `/api/feedback/${trip.id}/comments`, { targetType: 'place', targetKey: hotel.id, reaction: 'swap' })).status === 400);
    const days = await call(M, 'POST', `/api/feedback/${trip.id}/comments`, { targetType: 'trip', reaction: 'too_many_days' });
    check('member comments on the whole trip', days.ok);

    const agree = await call(O, 'POST', `/api/feedback/comments/${days.id}`, { action: 'agree' });
    check('agree counts', agree.ok && agree.agrees === 1);
    check('member can’t accept', (await call(M, 'POST', `/api/feedback/comments/${swap.id}`, { action: 'accept' })).status === 403);
    const acc = await call(O, 'POST', `/api/feedback/comments/${swap.id}`, { action: 'accept' });
    const places = await prisma.savedPlace.findMany({ where: { sandboxTripId: trip.id } });
    check('owner accepts: the hotel is swapped', acc.ok && acc.changed === 'swapped' && places.length === 1 && places[0].name === 'Test Hotel Oltrarno');

    const view = await call(M, 'GET', `/api/feedback/${trip.id}`);
    check('page shows comments with first names only', (view.comments || []).length === 2 && view.comments.every((c) => !/Helper|Planner/.test(c.author)));

    // Caps: 12 comments a day on one trip
    let lastStatus = 0;
    for (let i = 0; i < 12; i++) lastStatus = (await call(M, 'POST', `/api/feedback/${trip.id}/comments`, { targetType: 'trip', reaction: 'note', text: `note ${i}` })).status;
    check('daily limit per trip', lastStatus === 429);

    // Up to 3 open trips per member
    const extra = [];
    for (let i = 0; i < 3; i++) extra.push(await prisma.sandboxTrip.create({ data: { userId: owner.id, title: `Extra ${i}` } }));
    const r = [];
    for (const t of extra) r.push((await call(O, 'POST', `/api/feedback/${t.id}`, { action: 'open' })).status);
    check('open-trip limit', r[0] === 200 && r[1] === 200 && r[2] === 429);

    const closed = await call(O, 'POST', `/api/feedback/${trip.id}`, { action: 'close' });
    check('owner closes it; members can’t see it', closed.ok && (await call(M, 'GET', `/api/feedback/${trip.id}`)).status === 404);
  } catch (e) {
    console.log('FAIL feedback test crashed:', e.message);
    failures++;
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: [owner.id, member.id] } } }).catch(() => {});
    await prisma.$disconnect();
    console.log(`feedback test: ${failures === 0 ? 'all passed' : failures + ' failed'}`);
  }
})();
