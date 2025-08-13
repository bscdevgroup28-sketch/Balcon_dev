// Enhanced AuthContext with Supabase Integration
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authService, AuthUser } from '../services/supabaseAuth';
import { supabase } from '../services/supabase';

// Auth State Interface
interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: {
    canCreateProjects: boolean;
    canManageQuotes: boolean;
    canViewAllProjects: boolean;
    canManageUsers: boolean;
    canAccessReports: boolean;
  };
}

// Auth Actions
type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; payload: AuthUser }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Initial State
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  permissions: {
    canCreateProjects: false,
    canManageQuotes: false,
    canViewAllProjects: false,
    canManageUsers: false,
    canAccessReports: false,
  },
};

// Auth Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        permissions: getPermissions(action.payload.role),
      };

    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        user: null,
        isAuthenticated: false,
        permissions: getPermissions(null),
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Permission Helper
function getPermissions(role: string | null) {
  switch (role) {
    case 'admin':
      return {
        canCreateProjects: true,
        canManageQuotes: true,
        canViewAllProjects: true,
        canManageUsers: true,
        canAccessReports: true,
      };
    case 'sales':
      return {
        canCreateProjects: true,
        canManageQuotes: true,
        canViewAllProjects: true,
        canManageUsers: false,
        canAccessReports: true,
      };
    case 'customer':
      return {
        canCreateProjects: true,
        canManageQuotes: false,
        canViewAllProjects: false,
        canManageUsers: false,
        canAccessReports: false,
      };
    default:
      return {
        canCreateProjects: false,
        canManageQuotes: false,
        canViewAllProjects: false,
        canManageUsers: false,
        canAccessReports: false,
      };
  }
}

// Auth Context
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role?: 'customer' | 'sales') => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  hasPermission: (permission: keyof AuthState['permissions']) => boolean;
  hasRole: (role: string | string[]) => boolean;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (mounted) {
          if (user) {
            dispatch({ type: 'AUTH_SUCCESS', payload: user });
          } else {
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        }
      } catch (error) {
        if (mounted) {
          dispatch({ type: 'AUTH_ERROR', payload: 'Failed to initialize authentication' });
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      if (mounted) {
        if (user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
        } else {
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Auth Methods
  const login = async (email: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_LOADING' });
      const user = await authService.signIn(email, password);
      // State will be updated through the auth listener
    } catch (error: any) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message });
      throw error;
    }
  };

  const register = async (
    email: string, 
    password: string, 
    fullName: string, 
    role: 'customer' | 'sales' = 'customer'
  ): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_LOADING' });
      const user = await authService.signUp(email, password, fullName, role);
      // State will be updated through the auth listener
    } catch (error: any) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.signOut();
      // State will be updated through the auth listener
    } catch (error: any) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message });
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      await authService.resetPassword(email);
    } catch (error: any) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message });
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>): Promise<void> => {
    if (!state.user) {
      throw new Error('No user logged in');
    }

    try {
      const updatedUser = await authService.updateProfile(state.user.id, updates);
      dispatch({ type: 'AUTH_SUCCESS', payload: updatedUser });
    } catch (error: any) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message });
      throw error;
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const hasPermission = (permission: keyof AuthState['permissions']): boolean => {
    return state.permissions[permission];
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!state.user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(state.user.role);
    }
    
    return state.user.role === role;
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    resetPassword,
    clearError,
    hasPermission,
    hasRole,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom Hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission?: keyof AuthState['permissions']
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, hasPermission, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      window.location.href = '/login';
      return null;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

export default AuthContext;
