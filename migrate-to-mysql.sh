#!/bin/bash

# Migration script to set up MySQL database on VPS
# Run this script on your VPS after installing MySQL

echo "🚀 Starting MySQL Migration for Trip Planner"
echo "=============================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    echo ""
    echo "Please create a .env file with the following content:"
    echo "DATABASE_URL=\"mysql://trip_planner_user:your_password@localhost:3306/trip_planner?schema=public\""
    echo "NODE_ENV=production"
    echo "TRIPADVISOR_API_KEY=4BD8D2DC82B84E01965E1180DBADE6EC"
    echo ""
    read -p "Press Enter after creating .env file..."
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL" .env; then
    echo "❌ DATABASE_URL not found in .env file"
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Check database connection
echo "🔌 Testing database connection..."
if npx prisma db pull > /dev/null 2>&1; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed!"
    echo "Please check:"
    echo "  1. MySQL is running: sudo systemctl status mysql"
    echo "  2. Database exists: mysql -u root -p -e 'SHOW DATABASES;'"
    echo "  3. User has correct permissions"
    echo "  4. DATABASE_URL in .env is correct"
    exit 1
fi

# Push schema to database
echo "📊 Creating database schema..."
npx prisma db push

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully!"
else
    echo "❌ Failed to create database schema"
    exit 1
fi

# Ask if user wants to seed database
read -p "Do you want to seed the database with initial data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npx prisma db seed
    if [ $? -eq 0 ]; then
        echo "✅ Database seeded successfully!"
    else
        echo "⚠️  Seeding failed, but you can continue"
    fi
fi

echo ""
echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "  1. Start your application: npm run start"
echo "  2. Or use PM2: pm2 start npm --name trip-planner -- start"
echo "  3. Check logs if needed: pm2 logs trip-planner"
echo ""

