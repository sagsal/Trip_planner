// Sign-up check, run after each deploy: the optional "about you" questions (region, country, age) must never block
// anyone. Uses temporary @example.invalid accounts, deleted at the end. Prints pass/fail only.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';
let failures = 0;
const check = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failures++; };
const stamp = Date.now();
const register = async (extra, n) => {
  const r = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Signup', email: `signup-test-${stamp}-${n}@example.invalid`, password: 'testpass123', acceptTerms: true, ...extra }),
  });
  const d = await r.json().catch(() => ({}));
  return { status: r.status, error: d.error };
};

(async () => {
  try {
    check('optional answers left blank', (await register({ homeRegion: '', homeCountry: '', ageBracket: '' }, 1)).status === 201);
    check('optional answers not sent at all', (await register({}, 2)).status === 201);
    check('optional answers sent as null', (await register({ homeRegion: null, homeCountry: null, ageBracket: null }, 3)).status === 201);
    check('unexpected optional answers ignored', (await register({ homeRegion: 'Moon', homeCountry: 42, ageBracket: 'Prefer not to say' }, 4)).status === 201);
    check('only country given', (await register({ homeCountry: 'Canada' }, 5)).status === 201);
    check('all answers given', (await register({ homeRegion: 'Europe', homeCountry: 'Italy', ageBracket: '35–44' }, 6)).status === 201);
    check('spaces around email are fine', (await register({ email: `  signup-test-${stamp}-7@example.invalid ` }, 7)).status === 201);
    const dup = await register({ email: `signup-test-${stamp}-1@example.invalid` }, 8);
    check('same email twice: clear message, not a crash', dup.status === 400 && /already/.test(dup.error || ''));
    check('terms box still required', (await register({ acceptTerms: false }, 9)).status === 400);
    const saved = await prisma.user.findFirst({ where: { email: `signup-test-${stamp}-5@example.invalid` }, select: { homeRegion: true, homeCountry: true } });
    check('country saved and region filled in from it', saved?.homeCountry === 'Canada' && !!saved?.homeRegion);
  } catch (e) {
    check(`sign-up check ran (${e.message})`, false);
  } finally {
    const r = await prisma.user.deleteMany({ where: { email: { startsWith: `signup-test-${stamp}-`, endsWith: '@example.invalid' } } });
    console.log(`temporary sign-up accounts removed: ${r.count}`);
    await prisma.$disconnect();
    if (failures) console.log(`sign-up check: ${failures} FAILED`);
  }
})();
