// One-off check of the AI notes importer with notes that name only the country (uses the AI key; a cent or so).
// Prints city counts only.
const BASE = 'http://localhost:3000';
const { PrismaClient } = require('@prisma/client');
const sessionCookie = require('./session-token');
const prisma = new PrismaClient();
const NOTES = [
  ['country only, famous places', 'Mexico trip, March 2026, 8 days with my wife.\nStayed at Hotel Esencia, swam in cenotes, visited Chichen Itza and Coba ruins.\nAte at Hartwood (amazing), and tacos at Antojitos La Chiapaneca.\nLast 3 days: Frida Kahlo museum, Pujol for dinner, Teotihuacan balloon.'],
  ['country only, nothing else', 'Mexico 2025. Great beaches, lovely people, ate lots of tacos at a place called El Fogon. Stayed at a small hotel by the beach.'],
];
(async () => {
  const u = await prisma.user.create({ data: { email: `import-test-${Date.now()}@example.invalid`, name: 'Import Test', password: 'x' } });
  try {
    for (const [name, text] of NOTES) {
      const r = await fetch(`${BASE}/api/import/ai`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: sessionCookie(u.id) }, body: JSON.stringify({ text, fileName: 'test notes' }) });
      let d = await r.json().catch(() => ({}));
      const jobId = d.jobId;
      for (let i = 0; jobId && i < 60; i++) {
        await new Promise((res) => setTimeout(res, 3000));
        d = await (await fetch(`${BASE}/api/import/ai?job=${jobId}`, { headers: { Cookie: sessionCookie(u.id) } })).json().catch(() => ({}));
        if (d.status === 'done' || d.status === 'error') break;
      }
      const trip = d.trip;
      console.log(`${trip?.cities?.length ? 'PASS' : 'FAIL'} import (${name}): ${r.status} cities=${(trip?.cities || []).map((c) => c.name).join(' > ') || '-'} ${d.error ? 'error=' + d.error : ''}`);
    }
  } finally {
    await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
    await prisma.$disconnect();
  }
})();
