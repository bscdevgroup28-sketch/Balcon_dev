# Environment Variables Checklist

**Platform**: Bal-Con Builders  
**Environment**: Staging / Production  
**Last Updated**: October 19, 2025

---

## 📋 Quick Reference

| Category | Backend | Frontend | Total |
|----------|---------|----------|-------|
| **REQUIRED** | 7 | 1 | 8 |
| **RECOMMENDED** | 6 | 1 | 7 |
| **OPTIONAL** | 15 | 2 | 17 |
| **Total** | 28 | 4 | 32 |

---

## 🔴 CRITICAL - Backend (Must Set Before Deployment)

### 1. NODE_ENV
- **Type**: String
- **Required**: ✅ YES
- **Default**: development
- **Staging Value**: `staging`
- **Production Value**: `production`
- **Description**: Node.js environment mode. Affects logging, error handling, and security features.
- **Security Impact**: HIGH - Enables production security features

### 2. DATABASE_URL
- **Type**: Connection String
- **Required**: ✅ YES
- **Default**: `sqlite:./enhanced_database.sqlite` (dev only)
- **Staging Value**: `postgresql://user:pass@host:5432/balcon_staging`
- **Production Value**: `postgresql://user:pass@host:5432/balcon_production`
- **Railway Value**: `${{Postgres.DATABASE_URL}}` (auto-populated)
- **Description**: Database connection string for PostgreSQL
- **Security Impact**: CRITICAL - Database access credentials

### 3. JWT_ACCESS_SECRET
- **Type**: String (32+ characters)
- **Required**: ✅ YES
- **Default**: ⚠️ INSECURE_DEV_SECRET (dev only)
- **Staging/Production Value**: Generate with `openssl rand -hex 32`
- **Description**: Secret key for JWT access token signing
- **Security Impact**: CRITICAL - Token authentication security
- **⚠️ WARNING**: NEVER use default value in staging/production

### 4. JWT_REFRESH_SECRET
- **Type**: String (32+ characters)
- **Required**: ✅ YES
- **Default**: ⚠️ INSECURE_DEV_REFRESH_SECRET (dev only)
- **Staging/Production Value**: Generate with `openssl rand -hex 32`
- **Description**: Secret key for JWT refresh token signing
- **Security Impact**: CRITICAL - Refresh token security
- **⚠️ WARNING**: NEVER use default value in staging/production

### 5. CORS_ORIGIN
- **Type**: String (comma-separated URLs)
- **Required**: ✅ YES
- **Default**: `http://localhost:3000` (dev only)
- **Staging Value**: `https://frontend-staging.railway.app`
- **Production Value**: `https://app.balconbuilders.com,https://www.balconbuilders.com`
- **Description**: Allowed origins for CORS (Cross-Origin Resource Sharing)
- **Security Impact**: HIGH - Controls which domains can access API

### 6. FRONTEND_ORIGINS
- **Type**: String (comma-separated URLs)
- **Required**: ✅ YES
- **Default**: `http://localhost:3000` (dev only)
- **Staging Value**: `https://frontend-staging.railway.app`
- **Production Value**: `https://app.balconbuilders.com,https://www.balconbuilders.com`
- **Description**: Trusted frontend origins for advanced CORS policies
- **Security Impact**: HIGH - Additional layer of origin validation

### 7. PORT
- **Type**: Number
- **Required**: ✅ YES (Railway auto-sets)
- **Default**: 8082 (dev), 8080 (Railway)
- **Staging/Production Value**: `$PORT` (auto-set by Railway)
- **Description**: HTTP server port
- **Security Impact**: LOW - Infrastructure configuration

---

## 🟡 RECOMMENDED - Backend (Strongly Advised)

### 8. TOKEN_EXPIRY_MINUTES
- **Type**: Number
- **Required**: ⚠️ RECOMMENDED
- **Default**: 15
- **Staging Value**: `15` (15 minutes)
- **Production Value**: `15` (15 minutes)
- **Description**: Access token expiration time in minutes
- **Security Impact**: MEDIUM - Balance security vs user experience

### 9. REFRESH_TOKEN_RETENTION_DAYS
- **Type**: Number
- **Required**: ⚠️ RECOMMENDED
- **Default**: 30
- **Staging Value**: `7` (1 week for testing)
- **Production Value**: `30` (30 days)
- **Description**: How long refresh tokens remain valid
- **Security Impact**: MEDIUM - Longer = more convenient, less secure

