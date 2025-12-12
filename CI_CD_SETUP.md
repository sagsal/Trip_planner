# CI/CD Pipeline Setup Guide

This guide explains how to set up the CI/CD pipeline for automatic deployment to your VPS.

## Pipeline Overview

The pipeline (`deploy-simple.yml`) automatically:
1. ✅ Builds your Next.js application
2. ✅ Runs Prisma migrations
3. ✅ Deploys to your VPS
4. ✅ Restarts the application with PM2

## Prerequisites

1. **GitHub Repository** - Your code must be in a GitHub repository
2. **VPS Access** - SSH access to your VPS server
3. **PM2 Installed** - Process manager on your VPS
4. **Git on VPS** - Your code should be cloned on the VPS

## Setup Steps

### Step 1: Generate SSH Key for GitHub Actions

On your local machine or VPS:

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_deploy
```

This creates:
- `~/.ssh/github_actions_deploy` (private key - add to GitHub secrets)
- `~/.ssh/github_actions_deploy.pub` (public key - add to VPS)

### Step 2: Add Public Key to VPS

```bash
# Copy public key to VPS
cat ~/.ssh/github_actions_deploy.pub | ssh user@your-vps-ip "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

Or manually:
1. Copy the content of `github_actions_deploy.pub`
2. SSH into your VPS
3. Run: `nano ~/.ssh/authorized_keys`
4. Paste the public key
5. Save and exit

### Step 3: Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

#### Required Secrets:

1. **`VPS_SSH_PRIVATE_KEY`**
   - Value: Content of `~/.ssh/github_actions_deploy` (private key)
   - Copy the entire key including `-----BEGIN` and `-----END` lines

2. **`VPS_HOST`**
   - Value: Your VPS IP address or domain
   - Example: `123.45.67.89` or `yourdomain.com`

3. **`VPS_USER`**
   - Value: SSH username
   - Example: `root` or `ubuntu`

4. **`VPS_DEPLOY_PATH`**
   - Value: Full path to your project on VPS
   - Example: `/var/www/Trip_planner` or `/home/user/Trip_Planner`

5. **`DATABASE_URL`**
   - Value: Your MySQL connection string
   - Example: `mysql://user:password@localhost:3306/trip_planner?schema=public`

6. **`TRIPADVISOR_API_KEY`**
   - Value: Your TripAdvisor API key
   - Example: `4BD8D2DC82B84E01965E1180DBADE6EC`

### Step 4: Verify VPS Setup

On your VPS, ensure:

```bash
# 1. Git is installed
git --version

# 2. Node.js and npm are installed
node -v
npm -v

# 3. PM2 is installed
pm2 --version

# 4. Your project is cloned
cd /var/www/Trip_planner  # or your path
git remote -v  # Should show your GitHub repo

# 5. PM2 is configured (if not already)
pm2 start npm --name trip-planner -- start
pm2 save
pm2 startup
```

### Step 5: Test the Pipeline

1. **Push to the `cicd` branch:**
   ```bash
   git checkout cicd
   git add .
   git commit -m "Test CI/CD pipeline"
   git push origin cicd
   ```

2. **Check GitHub Actions:**
   - Go to your GitHub repository
   - Click on **Actions** tab
   - You should see the workflow running
   - Click on it to see logs

3. **Verify Deployment:**
   ```bash
   ssh user@your-vps-ip
   pm2 status
   pm2 logs trip-planner
   ```

## Pipeline Workflow

The pipeline runs automatically when you:
- Push to `main` branch
- Push to `cicd` branch
- Create a pull request to `main`

### What Happens:

1. **Build Job:**
   - Checks out code
   - Installs dependencies
   - Generates Prisma Client
   - Builds the application
   - Runs linter (optional)

2. **Deploy Job:**
   - Connects to VPS via SSH
   - Pulls latest code
   - Installs dependencies
   - Generates Prisma Client
   - Builds application
   - Restarts PM2 process

## Troubleshooting

### Pipeline Fails at SSH Connection

**Error:** `Permission denied (publickey)`

**Solution:**
- Verify SSH key is added to GitHub secrets correctly
- Check public key is in VPS `~/.ssh/authorized_keys`
- Verify SSH user has correct permissions

### Pipeline Fails at Build

**Error:** `Build failed`

**Solution:**
- Check environment variables in GitHub secrets
- Verify `DATABASE_URL` is correct
- Check build logs in GitHub Actions

### Deployment Fails

**Error:** `pm2 restart failed`

**Solution:**
- SSH into VPS and check PM2 status: `pm2 status`
- Manually start: `pm2 start npm --name trip-planner -- start`
- Check logs: `pm2 logs trip-planner`

### Application Not Starting

**Error:** Application doesn't respond after deployment

**Solution:**
```bash
# SSH into VPS
ssh user@your-vps-ip

# Check PM2 status
pm2 status

# Check logs
pm2 logs trip-planner

# Restart manually if needed
pm2 restart trip-planner

# Check if port is in use
netstat -tulpn | grep 3000
```

## Manual Deployment (Fallback)

If CI/CD fails, you can deploy manually:

```bash
# SSH into VPS
ssh user@your-vps-ip

# Navigate to project
cd /var/www/Trip_planner  # or your path

# Pull latest code
git pull origin main

# Install dependencies
npm ci

# Generate Prisma Client
npx prisma generate

# Build
npm run build

# Restart
pm2 restart trip-planner
```

## Security Best Practices

1. ✅ Never commit `.env` files
2. ✅ Use GitHub Secrets for sensitive data
3. ✅ Use SSH keys (not passwords)
4. ✅ Restrict SSH access to specific IPs if possible
5. ✅ Keep dependencies updated
6. ✅ Use strong database passwords

## Advanced Configuration

### Custom Build Commands

Edit `.github/workflows/deploy-simple.yml` to add custom steps:

```yaml
- name: Run tests
  run: npm test

- name: Run database migrations
  run: npx prisma migrate deploy
```

### Multiple Environments

You can create separate workflows for staging and production:

- `.github/workflows/deploy-staging.yml` - Deploys to staging VPS
- `.github/workflows/deploy-production.yml` - Deploys to production VPS

## Support

If you encounter issues:
1. Check GitHub Actions logs
2. Check VPS logs: `pm2 logs trip-planner`
3. Verify all secrets are set correctly
4. Test SSH connection manually

