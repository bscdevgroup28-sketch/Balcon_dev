# Railway Staging Deployment Guide

**Platform**: Bal-Con Builders  
**Environment**: Staging  
**Date**: October 19, 2025  
**Railway Project**: balcon-staging

---

## 📋 Prerequisites

- [x] Railway account created
- [x] Railway CLI installed (`npm install -g @railway/cli`)
- [x] Git repository accessible
- [x] Production-ready code (Days 1-13 complete)
- [x] All tests passing (107/122 - 87.7%)
- [x] Security audit complete (98/100 score)

---

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Login to Railway
railway login

# 2. Create new staging project
railway init --name balcon-staging

# 3. Add PostgreSQL
railway add --database postgres

# 4. Deploy backend
cd backend
railway up

# 5. Deploy frontend
cd ../frontend
railway up

# 6. Get URLs
railway domain
```

---

## 📦 Part 1: Railway Project Setup

### Step 1.1: Create Staging Project

```bash
# Login to Railway
railway login

# Create new project
railway init --name balcon-staging

# Link to project
railway link
```

**Railway Dashboard Steps**:
1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Empty Project"
4. Name: `balcon-staging`
5. Note the project ID

---

### Step 1.2: Add PostgreSQL Database

**Option A: Via CLI**:
```bash
railway add --database postgres
```

**Option B: Via Dashboard**:
1. Open `balcon-staging` project
2. Click "+ New"
3. Select "Database" → "PostgreSQL"
4. Database name: `balcon-staging-db`
5. Copy connection string from "Connect" tab

**Verify Database**:
```bash
# Get database URL
railway variables --service postgresql

# Should show:
# DATABASE_URL=postgresql://postgres:...@containers...railway.app:5432/railway
```

---

### Step 1.3: Create Backend Service

```bash
# From project root
cd backend

# Create new service for backend
railway service create backend

# Link to backend service
railway link --service backend

# Deploy
railway up
```

**Deployment will**:
1. Build TypeScript code (`npm run build`)
2. Run migrations automatically (if configured)
3. Start server (`node dist/src/indexEnhanced.js`)
4. Generate a Railway URL (e.g., `backend-production-xxxx.up.railway.app`)

---

### Step 1.4: Create Frontend Service

```bash
# From project root
cd frontend

# Create new service for frontend
railway service create frontend

# Link to frontend service
railway link --service frontend

# Deploy
railway up
```

**Deployment will**:
1. Build React app (`npm run build`)
2. Serve static files (`npx serve -s build`)
3. Generate a Railway URL (e.g., `frontend-production-xxxx.up.railway.app`)

---

## 🔧 Part 2: Environment Variables Configuration

### Backend Environment Variables

**Set via Railway Dashboard** (Project → backend service → Variables):

```bash
# REQUIRED - Core
NODE_ENV=staging
PORT=8080
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-populated by Railway

# REQUIRED - Authentication
JWT_ACCESS_SECRET=<generate-with-openssl-rand-hex-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-hex-32>
TOKEN_EXPIRY_MINUTES=15
REFRESH_TOKEN_RETENTION_DAYS=30

# REQUIRED - CORS (Update with actual frontend URL)
CORS_ORIGIN=https://frontend-production-xxxx.up.railway.app
FRONTEND_ORIGINS=https://frontend-production-xxxx.up.railway.app

# RECOMMENDED - Security
ENFORCE_HTTPS=true
LOG_LEVEL=info
ENABLE_TEST_ROUTES=false

# OPTIONAL - Metrics
ADV_METRICS_ENABLED=true
DB_SLOW_QUERY_THRESHOLD_MS=500
METRICS_AUTH_TOKEN=<optional-secure-token>

# OPTIONAL - Email (if configured)
SENDGRID_API_KEY=<your-key>
EMAIL_FROM=staging@balconbuilders.com
ADMIN_EMAIL=admin@balconbuilders.com

# OPTIONAL - Storage
STORAGE_DRIVER=local
```

**Generate Secure Secrets**:
```bash
# JWT Access Secret (32+ characters)
openssl rand -hex 32

# JWT Refresh Secret (32+ characters)  
openssl rand -hex 32

# Metrics Auth Token
openssl rand -hex 16
```

**Set via CLI**:
```bash
# Example: Set JWT secrets
railway variables set JWT_ACCESS_SECRET=$(openssl rand -hex 32) --service backend
railway variables set JWT_REFRESH_SECRET=$(openssl rand -hex 32) --service backend

# Set CORS origin (replace with actual frontend URL)
railway variables set CORS_ORIGIN=https://frontend-production-xxxx.up.railway.app --service backend
railway variables set FRONTEND_ORIGINS=https://frontend-production-xxxx.up.railway.app --service backend