### 10. ENFORCE_HTTPS
- **Type**: Boolean
- **Required**: ⚠️ RECOMMENDED
- **Default**: false
- **Staging Value**: `true`
- **Production Value**: `true`
- **Description**: Redirect HTTP to HTTPS, enforce secure connections
- **Security Impact**: HIGH - Prevents man-in-the-middle attacks

### 11. LOG_LEVEL
- **Type**: String (debug|info|warn|error)
- **Required**: ⚠️ RECOMMENDED
- **Default**: debug
- **Staging Value**: `info`
- **Production Value**: `warn`
- **Description**: Logging verbosity level
- **Security Impact**: LOW - Affects log volume, may expose sensitive data at debug level

### 12. ADV_METRICS_ENABLED
- **Type**: Boolean
- **Required**: ⚠️ RECOMMENDED
- **Default**: false
- **Staging Value**: `true`
- **Production Value**: `true`
- **Description**: Enable advanced Prometheus metrics collection
- **Security Impact**: LOW - Useful for monitoring

### 13. METRICS_AUTH_TOKEN
- **Type**: String
- **Required**: ⚠️ RECOMMENDED (if ADV_METRICS_ENABLED=true)
- **Default**: undefined (metrics endpoint public)
- **Staging/Production Value**: Generate with `openssl rand -hex 16`
- **Description**: Bearer token to protect /api/metrics/prometheus endpoint
- **Security Impact**: MEDIUM - Prevents unauthorized metrics access

---

## ⚪ OPTIONAL - Backend (Can Use Defaults)

