# Railway Deployment Guide

## Overview
This repository is configured for full-stack deployment on Railway with:
- **Backend**: Node.js/Express API with Railway Postgres database
- **Frontend**: React static site build
- **Database**: Railway Postgres (managed)
- **CI/CD**: GitHub integration with automatic deployments

## Railway Project Structure

### Services:
1. **Backend API** (`backend/` folder)
   - Port: Railway auto-assigned
   - Health check: `/api/health`
   - Build: TypeScript compilation (`npm run build`)
   - Start: `npm start` (runs `node dist/indexEnhanced.js`)

2. **Frontend** (`frontend/` folder)
   - Static site deployment
   - Build: `npm run build`
   - Serve: Railway static hosting

3. **Database**
   - Railway Postgres addon
   - Connection via `DATABASE_URL` environment variable

## Environment Variables Setup

### Backend Service Variables:
```bash
NODE_ENV=production
PORT=${{ RAILWAY_STATIC_PORT }}
DATABASE_URL=${{ DATABASE_URL }}  # Auto-provided by Railway Postgres
JWT_SECRET=your_secure_random_string_here
FRONTEND_URL=https://your-frontend-domain.railway.app
```

### Frontend Service Variables:
```bash
REACT_APP_API_URL=https://your-backend-domain.railway.app/api
```

## Deployment Steps

### 1. Connect GitHub Repository
1. Go to Railway dashboard
2. Create new project
3. Connect to GitHub repository: `https://github.com/bscdevgroup28-sketch/Balcon_dev.git`

### 2. Set up Backend Service
1. Add service → Deploy from GitHub repo
2. Select root path: `/backend`
3. Railway will detect Node.js and use `railway.json` config
4. Add environment variables listed above

### 3. Set up Database
1. Add service → Database → PostgreSQL
2. Railway auto-creates `DATABASE_URL`
3. Backend will connect automatically

### 4. Set up Frontend Service
1. Add service → Deploy from GitHub repo  
2. Select root path: `/frontend`
3. Set build command: `npm install && npm run build`
4. Set start command: Railway will serve `build/` folder statically
5. Add `REACT_APP_API_URL` pointing to backend service

### 5. Configure Custom Domains (Optional)
1. Backend: `api.yourdomain.com`
2. Frontend: `app.yourdomain.com` or `yourdomain.com`

## Database Migration for Production

The backend currently uses SQLite for development. For Railway deployment:

1. Update `backend/src/config/database.ts` to use PostgreSQL:
```typescript
// Add PostgreSQL configuration
const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});
```

2. Add PostgreSQL dependency to `backend/package.json`:
```json
"pg": "^8.11.0",
"@types/pg": "^8.10.0"
```

## Health Checks & Monitoring

Backend health endpoint at `/api/health` provides:
- Service status
- Database connectivity
- Environment info

## Automatic Deployments

Railway automatically deploys when you push to:
- `main` branch → Production environment
- Configure branch-based deployments as needed

## Secrets Management

Store sensitive values in Railway environment variables:
- JWT secrets
- API keys
- Database credentials (auto-managed)

## Scaling & Performance

Railway auto-scales based on traffic:
- Backend: Automatic horizontal scaling
- Database: Managed PostgreSQL with backup
- Frontend: CDN-distributed static assets

## Troubleshooting

### Common Issues:
1. **Build failures**: Check `railway.json` build commands
2. **Database connection**: Verify `DATABASE_URL` environment variable
3. **CORS errors**: Update backend CORS config with frontend domain
4. **Static file serving**: Ensure frontend build output is in `build/` folder

### Logs Access:
- Railway dashboard → Service → Deploy logs
- Runtime logs available in service overview

## Cost Optimization

- Railway usage-based pricing
- Database auto-sleeps during low activity
- Frontend served via CDN (efficient static hosting)

---

Next: Push this config to GitHub and set up Railway services through the dashboard.
