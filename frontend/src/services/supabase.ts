// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js'

// Supabase configuration with your actual credentials
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://yxlvanmnjpvpliqcxzwk.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bHZhbm1uanB2cGxpcWN4endrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTIyNDYsImV4cCI6MjA3MDU4ODI0Nn0.Dgj528T9nTVt5MVaRm8yrgIm-GTpqDBiuj0p6yOY-4o'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Database Tables
export interface User {
  id: string
  email: string
  full_name: string
  role: 'customer' | 'sales' | 'admin'
  created_at: string
  updated_at: string
  last_sign_in_at?: string
  avatar_url?: string
  phone?: string
}

export interface Project {
  id: string
  title: string
  description: string
  status: 'inquiry' | 'quoted' | 'approved' | 'in_progress' | 'completed'
  user_id: string
  assigned_to?: string
  created_at: string
  updated_at: string
  due_date?: string
  budget_range?: string
  location?: string
  project_type: 'residential' | 'commercial' | 'renovation' | 'new_construction'
}

export interface Quote {
  id: string
  project_id: string
  user_id: string
  amount: number
  description: string
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'
  created_at: string
  updated_at: string
  valid_until: string
  terms?: string
  line_items?: QuoteLineItem[]
}

export interface QuoteLineItem {
  id: string
  quote_id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface ProjectFile {
  id: string
  project_id: string
  filename: string
  file_path: string
  file_size: number
  mime_type: string
  uploaded_by: string
  created_at: string
}

// Helper functions for common operations
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Export default client
export default supabase
