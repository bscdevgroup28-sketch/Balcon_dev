# Bal-Con Builders Frontend

Production-ready React (CRA) application using MUI, Redux Toolkit, Socket.IO, and a modular context layer.

## Environment Variables
Copy `.env.example` to `.env` and set at minimum:

```
REACT_APP_API_URL=https://<backend-domain>/api
```

Optional flags:
```
REACT_APP_PWA_ENABLED=true
REACT_APP_ANALYTICS_ENABLED=false
REACT_APP_DEMO_MODE=true
```

## Unified API / Socket Configuration
Use `src/config/api.ts` helpers:
- `API_BASE_URL` (always ends with /api)
- `SOCKET_BASE_URL` (API base minus trailing /api)

## Development
```
npm install
npm start
```

The app uses MUI with a professional palette and Inter font:
- Primary: #0D47A1 (deep blue)
- Secondary: #FF6F00 (construction orange)
- Success: #2E7D32 (green)
Inter is loaded via Google Fonts in `public/index.html`.

## Production Build
```
npm run build
```
Build output in `build/` can be deployed by Railway (Nixpacks) or any static host.

## Lint & Tests
```
npm run lint
npm test
```

## WebSocket Integration
`WebSocketContext` wraps the app to provide:
- live project activity
- notifications
- typing indicators

## Deployment Notes
Ensure backend CORS allows the deployed frontend origin. Set `REACT_APP_API_URL` in Railway variables for the frontend service so build-time API endpoint is correct.

### Optional Runtime Override (Without Rebuild)
Place a generated `env.js` in `public/` (based on `public/env.template.js`) before serving:
```
window.__ENV__ = { REACT_APP_API_URL: 'https://your-backend/api' };
```
The app will use this at runtime if present.

## Bundle Analysis
```
npm run analyze
```
Generates `reports/frontend-bundle-analysis.html`.
