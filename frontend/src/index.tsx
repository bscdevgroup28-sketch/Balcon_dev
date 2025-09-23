import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import App from './App';
import AppErrorBoundary from './components/common/AppErrorBoundary';
import { store } from './store/store';
import { theme } from './theme/theme';
import './index.css';

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration);
      })
      .catch((error) => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {/* Skip link for keyboard users */}
          <a href="#main-content" style={{ position: 'absolute', left: -1000, top: 0 }} onFocus={(e) => { e.currentTarget.style.left = '8px'; e.currentTarget.style.background = '#1976d2'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.padding = '8px 12px'; e.currentTarget.style.zIndex = '1300'; }} onBlur={(e) => { e.currentTarget.style.left = '-1000px'; }}>Skip to main content</a>
          <AppErrorBoundary>
            <App />
          </AppErrorBoundary>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
