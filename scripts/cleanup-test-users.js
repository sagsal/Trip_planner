// Deletes the temporary accounts made by the phone-screenshot check (and anything they created).
// Prints a count only.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const r = await prisma.user.deleteMany({ where: { email: { startsWith: 'screenshot-bot-', endsWith: '@example.invalid' } } });
  console.log(`temporary screenshot accounts removed: ${r.count}`);
})().catch((e) => console.log('cleanup skipped:', e.message)).finally(() => prisma.$disconnect());
