// One-off check of the owner's Block / Delete (temporary member, removed at the end). Pass/fail only.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const sessionCookie = require('./session-token');
const fs = require('fs');
const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';
let fails = 0;
const check = (n, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${n}`); if (!ok) fails++; };
const call = async (cookie, method, path, body) => {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, ...(await r.json().catch(() => ({}))) };
};
(async () => {
  const admins = ((fs.readFileSync('.env.local', 'utf8').match(/^ADMIN_EMAILS=(.+)$/m) || [])[1] || '').split(/[,\s]+/).filter(Boolean);
  const owner = await prisma.user.findFirst({ where: { email: { in: admins } } });
  console.log('owner found:', !!owner);
  const email = `screenshot-bot-admin-${Date.now()}@example.invalid`;
  const member = await prisma.user.create({ data: { email, name: 'Block Test', password: await bcrypt.hash('Pw-test-123!', 10) } });
  try {
    const O = sessionCookie(owner.id), M = sessionCookie(member.id);
    const trip = await prisma.trip.create({ data: { title: 'Block test trip', userId: member.id, isPublic: true, isDraft: false, startDate: new Date(), endDate: new Date(), countries: '["Canada"]' } });
    check('member can’t use owner tools', (await call(M, 'POST', '/api/admin/members', { id: owner.id, action: 'block' })).status === 404);
    check('owner can’t block themself', (await call(O, 'POST', '/api/admin/members', { id: owner.id, action: 'block' })).status === 400);
    check('block', (await call(O, 'POST', '/api/admin/members', { id: member.id, action: 'block' })).blocked === true);
    check('blocked: session stops working', (await call(M, 'GET', `/api/sandbox?userId=${member.id}`)).status === 401);
    check('blocked: can’t sign in', (await call('', 'POST', '/api/auth/login', { email, password: 'Pw-test-123!' })).status === 403);
    check('blocked: trip hidden from list', !((await call('', 'GET', '/api/trips?public=true&limit=50')).trips || []).some((t) => t.id === trip.id));
    check('blocked: trip page hidden', (await call('', 'GET', `/api/trips/${trip.id}`)).status === 404);
    check('unblock', (await call(O, 'POST', '/api/admin/members', { id: member.id, action: 'unblock' })).blocked === false);
    check('unblocked: session works again', (await call(M, 'GET', `/api/sandbox?userId=${member.id}`)).status === 200);
    check('delete', (await call(O, 'POST', '/api/admin/members', { id: member.id, action: 'delete' })).deleted === true);
    check('deleted: account and trip gone', !(await prisma.user.findUnique({ where: { id: member.id } })) && !(await prisma.trip.findUnique({ where: { id: trip.id } })));
  } catch (e) {
    console.log('FAIL crashed:', e && e.name, String((e && e.message) || e).replace(/\s+/g, ' ').slice(-300)); fails++;
  } finally {
    await prisma.user.deleteMany({ where: { id: member.id } }).catch(() => {});
    await prisma.$disconnect();
    console.log(`admin actions test: ${fails ? fails + ' failed' : 'all passed'}`);
  }
})();
