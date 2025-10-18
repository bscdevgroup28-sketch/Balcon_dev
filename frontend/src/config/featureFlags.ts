// Centralized feature flags for the frontend
// Usage: set REACT_APP_NEW_LAYOUT=true at build time to enable the new navigation preview route

export const flags = {
  newLayout: (process.env.REACT_APP_NEW_LAYOUT || '').toLowerCase() === 'true',
};

export type FeatureFlags = typeof flags;
