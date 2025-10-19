import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  density: 'comfortable' | 'compact';
  notifications: Notification[];
  loading: {
    global: boolean;
    [key: string]: boolean;
  };
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const initialState: UIState = {
  sidebarOpen: true,
  theme: 'light',
  density: 'comfortable',
  notifications: [],
  loading: {
    global: false,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setDensity: (state, action: PayloadAction<'comfortable' | 'compact'>) => {
      state.density = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date(),
        read: false,
      };
      state.notifications.unshift(notification);
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      state.loading[action.payload.key] = action.payload.loading;
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  setDensity,
  addNotification,
  markNotificationRead,
  removeNotification,
  clearNotifications,
  setLoading,
  setGlobalLoading,
} = uiSlice.actions;

export default uiSlice.reducer;
