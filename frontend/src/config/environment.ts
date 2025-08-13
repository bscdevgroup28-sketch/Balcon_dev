// Environment Configuration
// Centralizes all environment-specific settings

export const ENV_CONFIG = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  REACT_APP_ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'development',
  
  // App Info
  REACT_APP_NAME: process.env.REACT_APP_NAME || 'Bal-Con Builders',
  REACT_APP_VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  
  // API Configuration
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8082/api',
  
  // Local Configuration (external services disabled for local development)
  SUPABASE: {
    URL: 'http://localhost:8082', // Redirect to local backend
    ANON_KEY: 'local-development-key' // Placeholder for local development
  },
  
  // Feature Flags
  FEATURES: {
    PWA_ENABLED: process.env.REACT_APP_PWA_ENABLED === 'true',
    ANALYTICS_ENABLED: process.env.REACT_APP_ANALYTICS_ENABLED === 'true',
    DEMO_MODE: process.env.REACT_APP_DEMO_MODE !== 'false' // Default to true
  },
  
  // Development
  DEBUG: process.env.REACT_APP_DEBUG === 'true'
};

export const isDevelopment = () => ENV_CONFIG.NODE_ENV === 'development';
export const isProduction = () => ENV_CONFIG.NODE_ENV === 'production';
export const isDemoMode = () => ENV_CONFIG.FEATURES.DEMO_MODE;

export default ENV_CONFIG;
