// Consolidated Authentication Configuration
// This file centralizes all auth-related configuration
// Using Supabase as the primary authentication system

export const AUTH_CONFIG = {
  provider: 'supabase',
  supabase: {
    url: process.env.REACT_APP_SUPABASE_URL || 'https://yxlvanmnjpvpliqcxzwk.supabase.co',
    anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bHZhbm1uanB2cGxpcWN4endrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTIyNDYsImV4cCI6MjA3MDU4ODI0Nn0.Dgj528T9nTVt5MVaRm8yrgIm-GTpqDBiuj0p6yOY-4o'
  },
  demo: {
    enabled: true,
    accounts: [
      { role: 'customer', email: 'customer@demo.com', password: 'demo123' },
      { role: 'admin', email: 'admin@demo.com', password: 'demo123' },
      { role: 'owner', email: 'owner@demo.com', password: 'demo123' },
      { role: 'office_manager', email: 'office@demo.com', password: 'demo123' },
      { role: 'shop_manager', email: 'shop@demo.com', password: 'demo123' },
      { role: 'project_manager', email: 'pm@demo.com', password: 'demo123' },
      { role: 'team_leader', email: 'team@demo.com', password: 'demo123' },
      { role: 'technician', email: 'tech@demo.com', password: 'demo123' }
    ]
  }
};

export default AUTH_CONFIG;
