// Central API + Socket configuration helpers
// Ensures consistent derivation of base URLs across HTTP and WebSocket layers.

declare global {
  interface Window {
    __ENV__?: Record<string, string | undefined>;
  }
}

function readEnv(key: string): string | undefined {
  return (typeof process !== 'undefined' && process.env[key]) || window.__ENV__?.[key];
}

export function getRawApiEnv(): string | undefined {
  return readEnv('REACT_APP_API_URL');
}

export function getApiBase(): string {
  const fallback = 'http://localhost:8082/api';
  let base = getRawApiEnv() || fallback;
  // Remove any trailing slashes
  base = base.replace(/\/+$/, '');
  return base;
}

export function getSocketBase(): string {
  // If API base ends with /api strip it for socket origin.
  const api = getApiBase();
  return api.replace(/\/api$/i, '');
}

export const API_BASE_URL = getApiBase();
export const SOCKET_BASE_URL = getSocketBase();

const apiConfig = { API_BASE_URL, SOCKET_BASE_URL, getApiBase, getSocketBase };
export default apiConfig;
