# Frontend Runtime Environment Overrides

The application supports overriding build-time environment variables (notably API base URL) at deploy time without rebuilding.

## Mechanism
- `public/env.template.js` provides a template.
- At deployment, copy or generate `public/env.js` (same directory as `index.html`).
- The file sets `window.__ENV__ = { REACT_APP_API_URL: 'https://api.example.com/api' }`.
- `src/config/api.ts` first checks `process.env.REACT_APP_API_URL` (build-time) then `window.__ENV__`.

## Deploy Example (Railway or any static host)
1. During build, leave template as-is.
2. After build, inject real values:
```
cp build/env.template.js build/env.js
sed -i "s|%%API_URL%%|https://api.myprod.com/api|" build/env.js
```
3. Serve `build/` directory. Browser loads `env.js` before main bundle (script tag added to `index.html`).

## Fallback Behavior
If no `env.js` present and no build-time variable, defaults to `http://localhost:8082/api`.

## Changing API URL Post-Deployment
Edit `env.js` only—no rebuild required. Clients receive new base next hard reload.

## Security Note
Do not put secrets into `env.js` (it is public). Only non-sensitive endpoint URLs.
