// Runtime environment accessor. In future phases, we will inject window.ENV at container startup.
// For now, we fall back to build-time vars and defaults.
declare global {
  interface Window { ENV?: Record<string, string | undefined>; }
}

export const getEnv = (key: string, fallback?: string): string | undefined => {
  if (typeof window !== 'undefined' && window.ENV && key in window.ENV) {
    const v = window.ENV[key];
    if (typeof v === 'string' && v.length) return v;
  }
  // CRA build-time variables
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildTime: any = process.env;
  const v = buildTime[key as keyof typeof process.env] as unknown as string | undefined;
  return v ?? fallback;
};

export const API_BASE_URL = () =>
  getEnv('REACT_APP_API_URL', 'http://localhost:8082');
