# MySQL Setup Scripts

This directory contains scripts to help you set up MySQL database for Trip Planner on your VPS.

## Available Scripts

### 1. `setup-mysql.sh` - Complete MySQL Setup
**Full automated setup** - Installs MySQL, creates database, user, and configures everything.

**Usage:**
```bash
sudo bash setup-mysql.sh
```

**What it does:**
- ✅ Detects your OS (Ubuntu/Debian/CentOS/RHEL/Fedora)
- ✅ Installs MySQL server
- ✅ Secures MySQL installation
- ✅ Creates database `trip_planner`
- ✅ Creates database user `trip_planner_user`
- ✅ Sets up proper permissions
- ✅ Creates `.env` file with connection string
- ✅ Configures firewall rules
- ✅ Tests database connection

**Requirements:**
- Root/sudo access
- Internet connection

---

### 2. `migrate-to-mysql.sh` - Application Migration
**Application setup** - Assumes MySQL is already installed and configured.

**Usage:**
```bash
bash migrate-to-mysql.sh
```

**What it does:**
- ✅ Installs npm dependencies
- ✅ Generates Prisma Client
- ✅ Tests database connection
- ✅ Creates database schema
- ✅ Optionally seeds the database

**Requirements:**
- MySQL already installed and configured
- `.env` file with `DATABASE_URL` set
- Node.js and npm installed

---

## Quick Start Guide

### Option A: Complete Automated Setup (Recommended)

1. **Clone/download your project to VPS**
   ```bash
   cd /path/to/Trip_Planner
   ```

2. **Run the setup script**
   ```bash
   sudo bash setup-mysql.sh
   ```

3. **Follow the prompts:**
   - Enter MySQL root password (or skip)
   - Enter password for database user
   - Confirm password

4. **Complete application setup**
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   npx prisma db seed  # Optional
   ```

5. **Start your application**
   ```bash
   npm run start
   # Or with PM2:
   pm2 start npm --name trip-planner -- start
   ```

---

### Option B: Manual Setup

If you prefer manual setup, follow the steps in `MYSQL_SETUP.md`.

---

## Script Features

### `setup-mysql.sh` Features:

- **OS Detection**: Automatically detects Ubuntu, Debian, CentOS, RHEL, or Fedora
- **Interactive Prompts**: Asks for passwords and confirmations
- **Error Handling**: Exits on errors with clear messages
- **Security**: Creates secure database user with proper permissions
- **Firewall**: Automatically configures firewall rules
- **Environment File**: Generates `.env` file automatically
- **Connection Testing**: Verifies database connection works

### Security Features:

- Uses `utf8mb4` character set for full Unicode support
- Creates dedicated database user (not root)
- Sets proper file permissions on `.env` file (600)
- Configures firewall to allow MySQL connections

---

## Troubleshooting

### Script fails to install MySQL
- Check internet connection
- Verify you have sudo/root access
- Check OS compatibility

### Database creation fails
- Verify MySQL is running: `sudo systemctl status mysql`
- Check MySQL root access
- Review error messages in script output

### Connection test fails
- Verify password is correct
- Check MySQL is running
- Verify user was created: `mysql -u root -p -e "SELECT User FROM mysql.user;"`

### Permission denied errors
- Ensure script is executable: `chmod +x setup-mysql.sh`
- Run with sudo: `sudo bash setup-mysql.sh`

---

## Environment Variables

After running `setup-mysql.sh`, your `.env` file will contain:

```env
DATABASE_URL="mysql://trip_planner_user:password@localhost:3306/trip_planner?schema=public"
NODE_ENV=production
TRIPADVISOR_API_KEY=4BD8D2DC82B84E01965E1180DBADE6EC
```

**Important:** Keep your `.env` file secure and never commit it to version control!

---

## Next Steps After Setup

1. **Verify Database:**
   ```bash
   mysql -u trip_planner_user -p trip_planner
   SHOW TABLES;
   ```

2. **Run Prisma Studio** (optional):
   ```bash
   npx prisma studio
   ```

3. **Set up Backups:**
   ```bash
   # Add to crontab for daily backups
   0 2 * * * mysqldump -u trip_planner_user -p trip_planner > /backup/trip_planner_$(date +\%Y\%m\%d).sql
   ```

4. **Monitor MySQL:**
   ```bash
   sudo systemctl status mysql
   ```

---

## Support

If you encounter issues:

1. Check the error messages in the script output
2. Review `MYSQL_SETUP.md` for detailed instructions
3. Verify MySQL is running: `sudo systemctl status mysql`
4. Check MySQL logs: `sudo tail -f /var/log/mysql/error.log`

---

## Security Notes

- ✅ Database user has minimal required privileges
- ✅ Root access is not used for application
- ✅ Passwords are stored securely in `.env` file
- ✅ Firewall rules are configured
- ⚠️  Remember to change default passwords
- ⚠️  Keep `.env` file secure (chmod 600)
- ⚠️  Don't commit `.env` to version control

