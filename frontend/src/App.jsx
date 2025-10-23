import { useContext } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Navigate, Routes, useLocation } from 'react-router-dom';
import { Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import PublicShare from './pages/PublicShare';
import authContext from './context/AuthProvider';

// =============================================================================
// DEVELOPER NOTES
// =============================================================================
// Main application component handling routing and global layout.
// Key considerations:
// - OAuth callback handling for social logins
// - Conditional rendering based on authentication state
// - Toast notifications configuration
// - Route protection logic

// =============================================================================
// TODO
// =============================================================================
// - [ ] Add loading states for route transitions
// - [ ] Implement route-based code splitting for better performance
// - [ ] Add error boundaries for better error handling
// - [ ] Consider implementing PWA features (service worker, offline support)
// - [ ] Add analytics tracking for user behavior

const App = () => {
  const location = useLocation();
  const { user } = useContext(authContext);

  // Check if this is an OAuth callback
  const isOAuthCallback =
    location.pathname === '/dashboard' &&
    new URLSearchParams(location.search).get('oauth') === 'success';

  return (
    <div className="">
      {location.pathname !== '/login' &&
        location.pathname !== '/signup' &&
        !location.pathname.startsWith('/public/') && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/dashboard" />} />
        <Route
          path="/dashboard"
          element={user || isOAuthCallback ? <Dashboard /> : <Navigate to="/" />}
        />
        <Route path="/dashboard/:pageId" element={user ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/public/:shareId" element={<PublicShare />} />
      </Routes>
      {location.pathname !== '/login' &&
        location.pathname !== '/signup' &&
        location.pathname !== '/dashboard' &&
        !location.pathname.startsWith('/public/') && <Footer />}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            borderRadius: '0.75rem',
            background: 'var(--color-base-100)',
            color: 'var(--color-base-content)',
            border: '1px solid var(--color-base-300)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)',
            fontSize: '0.9rem',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-success)',
              secondary: 'var(--color-success-content)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-error)',
              secondary: 'var(--color-error-content)',
            },
          },
        }}
      />
    </div>
  );
};

export default App;