### 14. ENABLE_TEST_ROUTES
- **Type**: Boolean
- **Required**: ❌ OPTIONAL
- **Default**: true (dev), false (production)
- **Staging Value**: `false`
- **Production Value**: `false`
- **Description**: Enable /api/test/* endpoints for development
- **Security Impact**: HIGH - MUST be false in staging/production

### 15. DB_SLOW_QUERY_THRESHOLD_MS
- **Type**: Number
- **Required**: ❌ OPTIONAL
- **Default**: 500
- **Staging/Production Value**: `500` (500ms)
- **Description**: Log database queries slower than this threshold
- **Security Impact**: NONE - Performance monitoring only

### 16. DB_QUERY_LOGGING
- **Type**: Boolean
- **Required**: ❌ OPTIONAL
- **Default**: false
- **Staging Value**: `false`
- **Production Value**: `false`
- **Description**: Log all database queries (verbose)
- **Security Impact**: LOW - May expose query patterns

### 17. DIAG_ENDPOINTS_ENABLED
- **Type**: Boolean
- **Required**: ❌ OPTIONAL
- **Default**: false
- **Staging Value**: `true` (for debugging)
- **Production Value**: `false`
- **Description**: Enable diagnostic endpoints (/api/diagnostic/*)
- **Security Impact**: MEDIUM - Should be disabled in production

### 18. REFRESH_TOKEN_CLEANUP_INTERVAL_MS
- **Type**: Number
- **Required**: ❌ OPTIONAL
- **Default**: 3600000 (1 hour)
- **Staging/Production Value**: `3600000`
- **Description**: How often to clean up expired refresh tokens
- **Security Impact**: NONE - Database maintenance

### 19. STORAGE_DRIVER
- **Type**: String (local|s3|gcs)
- **Required**: ❌ OPTIONAL
- **Default**: local
- **Staging Value**: `local`
- **Production Value**: `s3` or `gcs` (recommended for production)
- **Description**: File storage backend
- **Security Impact**: LOW - Affects file persistence

### 20. REDIS_URL
- **Type**: Connection String
- **Required**: ❌ OPTIONAL
- **Default**: undefined (in-memory cache)
- **Staging/Production Value**: `redis://default:password@host:6379`
- **Description**: Redis connection for distributed caching
- **Security Impact**: LOW - Performance optimization

### 21. SENDGRID_API_KEY
- **Type**: String
- **Required**: ❌ OPTIONAL
- **Default**: undefined (email disabled)
- **Staging/Production Value**: `SG.xxxxxxxx`
- **Description**: SendGrid API key for email notifications
- **Security Impact**: LOW - Email functionality only

### 22. EMAIL_FROM
- **Type**: Email Address
- **Required**: ❌ OPTIONAL (if SENDGRID_API_KEY set)
- **Default**: noreply@balconbuilders.com
- **Staging Value**: `staging@balconbuilders.com`
- **Production Value**: `noreply@balconbuilders.com`
- **Description**: Sender email address
- **Security Impact**: NONE - Email metadata

### 23. ADMIN_EMAIL
- **Type**: Email Address
- **Required**: ❌ OPTIONAL
- **Default**: admin@balconbuilders.com
- **Staging/Production Value**: `admin@balconbuilders.com`
- **Description**: Admin email for alerts and notifications
- **Security Impact**: NONE - Email metadata

### 24. RATE_LIMIT_WINDOW_MS
- **Type**: Number
- **Required**: ❌ OPTIONAL
- **Default**: 900000 (15 minutes)
- **Staging/Production Value**: `900000`
- **Description**: Rate limiting window duration
- **Security Impact**: MEDIUM - DDoS protection

### 25. RATE_LIMIT_MAX_REQUESTS
- **Type**: Number
- **Required**: ❌ OPTIONAL
- **Default**: 100
- **Staging/Production Value**: `100`
- **Description**: Max requests per IP within rate limit window
- **Security Impact**: MEDIUM - DDoS protection

### 26. BRUTE_FORCE_MAX_ATTEMPTS
- **Type**: Number
- **Required**: ❌ OPTIONAL
- **Default**: 5
- **Staging/Production Value**: `5`
- **Description**: Max failed login attempts before lockout
- **Security Impact**: MEDIUM - Brute force protection

### 27. BRUTE_FORCE_LOCKOUT_MINUTES
- **Type**: Number
- **Required**: ❌ OPTIONAL
- **Default**: 15
- **Staging/Production Value**: `15`
- **Description**: Lockout duration after failed login attempts
- **Security Impact**: MEDIUM - Brute force protection

### 28. CSRF_SECRET
- **Type**: String
- **Required**: ❌ OPTIONAL
- **Default**: Auto-generated
- **Staging/Production Value**: Generate with `openssl rand -hex 32`
- **Description**: Secret for CSRF token generation (double-submit cookie pattern)
- **Security Impact**: HIGH - CSRF protection

---

## 🔴 CRITICAL - Frontend (Must Set Before Deployment)

### 1. REACT_APP_API_URL
- **Type**: URL
- **Required**: ✅ YES
- **Default**: http://localhost:8082/api (dev only)
- **Staging Value**: `https://backend-staging.railway.app/api`
- **Production Value**: `https://api.balconbuilders.com/api`
- **Railway Auto-Value**: `${BACKEND_PUBLIC_URL}/api` (in railway.json)
- **Description**: Backend API base URL
- **Security Impact**: HIGH - Must point to correct backend

---

## 🟡 RECOMMENDED - Frontend (Strongly Advised)

### 2. CI
- **Type**: Boolean
- **Required**: ⚠️ RECOMMENDED
- **Default**: true (fails build on warnings)
- **Staging/Production Value**: `false`
- **Description**: Continuous Integration mode (Railway sets this)
- **Security Impact**: NONE - Build configuration

---

## ⚪ OPTIONAL - Frontend (Can Use Defaults)

### 3. REACT_APP_ENABLE_ANALYTICS
- **Type**: Boolean
- **Required**: ❌ OPTIONAL
- **Default**: false
- **Staging Value**: `true`
- **Production Value**: `true`
- **Description**: Enable frontend analytics tracking
- **Security Impact**: NONE - Feature flag

### 4. REACT_APP_DEMO_MODE
- **Type**: Boolean
- **Required**: ❌ OPTIONAL
- **Default**: false
- **Staging Value**: `true` (show demo badges)
- **Production Value**: `false`
- **Description**: Enable demo mode indicators
- **Security Impact**: NONE - UI feature flag

---

## 🚀 Railway Auto-Populated Variables

Railway automatically provides these variables (no manual setup needed):

### Backend
- `DATABASE_URL` - Populated when PostgreSQL service is added
- `PORT` - Railway assigns port automatically

### Frontend
- `BACKEND_PUBLIC_URL` - Auto-populated from backend service (used in railway.json)

---

## 🔒 Security Best Practices

### JWT Secrets Generation
```bash
# Generate strong JWT secrets (32+ characters)
openssl rand -hex 32
# Output: a1b2c3d4e5f6...

# Use different secrets for access and refresh tokens
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
```

### CSRF Secret Generation
```bash
# Generate CSRF secret
openssl rand -hex 32
```

### Metrics Auth Token Generation
```bash
# Generate metrics token (16+ characters)
openssl rand -hex 16
```

### Environment-Specific Secrets
- ✅ **DO**: Use different secrets for staging vs production
- ❌ **DON'T**: Reuse production secrets in staging
- ❌ **DON'T**: Commit secrets to version control
- ❌ **DON'T**: Use default dev secrets in production

---

## 📋 Deployment Checklist

### Before Backend Deployment
- [ ] NODE_ENV=staging or production
- [ ] DATABASE_URL configured (Railway auto-sets)
- [ ] JWT_ACCESS_SECRET generated (32+ chars)
- [ ] JWT_REFRESH_SECRET generated (32+ chars)
- [ ] CORS_ORIGIN includes frontend URL
- [ ] FRONTEND_ORIGINS includes frontend URL
- [ ] ENFORCE_HTTPS=true
- [ ] ENABLE_TEST_ROUTES=false
- [ ] LOG_LEVEL=info or warn

### Before Frontend Deployment
- [ ] REACT_APP_API_URL points to backend
- [ ] CI=false (Railway build config)

### Post-Deployment Verification
- [ ] Login works (test with demo credentials)
- [ ] CORS allows frontend → backend requests
- [ ] HTTPS enforced (HTTP redirects)
- [ ] Protected routes require authentication
- [ ] Rate limiting active (test with curl)
- [ ] Metrics endpoint secured (if ADV_METRICS_ENABLED)

---

## 🔧 Railway CLI Commands

### Set Variables
```bash
# Backend variables
railway variables set JWT_ACCESS_SECRET=$(openssl rand -hex 32) --service backend
railway variables set JWT_REFRESH_SECRET=$(openssl rand -hex 32) --service backend
railway variables set NODE_ENV=staging --service backend
railway variables set ENFORCE_HTTPS=true --service backend
railway variables set CORS_ORIGIN=https://frontend-staging.railway.app --service backend
railway variables set FRONTEND_ORIGINS=https://frontend-staging.railway.app --service backend

# Frontend variables
railway variables set REACT_APP_API_URL=https://backend-staging.railway.app/api --service frontend
railway variables set CI=false --service frontend
```

### View Variables
```bash
# List all backend variables
railway variables --service backend

# List all frontend variables
railway variables --service frontend

# View specific variable
railway variables --service backend | grep JWT_ACCESS_SECRET
```

### Delete Variables
```bash
# Remove variable
railway variables delete VARIABLE_NAME --service backend
```

---

## 📊 Environment Comparison

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| NODE_ENV | development | staging | production |
| DATABASE_URL | SQLite | PostgreSQL | PostgreSQL |
| JWT_ACCESS_SECRET | default | generated | generated |
| JWT_REFRESH_SECRET | default | generated | generated |
| CORS_ORIGIN | localhost:3000 | Railway URL | Custom domain |
| ENFORCE_HTTPS | false | true | true |
| LOG_LEVEL | debug | info | warn |
| ENABLE_TEST_ROUTES | true | false | false |
| ADV_METRICS_ENABLED | false | true | true |
| DIAG_ENDPOINTS_ENABLED | true | true | false |

---

## 🎯 Summary

**Total Variables**: 32 (28 backend, 4 frontend)

**Critical Priority** (8 variables):
- Backend: NODE_ENV, DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, CORS_ORIGIN, FRONTEND_ORIGINS, PORT
- Frontend: REACT_APP_API_URL

**Estimated Setup Time**:
- Minimum (critical only): 10 minutes
- Recommended (critical + recommended): 20 minutes
- Complete (all optional): 30 minutes

**Security Score Impact**:
- Critical only: 85/100
- Critical + recommended: 95/100
- Critical + recommended + security optional: 98/100

---

**Last Updated**: October 19, 2025  
**Status**: ✅ Complete environment variable documentation  
**Next**: Set variables in Railway and deploy
