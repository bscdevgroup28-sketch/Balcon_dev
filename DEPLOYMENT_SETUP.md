# Railway + GitHub Deployment Setup

## Prerequisites Checklist ✅
- [x] GitHub account: bscdevgroup28@gmail.com
- [x] Railway account connected to GitHub
- [x] Google Cloud account (for future integrations)
- [x] GitHub repository: https://github.com/bscdevgroup28-sketch/Balcon_dev.git

## Step-by-Step Deployment

### 1. Railway Project Setup

#### Create New Project
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose: `bscdevgroup28-sketch/Balcon_dev`

#### Configure Backend Service
1. **Service Name**: `balcon-backend`
2. **Root Directory**: `/backend`
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. **Port**: Railway auto-detects from `process.env.PORT`

#### Configure Frontend Service  
1. **Service Name**: `balcon-frontend`
2. **Root Directory**: `/frontend`
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: Serve static files from `build/`

#### Add PostgreSQL Database
1. Click "Add Service" → "Database" → "PostgreSQL"
2. Railway auto-generates `DATABASE_URL`
3. Database will be available to both services

### 2. Environment Variables Configuration

#### Backend Environment Variables
Add these in Railway Backend service settings:

```bash
NODE_ENV=production
DATABASE_URL=${{ DATABASE_URL }}  # Auto-populated by Railway
JWT_SECRET=your_super_secure_jwt_secret_here_min_32_chars
JWT_EXPIRES_IN=7d
PORT=${{ PORT }}  # Auto-populated by Railway

# Email (optional)
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com

# CORS
CORS_ORIGIN=https://your-frontend-domain.railway.app

# File uploads
UPLOAD_PATH=uploads/
MAX_FILE_SIZE=10485760
MAX_FILES=10
```

#### Frontend Environment Variables
Add these in Railway Frontend service settings:

```bash
REACT_APP_API_URL=https://your-backend-domain.railway.app/api
```

### 3. GitHub Actions Setup

#### Required GitHub Secrets
Add these in your GitHub repository → Settings → Secrets:

```bash
RAILWAY_TOKEN=your_railway_api_token
RAILWAY_BACKEND_SERVICE_ID=your_backend_service_id
RAILWAY_FRONTEND_SERVICE_ID=your_frontend_service_id
```

**To get Railway API Token:**
1. Railway Dashboard → Account Settings → Tokens
2. Create new token with project access
3. Copy token value

**To get Service IDs:**
1. Railway service → Settings → Service ID
2. Copy the UUID for each service

### 4. Database Migration

The backend is already configured for PostgreSQL! The current setup:
- ✅ Supports both SQLite (dev) and PostgreSQL (production)
- ✅ Auto-detects database type from `DATABASE_URL`
- ✅ SSL configuration for production
- ✅ Connection pooling for PostgreSQL

### 5. Domain Configuration (Optional)

#### Custom Domains
1. Backend: `api.yourdomain.com`
2. Frontend: `app.yourdomain.com`

**Setup:**
1. Railway service → Settings → Domains
2. Add custom domain
3. Configure DNS CNAME records

### 6. Monitoring & Health Checks

#### Health Endpoints
- Backend: `https://your-backend.railway.app/api/health`
- Database connectivity check included

#### Logging
- Railway automatically captures logs
- Access via Railway Dashboard → Service → Logs

### 7. Production Checklist

#### Security
- [ ] Strong JWT secret (32+ random characters)
- [ ] CORS configured for production domains
- [ ] Environment variables secure (no secrets in code)
- [ ] HTTPS enforced (Railway default)

#### Performance  
- [ ] Database connection pooling enabled
- [ ] Static asset optimization (React build)
- [ ] Gzip compression (backend middleware)

#### Monitoring
- [ ] Health check endpoints working
- [ ] Error logging configured
- [ ] Database backups (Railway automatic)

### 8. Deployment Commands

#### Manual Deployment (if needed)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy backend
cd backend
railway up --service backend-service-id

# Deploy frontend  
cd frontend
railway up --service frontend-service-id
```

#### Automated Deployment
- ✅ GitHub Actions configured
- ✅ Auto-deploy on push to `main`
- ✅ Tests run before deployment
- ✅ Path-based deployment (only affected services)

### 9. Testing Deployment

#### After Setup:
1. **Backend Health**: `GET https://your-backend.railway.app/api/health`
2. **Frontend**: Visit `https://your-frontend.railway.app`
3. **Database**: Backend health check includes DB connectivity
4. **Auth Flow**: Test login/register functionality

#### Expected Response (Backend Health):
```json
{
  "status": "healthy",
  "timestamp": "2025-08-13T...",
  "database": "connected",
  "environment": "production"
}
```

### 10. Cost Estimation

#### Railway Pricing (Usage-based):
- **Hobby Plan**: $5/month + usage
- **Starter Plan**: $20/month + usage  
- **Database**: Included in plan
- **Bandwidth**: Generous limits

#### Estimated Monthly Cost (Low Traffic):
- Backend + Frontend + DB: ~$10-15/month
- Scales automatically with usage

---

## Quick Start Commands

```bash
# 1. Commit and push current changes
git add .
git commit -m "feat: add Railway deployment configuration"
git push origin main

# 2. Railway will auto-deploy from GitHub
# 3. Configure environment variables in Railway dashboard
# 4. Test deployment endpoints
```

## Next Steps
1. Set up Railway project and services
2. Configure environment variables
3. Push to trigger first deployment
4. Test all endpoints and functionality
5. Set up custom domains (optional)
6. Configure monitoring and alerts

**Status**: Ready for Railway deployment! 🚀
