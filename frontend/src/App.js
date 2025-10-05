import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { UIProvider } from './components/ui/provider';
import { Toaster } from 'react-hot-toast';

import Login from './pages/login';
import Signup from './pages/signup';
import Landingpage from './pages/landingpage';
import Home from './pages/home';
import PublicShare from './pages/publicShare';
import { ProtectedRoute, AuthRoute } from './components/ProtectedRoute';

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Landingpage />,
    },
    {
      path: '/login',
      element: (
        <AuthRoute>
          <Login />
        </AuthRoute>
      ),
    },
    {
      path: '/signup',
      element: (
        <AuthRoute>
          <Signup />
        </AuthRoute>
      ),
    },
    {
      path: '/home',
      element: (
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      ),
    },
    {
      path: '/share/:shareId',
      element: <PublicShare />,
    },
  ]);

  return (
    <div>
      <UIProvider>
        <RouterProvider router={router}></RouterProvider>
        <Toaster />
      </UIProvider>
    </div>
  );
}

export default App;
