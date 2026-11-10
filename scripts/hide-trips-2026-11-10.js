// One-time: hide three trips from Browse Trips by making them private.
// Nothing is deleted; set isPublic back to true to show them again.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ids = [
  'cmj8z29k80007l0rntoqvqghz', // Toronto Staycation
  'cmj5xt53s0002l0rng3wc0afd', // pak (Islamabad)
  'cmj3gnxyh0002l053ibkqkh03', // DATABASE: Global Hotels & Restaurants Collection
];
prisma.trip
  .updateMany({ where: { id: { in: ids } }, data: { isPublic: false } })
  .then((r) => console.log('Trips hidden (made private):', r.count))
  .catch((e) => { console.error('Could not hide trips:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
