import React, { ReactElement, PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import authReducer, { setUser } from '../store/slices/authSlice';

// Create a store factory so tests can override preloaded state per test
export function createTestStore(preloadedState?: any) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState,
  });
}

interface RenderOptions {
  route?: string;
  store?: ReturnType<typeof createTestStore>;
  preloadedState?: any;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', store = createTestStore(), preloadedState }: RenderOptions = {}
) {
  window.history.pushState({}, 'Test page', route);
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </Provider>
    ),
  };
}

// Helper to seed a demo user quickly
export function seedDemoUser(store: ReturnType<typeof createTestStore>, role: string = 'user') {
  store.dispatch(
    setUser({
      id: 1,
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      role: role as any,
      permissions: ['read'],
      isDemo: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );
}
