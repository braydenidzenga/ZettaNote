# Docker-based Coolify Deployment Guide

This guide explains how to deploy ZettaNote to Coolify using pre-built Docker images from GitHub Container Registry.

## Overview

The deployment workflow:

1. **GitHub Actions** builds frontend and admin-portal (on GitHub runners)
2. **Docker images** are created with pre-built artifacts
3. **Images pushed** to GitHub Container Registry (ghcr.io)
4. **Coolify pulls** and deploys these images
5. **No building** happens on your Coolify server

## Architecture

### Components

- **Backend**: Node.js app built directly in Docker
- **Frontend**: React app built by GitHub Actions, copied into nginx image
- **Admin Portal**: React app built by GitHub Actions, copied into nginx image

### Docker Images

All images are hosted on GitHub Container Registry:

- `ghcr.io/<your-username>/zettanote-backend:latest`
- `ghcr.io/<your-username>/zettanote-frontend:latest`
- `ghcr.io/<your-username>/zettanote-admin:latest`

## Prerequisites

1. GitHub account with Container Registry enabled
2. Coolify server (v4.0+)
3. MongoDB database (MongoDB Atlas or self-hosted)

## Setup Instructions

### Step 1: Make GitHub Packages Public (Optional but Recommended)

After the first build:

1. Go to your GitHub profile → Packages
2. Find each package (zettanote-backend, zettanote-frontend, zettanote-admin)
3. Click on the package → Package settings
4. Scroll down to "Change package visibility"
5. Select "Public" (so Coolify can pull without authentication)

Alternatively, configure Coolify with GitHub credentials to pull private images.

### Step 2: Setup Coolify Project

1. **Login to Coolify**

   - Navigate to your Coolify dashboard

2. **Create a New Project**

   - Click "New Project"
   - Name it "ZettaNote"

3. **Add Backend Service**

   - Click "New Resource" → "Docker Image"
   - **Name**: `zettanote-backend`
   - **Image**: `ghcr.io/<your-username>/zettanote-backend:latest`
   - **Port**: `5000`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     PORT=5000
     DB=mongodb+srv://user:pass@cluster.mongodb.net/zettanote
     JWT_SECRET=your_secure_jwt_secret_here
     ALLOWED_ORIGINS=https://yourdomain.com
     ```
   - **Health Check**: `/api/health` (if you have health endpoint)
   - **Restart Policy**: `always`

4. **Add Frontend Service**

   - Click "New Resource" → "Docker Image"
   - **Name**: `zettanote-frontend`
   - **Image**: `ghcr.io/<your-username>/zettanote-frontend:latest`
   - **Port**: `80`
   - **Domain**: `yourdomain.com` (or subdomain)
   - **Enable SSL**: Yes (Coolify will generate Let's Encrypt cert)
   - **Restart Policy**: `always`

5. **Add Admin Portal Service**
   - Click "New Resource" → "Docker Image"
   - **Name**: `zettanote-admin`
   - **Image**: `ghcr.io/<your-username>/zettanote-admin:latest`
   - **Port**: `3001`
   - **Domain**: `admin.yourdomain.com` (or subdomain)
   - **Enable SSL**: Yes
   - **Restart Policy**: `always`

### Step 3: Configure Automatic Deployments (Optional)

To automatically deploy when you push to main:

1. **In Coolify**:

   - Go to each service
   - Find the "Webhooks" section
   - Copy the webhook URL

2. **In GitHub**:
   - Go to repository Settings → Secrets and variables → Actions
   - Add secret: `COOLIFY_WEBHOOK_URL`
   - Value: The webhook URL from Coolify

The GitHub Actions workflow will automatically trigger Coolify deployment after building images.

## GitHub Actions Workflow

The workflow (`.github/workflows/docker-build.yml`) does:

1. **Build Frontend** (on GitHub runner):

   ```bash
   pnpm install
   pnpm run build
   ```

2. **Build Admin Portal** (on GitHub runner):

   ```bash
   pnpm install
   pnpm run build
   ```

3. **Create Docker Images**:

   - Frontend: Copy `build/` folder into nginx image
   - Admin: Copy `build/` folder into nginx image
   - Backend: Build from source in Docker

4. **Push to GitHub Container Registry**

5. **Trigger Coolify** (via webhook)

## Local Testing

Test the Docker setup locally before deploying:

```bash
# Build images locally
docker build -t zettanote-backend ./backend
docker build -f frontend/Dockerfile.prod -t zettanote-frontend ./frontend
docker build -f admin-portal/Dockerfile.prod -t zettanote-admin ./admin-portal

