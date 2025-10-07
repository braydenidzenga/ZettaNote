import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { UIProvider } from './components/ui/provider';
import axios from 'axios';
import NProgress from 'nprogress';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

import Login from './pages/login';
import Signup from './pages/signup';
import Landingpage from './pages/landingpage';
import Home from './pages/home';
import PublicShare from './pages/publicShare';
import { ProtectedRoute, AuthRoute } from './components/ProtectedRoute';

function AxiosProgressBinder() {
  useEffect(() => {
    NProgress.configure({ showSpinner: false });
    const reqInterceptor = axios.interceptors.request.use((config) => {
      NProgress.start();
      return config;
    }, (error) => {
      NProgress.done();
      return Promise.reject(error);
    });

    const resInterceptor = axios.interceptors.response.use((response) => {
      NProgress.done();
      return response;
    }, (error) => {
      NProgress.done();
      return Promise.reject(error);
    });

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  return null;
}

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
      <AxiosProgressBinder />
      <UIProvider>
        <RouterProvider router={router}></RouterProvider>
        <Toaster />
      </UIProvider>
    </div>
  );
}

export default App;
