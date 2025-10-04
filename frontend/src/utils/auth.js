import { useState, useEffect } from 'react';
import { API_URL } from '../config';

// Custom hook to check authentication status
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(API_URL + '/api/auth/getuser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok && data.user) {
          setIsAuthenticated(true);
          setUser(data.user);
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('token');
        }
      } catch (error) {
        setIsAuthenticated(false);
        localStorage.removeItem('token');
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  return { isAuthenticated, isLoading, user };
};

// Utility function to check if user is authenticated
export const isUserAuthenticated = () => {
  return !!localStorage.getItem('token');
};