# Or use docker-compose
docker-compose up --build
```

Create a `.env` file in the root:

```env
DB=mongodb://localhost:27017/zettanote
JWT_SECRET=test_secret
ALLOWED_ORIGINS=http://localhost
```

## Environment Variables

### Backend (.env in Coolify)

Required:

```env
NODE_ENV=production
PORT=5000
DB=mongodb+srv://...
JWT_SECRET=secure_random_string_here
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
```

Optional:

```env
ADMIN_EMAIL=admin@example.com
# Add other vars as needed
```

### Frontend

Frontend environment is baked into the build. To change API URLs:

1. Update `frontend/src/config.js`
2. Push changes
3. GitHub Actions will rebuild and deploy

### Admin Portal

Same as frontend - update `admin-portal/src/config.js` and push.

## Monitoring & Logs

### View Logs in Coolify

1. Go to your project
2. Click on a service
3. Click "Logs" tab
4. View real-time logs

### Health Checks

All services have health checks configured:

- **Backend**: HTTP check on startup
- **Frontend**: wget check every 30s
- **Admin**: wget check every 30s

## Updating the Application

### Method 1: Automatic (Recommended)

Just push to main branch:

```bash
git push origin main
```

GitHub Actions will:

1. Build new images
2. Push to registry
3. Trigger Coolify webhook
4. Coolify pulls and redeploys

### Method 2: Manual

In Coolify:

1. Go to service
2. Click "Redeploy"
3. Coolify will pull latest image

## Rollback

To rollback to a previous version:

1. **Using Git SHA tags**:

   - Images are tagged with git SHA
   - In Coolify, change image tag:
     ```
     ghcr.io/<user>/zettanote-backend:main-abc1234
     ```

2. **Using branch tags**:
   - Change to a specific branch:
     ```
     ghcr.io/<user>/zettanote-backend:develop
     ```

## Troubleshooting

### Images Not Pulling

**Problem**: Coolify can't pull images

**Solution**:

1. Make packages public in GitHub
2. Or configure Coolify with GitHub token:
   - Settings → Docker Registry
   - Add GitHub Container Registry
   - Username: your GitHub username
   - Token: GitHub PAT with `read:packages` scope

### Build Failing

**Problem**: GitHub Actions build fails

**Solution**:

1. Check Actions logs
2. Common issues:
   - pnpm cache issues: Clear cache
   - Dependencies: Check package.json
   - Tests failing: Fix or skip with `CI=false`

### Services Not Starting

**Problem**: Container exits immediately

**Solution**:

1. Check Coolify logs
2. Verify environment variables
3. Test locally with docker-compose
4. Check MongoDB connection

### CORS Errors

**Problem**: Frontend can't reach backend

**Solution**:

1. Add frontend domain to `ALLOWED_ORIGINS`
2. Update backend .env in Coolify
3. Restart backend service

### Port Conflicts

**Problem**: Port already in use

**Solution**:

- Coolify handles port mapping automatically
- Just ensure exposed ports match:
  - Backend: 5000
  - Frontend: 80
  - Admin: 3001

## Performance Optimization

### Image Size

Current optimizations:

- Multi-stage builds for frontend/admin
- Alpine-based images (smaller)
- Production-only dependencies

### Caching

GitHub Actions caches:

- pnpm store
- Docker layers

### Build Time

Frontend build: ~2-3 minutes
Admin build: ~2-3 minutes
Backend build: ~1-2 minutes
Total: ~6-8 minutes

## Security Best Practices

1. **Secrets Management**:

   - Never commit secrets to git
   - Use Coolify environment variables
   - Rotate JWT_SECRET regularly

2. **Image Security**:

   - Images are scanned by GitHub
   - Update base images regularly
   - Use specific versions, not `latest` in production

3. **Network Security**:

   - Enable SSL/TLS in Coolify
   - Use private networks between containers
   - Restrict database access

4. **Access Control**:
   - Keep GitHub packages private unless needed
   - Use GitHub PAT with minimal scopes
   - Regularly review Coolify access

## Cost Optimization

### GitHub

- Free tier includes:
  - 2000 CI/CD minutes/month
  - 500MB package storage
  - Unlimited public repositories

### Coolify

- Self-hosted (your server costs)
- No per-deployment fees
- Pay only for infrastructure

### Recommendations

- Use GitHub-hosted runners (free)
- Clean old image versions
- Optimize Dockerfile layers

## Support & Resources

- **Coolify Docs**: https://coolify.io/docs
- **GitHub Actions**: https://docs.github.com/actions
- **Docker Best Practices**: https://docs.docker.com/develop/dev-best-practices/

## Quick Reference

### Useful Commands

```bash
# View images in registry
gh api /user/packages/container/zettanote-backend/versions

# Manually trigger deployment
curl -X POST "${COOLIFY_WEBHOOK_URL}"

# Check image locally
docker pull ghcr.io/<user>/zettanote-backend:latest
docker run --rm -p 5000:5000 ghcr.io/<user>/zettanote-backend:latest

# View Coolify container logs
docker logs <container-id>
```

### URLs

- GitHub Packages: `https://github.com/<user>?tab=packages`
- Coolify Dashboard: `https://your-coolify-domain.com`
- API Health: `https://api.yourdomain.com/api/health`

## Checklist

Before deploying:

- [ ] MongoDB connection string is correct
- [ ] JWT_SECRET is set and secure
- [ ] ALLOWED_ORIGINS includes all domains
- [ ] Frontend config.js points to correct API URL
- [ ] Admin config.js points to correct API URL
- [ ] GitHub packages are accessible
- [ ] Coolify webhook URL is set (if using auto-deploy)
- [ ] SSL certificates are configured
- [ ] All services have health checks
- [ ] Environment variables are set in Coolify

After deploying:

- [ ] All services are running
- [ ] Health checks are passing
- [ ] Frontend is accessible
- [ ] Admin portal is accessible
- [ ] API endpoints respond correctly
- [ ] CORS is working
- [ ] Database connection is established
- [ ] Logs show no errors
