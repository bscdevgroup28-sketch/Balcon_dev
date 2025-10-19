import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { enqueue, flush } from './offlineQueue';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ Enable cookies (httpOnly JWT)
});

// Request interceptor for CSRF token
api.interceptors.request.use(
  (config) => {
    // JWT token now sent automatically via httpOnly cookies
    // No manual Authorization header needed
    // Attach CSRF token for unsafe methods when cookies are used
    const method = (config.method || 'get').toLowerCase();
    if (['post','put','patch','delete'].includes(method)) {
      // Idempotency-Key for safe retries (Phase 11)
      const existingKey = (config.headers as any)['Idempotency-Key'] || (config.headers as any)['idempotency-key'];
      if (!existingKey) {
        const key = crypto.randomUUID?.() || (Date.now().toString(36) + Math.random().toString(36).slice(2));
        (config.headers as any)['Idempotency-Key'] = key;
      }
      // If we already have one cached, use it; else fire-and-forget fetch (best-effort)
      let csrf = localStorage.getItem('csrfToken');
      const needsFetch = !csrf || csrf.length < 8;
      if (needsFetch) {
        // Non-blocking update; request proceeds without header if not yet fetched
        api.get('/auth/csrf').then(r => {
          const t = r.data?.csrfToken;
          if (t) localStorage.setItem('csrfToken', t);
        }).catch(() => {/* ignore */});
      } else {
        (config.headers as any)['X-CSRF-Token'] = csrf;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If offline or network error, enqueue mutating request for later
    const method = (error?.config?.method || 'get').toLowerCase();
    const isMut = ['post','put','patch','delete'].includes(method);
    const isNetwork = !error.response; // no HTTP response
    if (isMut && (isNetwork || !navigator.onLine)) {
      const cfg = error.config || {};
      const url = cfg.url?.startsWith('http') ? cfg.url.replace(API_BASE_URL, '') : cfg.url;
      // Ensure idempotency header is preserved so retries reuse the same key
      const headers = { ...(cfg.headers || {}) } as any;
      if (!headers['Idempotency-Key'] && !headers['idempotency-key']) {
        headers['Idempotency-Key'] = crypto.randomUUID?.() || (Date.now().toString(36) + Math.random().toString(36).slice(2));
      }
      enqueue({ url: url || '/', method: method as any, body: cfg.data, headers }).catch(()=>{/* ignore */});
      // Best-effort async flush if back online soon
      if (navigator.onLine) setTimeout(()=> flush(api).catch(()=>{}), 1000);
    }
    if (error.response?.status === 401) {
      // Token is in httpOnly cookie - backend clears it on logout
      // Just redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Demo API methods
export const demoAPI = {
  // Get all demo users for role selection
  getDemoUsers: () => api.get('/demo/users'),
  
  // Demo login
  loginAsRole: (role: string) => api.post('/demo/login', { role }),
  
  // Get demo metrics for a specific role
  getMetrics: (role: string) => api.get(`/demo/metrics/${role}`),
  
  // Get demo projects
  getProjects: () => api.get('/demo/projects'),
};

export default api;
 
// Auth API helpers
export const authAPI = {
  requestPasswordReset: (email: string) => api.post('/auth/forgot-password', { email }),
  confirmPasswordReset: (token: string, newPassword: string) => api.post('/auth/forgot-password/confirm', { token, newPassword }),
};

// Analytics API helpers
export const analyticsAPI = {
  getSummary: () => api.get('/analytics/summary'),
  getTrends: (range: '30d' | '90d' | '365d' = '30d') => api.get('/analytics/trends', { params: { range } }),
  getAnomalies: (range: '30d' | '90d' = '30d', threshold?: number) => api.get('/analytics/anomalies', { params: { range, ...(threshold ? { threshold } : {}) } }),
  getForecast: (metric: 'quotesSent'|'quotesAccepted'|'ordersCreated'|'ordersDelivered'|'inventoryNetChange' = 'ordersCreated', horizon: number = 14) => api.get('/analytics/forecast', { params: { metric, horizon } }),
};
