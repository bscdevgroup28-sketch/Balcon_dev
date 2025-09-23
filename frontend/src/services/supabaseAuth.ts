// Supabase Authentication Service
import { supabase, User } from './supabase'

export interface AuthUser extends User {
  email: string
  role: 'customer' | 'sales' | 'admin'
}

export class SupabaseAuthService {
  // Sign up new user
  async signUp(email: string, password: string, fullName: string, role: 'customer' | 'sales' = 'customer'): Promise<AuthUser> {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // Create user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          full_name: fullName,
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (profileError) throw profileError

      return profileData as AuthUser
    } catch (error: any) {
      console.error('Sign up error:', error)
      throw new Error(this.getAuthErrorMessage(error))
    }
  }

  // Sign in user
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Sign in failed')

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError) throw profileError

      // Update last sign in
      await supabase
        .from('users')
        .update({ 
          last_sign_in_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id)

      return profileData as AuthUser
    } catch (error: any) {
      console.error('Sign in error:', error)
      throw new Error(this.getAuthErrorMessage(error))
    }
  }

  // Sign out user
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // Reset password
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
  }

  // Update password
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
  }

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    const { data: profileData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return profileData as AuthUser
  }

  // Listen for auth changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser()
        callback(user)
      } else {
        callback(null)
      }
    })
  }

  // Update user profile
  async updateProfile(userId: string, updates: Partial<User>): Promise<AuthUser> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data as AuthUser
  }

  // Admin function to update user role
  async updateUserRole(userId: string, role: 'customer' | 'sales' | 'admin'): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error
  }

  // Check if user has permission
  hasPermission(user: AuthUser | null, permission: string): boolean {
    if (!user) return false

    const permissions = {
      admin: ['create_projects', 'manage_quotes', 'view_all_projects', 'manage_users', 'access_reports'],
      sales: ['create_projects', 'manage_quotes', 'view_all_projects', 'access_reports'],
      customer: ['create_projects']
    }

    return permissions[user.role]?.includes(permission) || false
  }

  // Error message helper
  private getAuthErrorMessage(error: any): string {
    if (error?.message) {
      switch (error.message) {
        case 'Invalid login credentials':
          return 'Invalid email or password'
        case 'Email not confirmed':
          return 'Please check your email and click the confirmation link'
        case 'User already registered':
          return 'An account with this email already exists'
        case 'Password should be at least 6 characters':
          return 'Password must be at least 6 characters long'
        default:
          return error.message
      }
    }
    return 'An unexpected error occurred'
  }
}

// Export singleton instance
export const authService = new SupabaseAuthService()
