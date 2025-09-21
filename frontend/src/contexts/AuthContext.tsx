import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import integratedAPI from '../services/integratedAPI';
import webSocketService from '../services/websocketService';

// User interface matching backend user model
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'salesperson' | 'customer' | 'foreman' | 'worker';
  company?: string;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth state interface
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

// Initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('authToken'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

// Auth context interface
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    company?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  clearError: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  refreshToken: () => Promise<boolean>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Auto-login on app start if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
          const response = await integratedAPI.getCurrentUser();
          if (response.success && response.data) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: { user: response.data, token },
            });

            // Connect to WebSocket after successful auto-login
            try {
              await webSocketService.connect(token);
              console.log('🔌 WebSocket connected after auto-login');
            } catch (error) {
              console.error('Failed to connect to WebSocket on auto-login:', error);
            }
          } else {
            localStorage.removeItem('authToken');
            dispatch({ type: 'LOGOUT' });
          }
        } catch (error) {
          localStorage.removeItem('authToken');
          dispatch({ type: 'LOGOUT' });
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await integratedAPI.login(email, password);
      
      if (response.success && response.data) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.data.user,
            token: response.data.token,
          },
        });

        // Connect to WebSocket after successful login
        try {
          await webSocketService.connect(response.data.token);
          console.log('🔌 WebSocket connected after login');
        } catch (error) {
          console.error('Failed to connect to WebSocket:', error);
          // Don't fail login if WebSocket fails, just log the error
        }

        return true;
      } else {
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: response.error || 'Login failed',
        });
        return false;
      }
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: 'Network error occurred',
      });
      return false;
    }
  };

  // Register function
  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    company?: string;
  }): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await integratedAPI.register(userData);
      
      if (response.success && response.data) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.data.user,
            token: response.data.token,
          },
        });
        return true;
      } else {
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: response.error || 'Registration failed',
        });
        return false;
      }
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: 'Network error occurred',
      });
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await integratedAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Disconnect WebSocket before clearing auth state
      webSocketService.disconnect();
      console.log('🔌 WebSocket disconnected on logout');

      localStorage.removeItem('authToken');
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Update profile function
  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      const response = await integratedAPI.updateUserProfile(userData);
      
      if (response.success && response.data) {
        dispatch({
          type: 'UPDATE_USER',
          payload: response.data,
        });
        return true;
      } else {
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: response.error || 'Profile update failed',
        });
        return false;
      }
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: 'Network error occurred',
      });
      return false;
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await integratedAPI.refreshToken();
      
      if (response.success && response.data) {
        // Token is automatically updated in the API service
        return true;
      } else {
        await logout();
        return false;
      }
    } catch (error) {
      await logout();
      return false;
    }
  };

  // Role-based access control
  const hasRole = (role: string): boolean => {
    return state.user?.role === role;
  };

  // Permission-based access control
  const hasPermission = (permission: string): boolean => {
    if (!state.user) return false;

    const rolePermissions: Record<string, string[]> = {
      admin: [
        'manage_users',
        'manage_projects',
        'manage_quotes',
        'view_analytics',
        'manage_settings',
        'manage_files',
        'view_all_data',
      ],
      manager: [
        'manage_projects',
        'manage_quotes',
        'view_analytics',
        'manage_files',
        'view_team_data',
      ],
      salesperson: [
        'manage_quotes',
        'view_projects',
        'manage_files',
        'view_sales_data',
      ],
      customer: [
        'view_own_projects',
        'view_own_quotes',
        'upload_files',
        'view_own_data',
      ],
      foreman: [
        'manage_projects',
        'view_projects',
        'manage_files',
        'view_project_data',
      ],
      worker: [
        'view_assigned_projects',
        'upload_files',
        'view_project_data',
      ],
    };

    const userPermissions = rolePermissions[state.user.role] || [];
    return userPermissions.includes(permission);
  };

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    hasRole,
    hasPermission,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallback = <div>Access denied</div>,
}) => {
  const { isAuthenticated, hasRole, hasPermission, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in to access this page</div>;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default AuthContext;