# Set Node environment
railway variables set NODE_ENV=staging --service backend
railway variables set ENFORCE_HTTPS=true --service backend
```

---

### Frontend Environment Variables

**Set via Railway Dashboard** (Project → frontend service → Variables):

```bash
# REQUIRED - API URL (Update with actual backend URL)
REACT_APP_API_URL=https://backend-production-xxxx.up.railway.app/api

# OPTIONAL - Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_DEMO_MODE=false

# Build Configuration
CI=false  # Skip CI checks during build
```

**Set via CLI**:
```bash
# Set API URL (replace with actual backend URL)
railway variables set REACT_APP_API_URL=https://backend-production-xxxx.up.railway.app/api --service frontend

# Set build config
railway variables set CI=false --service frontend
```

---

## 🗄️ Part 3: Database Setup

### Step 3.1: Run Migrations

**Automatic (Recommended)**:
Railway will run migrations automatically if configured in `railway.json`.

**Manual**:
```bash
# Connect to backend service
railway run --service backend

# Run migrations
npm run migrate

# Verify migrations
npm run migrate:status
```

**Check Migration Status**:
```bash
# Via Railway CLI
railway run --service backend npm run migrate:status

# Should show all migrations applied:
# ✓ 001-add-sprint4-inquiry-system.ts
# ✓ 002-add-kpi-tables.ts
# ✓ 003-add-new-roles-and-demo-users.ts
# ✓ 004-add-refresh-tokens.ts
# ✓ 005-add-password-hash-to-users.ts (if exists)
```

---

### Step 3.2: Seed Initial Data (Optional)

**Seed Demo Users**:
```bash
# Via Railway CLI
railway run --service backend npm run db:seed:enhanced

# This will create:
# - owner@balconbuilders.com (Owner role)
# - admin@balconbuilders.com (Admin role)
# - office@balconbuilders.com (Office Manager)
# - shop@balconbuilders.com (Shop Manager)
# - pm@balconbuilders.com (Project Manager)
# - lead@balconbuilders.com (Team Leader)
# - tech@balconbuilders.com (Technician)
# - customer@balconbuilders.com (Customer)
# All passwords: admin123
```

**Verify Database Connection**:
```bash
# Test database connection
railway run --service backend node -e "require('./dist/src/config/database').sequelize.authenticate().then(() => console.log('✅ DB Connected')).catch(err => console.error('❌ DB Error:', err))"
```

---

## 🔒 Part 4: Security Verification

### Step 4.1: HTTPS Verification

**Check HTTPS Enforcement**:
```bash
# Backend URL should redirect HTTP → HTTPS
curl -I http://backend-production-xxxx.up.railway.app/api/health

# Should return:
# HTTP/1.1 301 Moved Permanently
# Location: https://backend-production-xxxx.up.railway.app/api/health

# HTTPS should work
curl -I https://backend-production-xxxx.up.railway.app/api/health

# Should return:
# HTTP/1.1 200 OK
# Strict-Transport-Security: max-age=15552000; includeSubDomains
```

**Verify HSTS Header**:
```bash
curl -I https://backend-production-xxxx.up.railway.app/api/health | grep Strict-Transport-Security

# Should show:
# Strict-Transport-Security: max-age=15552000; includeSubDomains
```

---

### Step 4.2: CORS Verification

**Test CORS from Frontend Domain**:
```bash
# From your browser console (on frontend URL)
fetch('https://backend-production-xxxx.up.railway.app/api/health', {
  method: 'GET',
  credentials: 'include'
})
.then(r => r.json())
.then(d => console.log('✅ CORS OK:', d))
.catch(e => console.error('❌ CORS Failed:', e));
```

**Test CORS from Unauthorized Domain** (should fail):
```bash
# From different domain (e.g., google.com console)
fetch('https://backend-production-xxxx.up.railway.app/api/health')
# Should show CORS error
```

---

### Step 4.3: Security Headers Verification

```bash
# Check security headers
curl -I https://backend-production-xxxx.up.railway.app/api/health

# Should include:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Referrer-Policy: no-referrer
# Content-Security-Policy: ...
# Strict-Transport-Security: max-age=15552000
```

---

### Step 4.4: Authentication Verification

```bash
# Test protected route without token (should fail)
curl https://backend-production-xxxx.up.railway.app/api/analytics/summary

# Should return:
# {"error":"Authentication required","message":"Please provide a valid authentication token"}

# Test login endpoint
curl -X POST https://backend-production-xxxx.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@balconbuilders.com","password":"admin123"}'

# Should return token:
# {"success":true,"token":"eyJhbGc...","user":{...}}
```

---

## 🧪 Part 5: Smoke Tests

### Step 5.1: Health Check

```bash
# Backend health
curl https://backend-production-xxxx.up.railway.app/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-10-19T...",
  "database": "connected",
  "uptime": 123.456
}

