import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import integratedAPI from '../services/integratedAPI';
import { useAuth } from './AuthContext';

// Interfaces for data entities
interface Project {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  budget: number;
  spent: number;
  startDate: string;
  endDate?: string;
  clientId: string;
  managerId: string;
  teamMembers: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Quote {
  id: string;
  projectTitle: string;
  clientId: string;
  salespersonId: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  totalAmount: number;
  validUntil: string;
  items: QuoteItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Notification {
  id: string;
  userId: string;
  type: 'project_update' | 'quote_status' | 'system_alert' | 'deadline' | 'mention';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

interface AnalyticsData {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    growth: number;
  };
  customers: {
    total: number;
    new: number;
    growth: number;
  };
  quotes: {
    total: number;
    pending: number;
    approved: number;
    conversionRate: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    user: string;
  }>;
}

// Application state interface
interface AppState {
  projects: {
    items: Project[];
    total: number;
    loading: boolean;
    error: string | null;
  };
  quotes: {
    items: Quote[];
    total: number;
    loading: boolean;
    error: string | null;
  };
  notifications: {
    items: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
  };
  analytics: {
    data: AnalyticsData | null;
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
  };
  files: {
    items: any[];
    loading: boolean;
    error: string | null;
  };
}

// Action types
type AppAction =
  // Projects
  | { type: 'PROJECTS_LOADING' }
  | { type: 'PROJECTS_SUCCESS'; payload: { items: Project[]; total: number } }
  | { type: 'PROJECTS_ERROR'; payload: string }
  | { type: 'PROJECT_ADD'; payload: Project }
  | { type: 'PROJECT_UPDATE'; payload: Project }
  | { type: 'PROJECT_DELETE'; payload: string }
  // Quotes
  | { type: 'QUOTES_LOADING' }
  | { type: 'QUOTES_SUCCESS'; payload: { items: Quote[]; total: number } }
  | { type: 'QUOTES_ERROR'; payload: string }
  | { type: 'QUOTE_ADD'; payload: Quote }
  | { type: 'QUOTE_UPDATE'; payload: Quote }
  | { type: 'QUOTE_DELETE'; payload: string }
  // Notifications
  | { type: 'NOTIFICATIONS_LOADING' }
  | { type: 'NOTIFICATIONS_SUCCESS'; payload: { items: Notification[]; total: number } }
  | { type: 'NOTIFICATIONS_ERROR'; payload: string }
  | { type: 'NOTIFICATION_ADD'; payload: Notification }
  | { type: 'NOTIFICATION_READ'; payload: string }
  | { type: 'NOTIFICATIONS_MARK_ALL_READ' }
  // Analytics
  | { type: 'ANALYTICS_LOADING' }
  | { type: 'ANALYTICS_SUCCESS'; payload: AnalyticsData }
  | { type: 'ANALYTICS_ERROR'; payload: string }
  // Files
  | { type: 'FILES_LOADING' }
  | { type: 'FILES_SUCCESS'; payload: any[] }
  | { type: 'FILES_ERROR'; payload: string }
  | { type: 'FILE_ADD'; payload: any }
  | { type: 'FILE_DELETE'; payload: string };

// Initial state
const initialState: AppState = {
  projects: {
    items: [],
    total: 0,
    loading: false,
    error: null,
  },
  quotes: {
    items: [],
    total: 0,
    loading: false,
    error: null,
  },
  notifications: {
    items: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  analytics: {
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  },
  files: {
    items: [],
    loading: false,
    error: null,
  },
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    // Projects
    case 'PROJECTS_LOADING':
      return {
        ...state,
        projects: { ...state.projects, loading: true, error: null },
      };
    case 'PROJECTS_SUCCESS':
      return {
        ...state,
        projects: {
          ...state.projects,
          items: action.payload.items,
          total: action.payload.total,
          loading: false,
          error: null,
        },
      };
    case 'PROJECTS_ERROR':
      return {
        ...state,
        projects: { ...state.projects, loading: false, error: action.payload },
      };
    case 'PROJECT_ADD':
      return {
        ...state,
        projects: {
          ...state.projects,
          items: [action.payload, ...state.projects.items],
          total: state.projects.total + 1,
        },
      };
    case 'PROJECT_UPDATE':
      return {
        ...state,
        projects: {
          ...state.projects,
          items: state.projects.items.map(item =>
            item.id === action.payload.id ? action.payload : item
          ),
        },
      };
    case 'PROJECT_DELETE':
      return {
        ...state,
        projects: {
          ...state.projects,
          items: state.projects.items.filter(item => item.id !== action.payload),
          total: state.projects.total - 1,
        },
      };

    // Quotes
    case 'QUOTES_LOADING':
      return {
        ...state,
        quotes: { ...state.quotes, loading: true, error: null },
      };
    case 'QUOTES_SUCCESS':
      return {
        ...state,
        quotes: {
          ...state.quotes,
          items: action.payload.items,
          total: action.payload.total,
          loading: false,
          error: null,
        },
      };
    case 'QUOTES_ERROR':
      return {
        ...state,
        quotes: { ...state.quotes, loading: false, error: action.payload },
      };
    case 'QUOTE_ADD':
      return {
        ...state,
        quotes: {
          ...state.quotes,
          items: [action.payload, ...state.quotes.items],
          total: state.quotes.total + 1,
        },
      };
    case 'QUOTE_UPDATE':
      return {
        ...state,
        quotes: {
          ...state.quotes,
          items: state.quotes.items.map(item =>
            item.id === action.payload.id ? action.payload : item
          ),
        },
      };

    // Notifications
    case 'NOTIFICATIONS_LOADING':
      return {
        ...state,
        notifications: { ...state.notifications, loading: true, error: null },
      };
    case 'NOTIFICATIONS_SUCCESS':
      const unreadCount = action.payload.items.filter(n => !n.isRead).length;
      return {
        ...state,
        notifications: {
          ...state.notifications,
          items: action.payload.items,
          unreadCount,
          loading: false,
          error: null,
        },
      };
    case 'NOTIFICATIONS_ERROR':
      return {
        ...state,
        notifications: { ...state.notifications, loading: false, error: action.payload },
      };
    case 'NOTIFICATION_ADD':
      return {
        ...state,
        notifications: {
          ...state.notifications,
          items: [action.payload, ...state.notifications.items],
          unreadCount: action.payload.isRead ? state.notifications.unreadCount : state.notifications.unreadCount + 1,
        },
      };
    case 'NOTIFICATION_READ':
      return {
        ...state,
        notifications: {
          ...state.notifications,
          items: state.notifications.items.map(item =>
            item.id === action.payload ? { ...item, isRead: true } : item
          ),
          unreadCount: Math.max(0, state.notifications.unreadCount - 1),
        },
      };
    case 'NOTIFICATIONS_MARK_ALL_READ':
      return {
        ...state,
        notifications: {
          ...state.notifications,
          items: state.notifications.items.map(item => ({ ...item, isRead: true })),
          unreadCount: 0,
        },
      };

    // Analytics
    case 'ANALYTICS_LOADING':
      return {
        ...state,
        analytics: { ...state.analytics, loading: true, error: null },
      };
    case 'ANALYTICS_SUCCESS':
      return {
        ...state,
        analytics: {
          ...state.analytics,
          data: action.payload,
          loading: false,
          error: null,
          lastUpdated: new Date().toISOString(),
        },
      };
    case 'ANALYTICS_ERROR':
      return {
        ...state,
        analytics: { ...state.analytics, loading: false, error: action.payload },
      };

    // Files
    case 'FILES_LOADING':
      return {
        ...state,
        files: { ...state.files, loading: true, error: null },
      };
    case 'FILES_SUCCESS':
      return {
        ...state,
        files: {
          ...state.files,
          items: action.payload,
          loading: false,
          error: null,
        },
      };
    case 'FILES_ERROR':
      return {
        ...state,
        files: { ...state.files, loading: false, error: action.payload },
      };
    case 'FILE_ADD':
      return {
        ...state,
        files: {
          ...state.files,
          items: [action.payload, ...state.files.items],
        },
      };
    case 'FILE_DELETE':
      return {
        ...state,
        files: {
          ...state.files,
          items: state.files.items.filter(item => item.id !== action.payload),
        },
      };

    default:
      return state;
  }
};

// Context interface
interface AppContextType extends AppState {
  // Projects
  loadProjects: (params?: any) => Promise<void>;
  createProject: (projectData: any) => Promise<boolean>;
  updateProject: (id: string, projectData: any) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  
  // Quotes
  loadQuotes: (params?: any) => Promise<void>;
  createQuote: (quoteData: any) => Promise<boolean>;
  updateQuote: (id: string, quoteData: any) => Promise<boolean>;
  
  // Notifications
  loadNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  
  // Analytics
  loadAnalytics: (timeRange?: string) => Promise<void>;
  
  // Files
  loadFiles: (projectId?: string) => Promise<void>;
  uploadFile: (file: File, path?: string) => Promise<boolean>;
  deleteFile: (fileId: string) => Promise<boolean>;
  
  // Real-time subscriptions
  subscribeToRealTimeUpdates: () => void;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// App provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Initialize real-time subscriptions when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      subscribeToRealTimeUpdates();
      loadInitialData();
    }
  }, [isAuthenticated]);

  // Load initial data
  const loadInitialData = async () => {
    await Promise.all([
      loadProjects(),
      loadQuotes(),
      loadNotifications(),
      loadAnalytics(),
    ]);
  };

  // Projects management
  const loadProjects = async (params?: any) => {
    dispatch({ type: 'PROJECTS_LOADING' });
    try {
      const response = await integratedAPI.getProjects(params);
      if (response.success && response.data) {
        dispatch({
          type: 'PROJECTS_SUCCESS',
          payload: {
            items: response.data.projects,
            total: response.data.total,
          },
        });
      } else {
        dispatch({ type: 'PROJECTS_ERROR', payload: response.error || 'Failed to load projects' });
      }
    } catch (error) {
      dispatch({ type: 'PROJECTS_ERROR', payload: 'Network error occurred' });
    }
  };

  const createProject = async (projectData: any): Promise<boolean> => {
    try {
      const response = await integratedAPI.createProject(projectData);
      if (response.success && response.data) {
        dispatch({ type: 'PROJECT_ADD', payload: response.data });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const updateProject = async (id: string, projectData: any): Promise<boolean> => {
    try {
      const response = await integratedAPI.updateProject(id, projectData);
      if (response.success && response.data) {
        dispatch({ type: 'PROJECT_UPDATE', payload: response.data });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      const response = await integratedAPI.deleteProject(id);
      if (response.success) {
        dispatch({ type: 'PROJECT_DELETE', payload: id });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Quotes management
  const loadQuotes = async (params?: any) => {
    dispatch({ type: 'QUOTES_LOADING' });
    try {
      const response = await integratedAPI.getQuotes(params);
      if (response.success && response.data) {
        dispatch({
          type: 'QUOTES_SUCCESS',
          payload: {
            items: response.data.quotes,
            total: response.data.total,
          },
        });
      } else {
        dispatch({ type: 'QUOTES_ERROR', payload: response.error || 'Failed to load quotes' });
      }
    } catch (error) {
      dispatch({ type: 'QUOTES_ERROR', payload: 'Network error occurred' });
    }
  };

  const createQuote = async (quoteData: any): Promise<boolean> => {
    try {
      const response = await integratedAPI.createQuote(quoteData);
      if (response.success && response.data) {
        dispatch({ type: 'QUOTE_ADD', payload: response.data });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const updateQuote = async (id: string, quoteData: any): Promise<boolean> => {
    try {
      const response = await integratedAPI.updateQuote(id, quoteData);
      if (response.success && response.data) {
        dispatch({ type: 'QUOTE_UPDATE', payload: response.data });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Notifications management
  const loadNotifications = async () => {
    dispatch({ type: 'NOTIFICATIONS_LOADING' });
    try {
      const response = await integratedAPI.getNotifications();
      if (response.success && response.data) {
        dispatch({
          type: 'NOTIFICATIONS_SUCCESS',
          payload: {
            items: response.data.notifications,
            total: response.data.total,
          },
        });
      } else {
        dispatch({ type: 'NOTIFICATIONS_ERROR', payload: response.error || 'Failed to load notifications' });
      }
    } catch (error) {
      dispatch({ type: 'NOTIFICATIONS_ERROR', payload: 'Network error occurred' });
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      const response = await integratedAPI.markNotificationAsRead(id);
      if (response.success) {
        dispatch({ type: 'NOTIFICATION_READ', payload: id });
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const response = await integratedAPI.markAllNotificationsAsRead();
      if (response.success) {
        dispatch({ type: 'NOTIFICATIONS_MARK_ALL_READ' });
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Analytics management
  const loadAnalytics = async (timeRange?: string) => {
    dispatch({ type: 'ANALYTICS_LOADING' });
    try {
      const response = await integratedAPI.getAnalytics(timeRange);
      if (response.success && response.data) {
        dispatch({ type: 'ANALYTICS_SUCCESS', payload: response.data });
      } else {
        dispatch({ type: 'ANALYTICS_ERROR', payload: response.error || 'Failed to load analytics' });
      }
    } catch (error) {
      dispatch({ type: 'ANALYTICS_ERROR', payload: 'Network error occurred' });
    }
  };

  // Files management
  const loadFiles = async (projectId?: string) => {
    dispatch({ type: 'FILES_LOADING' });
    try {
      const response = await integratedAPI.getFiles(projectId);
      if (response.success && response.data) {
        dispatch({ type: 'FILES_SUCCESS', payload: response.data });
      } else {
        dispatch({ type: 'FILES_ERROR', payload: response.error || 'Failed to load files' });
      }
    } catch (error) {
      dispatch({ type: 'FILES_ERROR', payload: 'Network error occurred' });
    }
  };

  const uploadFile = async (file: File, path?: string): Promise<boolean> => {
    try {
      const response = await integratedAPI.uploadFile(file, path);
      if (response.success && response.data) {
        dispatch({ type: 'FILE_ADD', payload: response.data });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const deleteFile = async (fileId: string): Promise<boolean> => {
    try {
      const response = await integratedAPI.deleteFile(fileId);
      if (response.success) {
        dispatch({ type: 'FILE_DELETE', payload: fileId });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Real-time subscriptions
  const subscribeToRealTimeUpdates = () => {
    // Subscribe to project updates
    integratedAPI.subscribeToProjectUpdates('*', (data) => {
      if (data.type === 'created') {
        dispatch({ type: 'PROJECT_ADD', payload: data.project });
      } else if (data.type === 'updated') {
        dispatch({ type: 'PROJECT_UPDATE', payload: data.project });
      } else if (data.type === 'deleted') {
        dispatch({ type: 'PROJECT_DELETE', payload: data.projectId });
      }
    });

    // Subscribe to notifications
    integratedAPI.subscribeToNotifications((notification) => {
      dispatch({ type: 'NOTIFICATION_ADD', payload: notification });
    });

    // Subscribe to analytics updates
    integratedAPI.subscribeToAnalytics((data) => {
      dispatch({ type: 'ANALYTICS_SUCCESS', payload: data });
    });
  };

  // Context value
  const contextValue: AppContextType = {
    ...state,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    loadQuotes,
    createQuote,
    updateQuote,
    loadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    loadAnalytics,
    loadFiles,
    uploadFile,
    deleteFile,
    subscribeToRealTimeUpdates,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use app context
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
