# Balcon_dev Railway Deployment

**Date**: October 19, 2025  
**Project**: Balcon_dev  
**Environment**: Production

---

## 📊 Deployment Progress

### ✅ Completed Steps

1. **Railway Project Created**
   - Project: `Balcon_dev`
   - Project ID: `52b2448c-96b9-4507-8989-e803a3f11dbe`
   - URL: https://railway.com/project/52b2448c-96b9-4507-8989-e803a3f11dbe

2. **PostgreSQL Database Added**
   - Service: `Postgres`
   - Database: `railway`
   - Connection: `postgresql://postgres:jmqNhcPPvmcoWcowJBzujNZJQPuYoNae@postgres.railway.internal:5432/railway`
   - Public URL: `postgresql://postgres:jmqNhcPPvmcoWcowJBzujNZJQPuYoNae@shortline.proxy.rlwy.net:35190/railway`

3. **JWT Secrets Generated**
   - JWT_ACCESS_SECRET: `43df1c3bb34c8e3c23e0aa54bce663bb0f699ac91cee9ec6603e338644dcc1b6`
   - JWT_REFRESH_SECRET: `0dd789ed7058ee8a98f1b1fcb0762a6cc1a944b7af299867f9d5cbdff99a12de`

### 🔄 In Progress

4. **Backend Deployment**
   - Status: Uploading and compressing files
   - Directory: `/backend`
   - Start Command: `node dist/src/indexEnhanced.js`

### ⏳ Pending

5. **Backend Environment Variables** (to be set after deployment)
6. **Database Migrations**
7. **Frontend Deployment**
8. **Frontend Environment Variables**
9. **Health Verification**
10. **Smoke Tests**

---

## 🔐 Environment Variables Checklist

### Critical Variables (Must Set Before First Run)

```bash
# Node Environment
NODE_ENV=production

# Database (auto-configured by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Secrets
JWT_ACCESS_SECRET=43df1c3bb34c8e3c23e0aa54bce663bb0f699ac91cee9ec6603e338644dcc1b6
JWT_REFRESH_SECRET=0dd789ed7058ee8a98f1b1fcb0762a6cc1a944b7af299867f9d5cbdff99a12de

# CORS (will update after frontend deployment)
CORS_ORIGIN=https://frontend-production.up.railway.app
FRONTEND_ORIGINS=https://frontend-production.up.railway.app

# Port (auto-configured by Railway)
PORT=$PORT
```

### Recommended Variables

```bash
# Token Settings
TOKEN_EXPIRY_MINUTES=15
REFRESH_TOKEN_RETENTION_DAYS=30

# Security
ENFORCE_HTTPS=true
LOG_LEVEL=info

# Metrics
ADV_METRICS_ENABLED=true
METRICS_AUTH_TOKEN=<generate with: openssl rand -hex 16>
```

---

## 📝 Commands to Execute

### After Backend Deploys:

```powershell
# 1. Link to backend service
railway service

# 2. Set environment variables
railway variables set NODE_ENV=production
railway variables set JWT_ACCESS_SECRET=43df1c3bb34c8e3c23e0aa54bce663bb0f699ac91cee9ec6603e338644dcc1b6
railway variables set JWT_REFRESH_SECRET=0dd789ed7058ee8a98f1b1fcb0762a6cc1a944b7af299867f9d5cbdff99a12de
railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}'
railway variables set TOKEN_EXPIRY_MINUTES=15
railway variables set REFRESH_TOKEN_RETENTION_DAYS=30
railway variables set ENFORCE_HTTPS=true
railway variables set LOG_LEVEL=info
railway variables set ADV_METRICS_ENABLED=true

# 3. Get backend URL
railway domain

# 4. Run migrations
railway run npm run migrate

# 5. Restart service
railway up --detach
```

### Deploy Frontend:

```powershell
# 1. Navigate to frontend
cd ..\frontend

# 2. Deploy frontend
railway up

# 3. Link to frontend service
railway service

# 4. Set environment variable
railway variables set REACT_APP_API_URL=<backend-url-from-step-3>

# 5. Get frontend URL
railway domain
```

---

## 🎯 Expected Outcomes

### Backend Service
- URL: `https://<service-name>-production.up.railway.app`
- Health Check: `https://<backend-url>/api/health`
- Deep Health: `https://<backend-url>/api/health/deep`
- Metrics: `https://<backend-url>/api/metrics/prometheus`

### Frontend Service
- URL: `https://<frontend-service>-production.up.railway.app`
- Login Page: `https://<frontend-url>/login`
- System Health: `https://<frontend-url>/system/health`

### Database
- All migrations executed successfully
- Seed data populated
- Tables created with enhanced schema

---

## ✅ Verification Checklist

- [ ] Backend deployed and running
- [ ] Backend health endpoint returns 200
- [ ] Database migrations completed
- [ ] Frontend deployed and accessible
- [ ] Login page loads with Bal-Con branding
- [ ] Can authenticate with default credentials
- [ ] System health dashboard shows all green
- [ ] No console errors in frontend
- [ ] API calls work correctly

---

**Status**: 🔄 IN PROGRESS  
**Last Updated**: October 19, 2025 - Backend deploying