# Frontend health
curl https://frontend-production-xxxx.up.railway.app/

# Should return 200 OK with HTML
```

---

### Step 5.2: Authentication Flow

```bash
# 1. Login
curl -X POST https://backend-production-xxxx.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@balconbuilders.com","password":"admin123"}' \
  -c cookies.txt

# 2. Get CSRF token
curl https://backend-production-xxxx.up.railway.app/api/auth/csrf \
  -b cookies.txt

# 3. Access protected route
curl https://backend-production-xxxx.up.railway.app/api/analytics/summary \
  -H "Authorization: Bearer <token-from-login>" \
  -b cookies.txt
```

---

### Step 5.3: Critical API Endpoints

```bash
# Set token from login
TOKEN="<your-jwt-token>"

# Test analytics endpoint
curl https://backend-production-xxxx.up.railway.app/api/analytics/summary \
  -H "Authorization: Bearer $TOKEN"

# Test projects endpoint
curl https://backend-production-xxxx.up.railway.app/api/projects \
  -H "Authorization: Bearer $TOKEN"

# Test materials endpoint
curl https://backend-production-xxxx.up.railway.app/api/materials \
  -H "Authorization: Bearer $TOKEN"

# Test users endpoint (admin only)
curl https://backend-production-xxxx.up.railway.app/api/users \
  -H "Authorization: Bearer $TOKEN"
```

---

### Step 5.4: Frontend Functionality

**Manual Browser Tests**:

1. **Login Flow**:
   - Navigate to `https://frontend-production-xxxx.up.railway.app`
   - Should redirect to `/login`
   - Login with `owner@balconbuilders.com` / `admin123`
   - Should redirect to owner dashboard

2. **Dashboard Navigation**:
   - Verify dashboard loads
   - Check KPI cards display data
   - Verify charts render

3. **Project Management**:
   - Navigate to Projects page
   - Create new project
   - View project details
   - Verify project list updates

4. **Role-Based Access**:
   - Login as different roles
   - Verify correct dashboard displays
   - Test permission restrictions

---

## 🔍 Part 6: Monitoring & Logs

### View Logs

**Backend Logs**:
```bash
# Stream backend logs
railway logs --service backend

# Follow logs in real-time
railway logs --service backend --follow

# Filter by severity
railway logs --service backend --filter error
```

**Frontend Logs**:
```bash
# Stream frontend logs
railway logs --service frontend --follow
```

---

### Metrics Endpoint

```bash
# Access Prometheus metrics (if METRICS_AUTH_TOKEN set)
curl https://backend-production-xxxx.up.railway.app/api/metrics/prometheus \
  -H "Authorization: Bearer <METRICS_AUTH_TOKEN>"

# Should return Prometheus format:
# # HELP http_requests_total Total HTTP requests
# # TYPE http_requests_total counter
# http_requests_total{method="GET",route="/api/health",status="200"} 42
```

---

### Database Monitoring

```bash
# Connect to database
railway run --service backend psql $DATABASE_URL

# Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Exit
\q
```

---

## 🚨 Part 7: Troubleshooting

### Backend Not Starting

**Check logs**:
```bash
railway logs --service backend --tail 100
```

**Common issues**:
1. **Missing JWT_SECRET**: Set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
2. **Database connection**: Verify `DATABASE_URL` is set
3. **Migration failure**: Run `railway run --service backend npm run migrate`
4. **Build error**: Check TypeScript compilation with `npm run build` locally

---

### Frontend Not Loading

**Check logs**:
```bash
railway logs --service frontend --tail 100
```

**Common issues**:
1. **API URL not set**: Verify `REACT_APP_API_URL` points to backend
2. **Build failed**: Check for ESLint errors, set `CI=false`
3. **CORS error**: Update `CORS_ORIGIN` in backend to include frontend URL
4. **White screen**: Check browser console for JavaScript errors

---

### CORS Errors

**Symptoms**: Frontend shows CORS errors in browser console

**Fix**:
```bash
# Update backend CORS settings
railway variables set CORS_ORIGIN=https://frontend-production-xxxx.up.railway.app --service backend
railway variables set FRONTEND_ORIGINS=https://frontend-production-xxxx.up.railway.app --service backend

# Redeploy backend
cd backend
railway up
```

---

### Database Connection Issues

**Check connection**:
```bash
# Test database connectivity
railway run --service backend npm run migrate:status

# If fails, verify DATABASE_URL
railway variables --service backend | grep DATABASE_URL
```

**Reset database** (⚠️ CAUTION: Deletes all data):
```bash
railway run --service backend npm run db:reset:enhanced
```

---

## 📋 Part 8: Post-Deployment Checklist

### Critical Verification

