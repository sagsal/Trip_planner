// Setup script for database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Setting up database...');
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to Supabase database successfully!');
    
    // You can add any initial data setup here if needed
    console.log('✅ Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
