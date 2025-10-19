import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import projectsReducer from './slices/projectsSlice';
import quotesReducer from './slices/quotesSlice';
import ordersReducer from './slices/ordersSlice';
import uiReducer from './slices/uiSlice';
import analyticsReducer from './slices/analyticsSlice';
import usersReducer from './slices/usersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    quotes: quotesReducer,
    orders: ordersReducer,
    ui: uiReducer,
    analytics: analyticsReducer,
    users: usersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