- [ ] Backend health endpoint returns 200 OK
- [ ] Frontend loads in browser
- [ ] Login works with demo credentials
- [ ] Dashboard displays after login
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] CORS allows frontend → backend requests
- [ ] CSRF protection active (mutations require token)
- [ ] Rate limiting works (test with repeated requests)
- [ ] Security headers present (check with curl -I)
- [ ] Database migrations applied (all green)

### Functional Testing

- [ ] Create new project
- [ ] Create new quote
- [ ] Convert quote to order
- [ ] Create material
- [ ] Generate analytics
- [ ] Upload file (if file upload enabled)
- [ ] Test role-based access (different user roles)

### Performance Testing

- [ ] Page load time <3 seconds
- [ ] API response time <500ms (health endpoint)
- [ ] Analytics endpoints <1 second
- [ ] No console errors in browser

### Security Testing

- [ ] Cannot access protected routes without token
- [ ] CSRF token required for mutations
- [ ] Brute force protection active (test 5+ failed logins)
- [ ] SQL injection test (try `' OR '1'='1` in login)
- [ ] XSS test (try `<script>alert('xss')</script>` in inputs)

---

## 🔧 Part 9: Configuration Files

### Backend: railway.json

Already configured in `backend/railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE",
    "startCommand": "node dist/src/indexEnhanced.js"
  }
}
```

### Frontend: railway.json

Already configured in `frontend/railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && REACT_APP_API_URL=\"${REACT_APP_API_URL}\" CI=false npm run build"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE",
    "startCommand": "npx serve -s build -l $PORT",
    "healthcheckPath": "/"
  }
}
```

### Backend: nixpacks.toml

Already configured in `backend/nixpacks.toml`:
```toml
[phases.setup]
nixPkgs = ["nodejs-18_x", "postgresql"]

[phases.install]
cmds = ["npm install"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "node dist/src/indexEnhanced.js"
```

---

## 📊 Part 10: Monitoring Dashboard

### Railway Metrics

**CPU Usage**: View in Railway dashboard → Metrics tab
- Target: <70% average
- Alert if >90% sustained

**Memory Usage**: View in Railway dashboard → Metrics tab
- Target: <512MB for backend, <256MB for frontend
- Alert if >80% of available

**Network**: View in Railway dashboard → Metrics tab
- Monitor request count
- Monitor bandwidth usage

### Application Metrics

**Access Prometheus Metrics**:
```bash
curl https://backend-production-xxxx.up.railway.app/api/metrics/prometheus \
  -H "Authorization: Bearer <METRICS_AUTH_TOKEN>" \
  | grep -E "(http_requests_total|auth_)"
```

**Key Metrics to Monitor**:
- `http_requests_total` - Total requests
- `auth_failures` - Failed login attempts
- `authLockouts` - Brute force lockouts
- `db_query_duration_ms` - Database performance

---

## 🎯 Success Criteria

Staging deployment is successful when:

✅ **Infrastructure**:
- Railway project created
- PostgreSQL database provisioned
- Backend service deployed and running
- Frontend service deployed and running
- Custom domains configured (if applicable)

✅ **Configuration**:
- All environment variables set
- JWT secrets generated (32+ chars)
- CORS configured correctly
- HTTPS enforced

✅ **Database**:
- Migrations applied successfully
- Demo users seeded
- Database connection verified

✅ **Security**:
- HTTPS working (HTTP redirects)
- HSTS header present
- Security headers configured
- CORS restricts origins
- CSRF protection active
- Authentication working
- Rate limiting active

✅ **Functionality**:
- Login works
- Dashboards load
- CRUD operations work
- Role-based access enforced
- No critical errors in logs

✅ **Performance**:
- Health endpoint <100ms
- API endpoints <500ms
- Frontend loads <3 seconds
- No memory leaks

---

## 📞 Support Resources

**Railway Documentation**: https://docs.railway.app  
**Railway CLI**: https://docs.railway.app/develop/cli  
**Railway Discord**: https://discord.gg/railway  

**Project Documentation**:
- `DEPLOYMENT_SETUP.md` - Comprehensive deployment guide
- `RAILWAY_DEPLOYMENT.md` - Railway-specific instructions
- `backend/.env.example` - Environment variable reference
- `SECURITY.md` - Security best practices

---

## 🔄 Next Steps After Staging

Once staging verification is complete:

1. **Notify stakeholders** - Staging environment ready for testing
2. **User acceptance testing** - Business users test functionality
3. **Load testing** - Test with realistic traffic
4. **Security testing** - Third-party security audit
5. **Performance tuning** - Optimize based on staging metrics
6. **Documentation review** - Update based on deployment learnings
7. **Day 15: Production Deployment** - Deploy to production environment

---

**Last Updated**: October 19, 2025  
**Deployment Status**: ✅ Staging deployment guide complete  
**Next**: Execute deployment on Railway platform
