# Migration Summary: PostgreSQL (Supabase) → MySQL (VPS)

## ✅ Changes Made

### 1. Prisma Schema Updated
- **File**: `prisma/schema.prisma`
- **Changes**:
  - Changed `provider` from `"postgresql"` to `"mysql"`
  - Removed `directUrl` (not needed for MySQL)
  - Schema is fully compatible with MySQL

### 2. Configuration Files Updated
- **File**: `netlify.toml`
  - Removed Supabase-specific environment variables
  - Updated `DATABASE_URL` format for MySQL
  - Removed `DIRECT_URL` (PostgreSQL/Supabase specific)

### 3. Documentation Created
- **File**: `MYSQL_SETUP.md` - Complete setup guide for MySQL on VPS
- **File**: `migrate-to-mysql.sh` - Automated migration script

## 📋 Quick Start on VPS

### Step 1: Install MySQL
```bash
sudo apt update
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql
sudo mysql_secure_installation
```

### Step 2: Create Database and User
```bash
sudo mysql -u root -p
```

Then run:
```sql
CREATE DATABASE trip_planner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'trip_planner_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON trip_planner.* TO 'trip_planner_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Configure Environment
Create `.env` file:
```env
DATABASE_URL="mysql://trip_planner_user:your_strong_password@localhost:3306/trip_planner?schema=public"
NODE_ENV=production
TRIPADVISOR_API_KEY=4BD8D2DC82B84E01965E1180DBADE6EC
```

### Step 4: Run Migration
```bash
# Option 1: Use the automated script
./migrate-to-mysql.sh

# Option 2: Manual steps
npm install
npx prisma generate
npx prisma db push
npx prisma db seed  # Optional
```

## 🔄 What Changed

### Removed Dependencies
- ❌ `DIRECT_URL` environment variable (PostgreSQL connection pooling)
- ❌ Supabase-specific configuration

### New Requirements
- ✅ MySQL server installed on VPS
- ✅ MySQL database and user created
- ✅ Updated `DATABASE_URL` connection string

## 🔍 Verification

After migration, verify everything works:

1. **Test Database Connection**:
   ```bash
   npx prisma studio
   ```

2. **Check Application**:
   ```bash
   npm run build
   npm run start
   ```

3. **Verify Tables**:
   ```sql
   USE trip_planner;
   SHOW TABLES;
   ```

## 📝 Important Notes

1. **Data Migration**: If you have existing data in Supabase, you'll need to export it and import it into MySQL manually.

2. **Connection String Format**:
   ```
   mysql://username:password@host:port/database?schema=public
   ```

3. **Character Encoding**: Database uses `utf8mb4` to support all Unicode characters including emojis.

4. **Backups**: Set up regular MySQL backups:
   ```bash
   mysqldump -u trip_planner_user -p trip_planner > backup.sql
   ```

## 🚨 Troubleshooting

### Connection Issues
- Verify MySQL is running: `sudo systemctl status mysql`
- Check firewall: `sudo ufw allow 3306`
- Verify credentials in `.env`

### Schema Issues
- Reset if needed: `npx prisma migrate reset` (⚠️ deletes all data)
- Check Prisma logs: `npx prisma migrate dev --create-only`

### Permission Issues
- Verify user privileges: `SHOW GRANTS FOR 'trip_planner_user'@'localhost';`
- Re-grant if needed: `GRANT ALL PRIVILEGES ON trip_planner.* TO 'trip_planner_user'@'localhost';`

## 📚 Additional Resources

- [Prisma MySQL Documentation](https://www.prisma.io/docs/concepts/database-connectors/mysql)
- [MySQL Official Documentation](https://dev.mysql.com/doc/)
- See `MYSQL_SETUP.md` for detailed setup instructions

