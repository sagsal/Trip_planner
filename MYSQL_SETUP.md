# MySQL Database Setup Guide for VPS

This guide will help you set up MySQL database on your VPS and migrate from Supabase (PostgreSQL) to MySQL.

## Prerequisites

- VPS with root/sudo access
- SSH access to your VPS

## Step 1: Install MySQL on VPS

### For Ubuntu/Debian:
```bash
sudo apt update
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql
```

### For CentOS/RHEL:
```bash
sudo yum install mysql-server -y
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

## Step 2: Secure MySQL Installation

Run the MySQL security script:
```bash
sudo mysql_secure_installation
```

Follow the prompts:
- Set root password (or use auth_socket for Ubuntu)
- Remove anonymous users: Yes
- Disallow root login remotely: Yes (or No if you need remote access)
- Remove test database: Yes
- Reload privilege tables: Yes

## Step 3: Create Database and User

Login to MySQL:
```bash
sudo mysql -u root -p
```

Then run these SQL commands:
```sql
-- Create database
CREATE DATABASE trip_planner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (replace 'your_password' with a strong password)
CREATE USER 'trip_planner_user'@'localhost' IDENTIFIED BY 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON trip_planner.* TO 'trip_planner_user'@'localhost';

-- If you need remote access (replace 'your_server_ip' with your VPS IP)
-- CREATE USER 'trip_planner_user'@'your_server_ip' IDENTIFIED BY 'your_password';
-- GRANT ALL PRIVILEGES ON trip_planner.* TO 'trip_planner_user'@'your_server_ip';

-- Flush privileges
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

## Step 4: Configure MySQL for Remote Access (Optional)

If your app runs on a different server, edit MySQL config:
```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Find and comment out or change:
```ini
bind-address = 127.0.0.1
```
to:
```ini
bind-address = 0.0.0.0
```

Then restart MySQL:
```bash
sudo systemctl restart mysql
```

**Security Note:** Only enable remote access if necessary and ensure your firewall is properly configured.

## Step 5: Update Environment Variables

Create or update your `.env` file in the project root:

```env
# MySQL Database Connection
DATABASE_URL="mysql://trip_planner_user:your_password@localhost:3306/trip_planner?schema=public"

# For remote connection (if app is on different server):
# DATABASE_URL="mysql://trip_planner_user:your_password@your_vps_ip:3306/trip_planner?schema=public"

# Other environment variables
NODE_ENV=production
TRIPADVISOR_API_KEY=4BD8D2DC82B84E01965E1180DBADE6EC
```

## Step 6: Install Prisma and Generate Client

On your VPS, in your project directory:
```bash
npm install
npx prisma generate
```

## Step 7: Run Database Migrations

Create and apply the database schema:
```bash
# Create migration
npx prisma migrate dev --name init

# Or if you want to push schema directly (for development)
npx prisma db push
```

## Step 8: Seed the Database (Optional)

If you have seed data:
```bash
npx prisma db seed
```

## Step 9: Test the Connection

Test your database connection:
```bash
npx prisma studio
```

This will open Prisma Studio in your browser to view your database.

## Step 10: Update Your Application

Make sure your application is using the new DATABASE_URL environment variable. Restart your application:

```bash
# If using PM2
pm2 restart your-app-name

# If using systemd
sudo systemctl restart your-app-name

# If running directly
npm run start
```

## Troubleshooting

### Connection Refused
- Check if MySQL is running: `sudo systemctl status mysql`
- Verify firewall allows port 3306: `sudo ufw allow 3306`
- Check MySQL bind address configuration

### Access Denied
- Verify username and password
- Check user privileges: `SHOW GRANTS FOR 'trip_planner_user'@'localhost';`
- Ensure user has correct host (localhost vs %)

### Character Encoding Issues
- Ensure database uses utf8mb4: `SHOW CREATE DATABASE trip_planner;`
- Add `?charset=utf8mb4` to connection string if needed

### Prisma Migration Issues
- Reset database if needed: `npx prisma migrate reset` (WARNING: This deletes all data)
- Check Prisma logs: `npx prisma migrate dev --create-only`

## Security Best Practices

1. **Use strong passwords** for database users
2. **Limit remote access** - only allow from specific IPs if needed
3. **Regular backups**: `mysqldump -u trip_planner_user -p trip_planner > backup.sql`
4. **Keep MySQL updated**: `sudo apt update && sudo apt upgrade mysql-server`
5. **Use SSL connections** for remote access (configure in MySQL)

## Connection String Format

MySQL connection string format:
```
mysql://[username]:[password]@[host]:[port]/[database]?[parameters]
```

Example:
```
mysql://trip_planner_user:password123@localhost:3306/trip_planner?schema=public
```

## Next Steps

1. Update your deployment configuration (PM2, systemd, Docker, etc.)
2. Set up automated backups
3. Monitor database performance
4. Configure connection pooling if needed

