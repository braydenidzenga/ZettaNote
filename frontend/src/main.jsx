import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeProvider.jsx';
import { AuthProvider } from './context/AuthProvider.jsx';
import { PageCacheProvider } from './context/PageCacheProvider.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <PageCacheProvider>
          <App />
        </PageCacheProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => {
        console.warn('SW registered successfully');
      })
      .catch((registrationError) => {
        console.error('SW registration failed: ', registrationError);
      });
  });
}
