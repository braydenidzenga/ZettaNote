import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

// Custom hook to check authentication status
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
  );

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // Use cookies for authentication - no need to send token
        const res = await axios.get(`${API_URL}/api/auth/getuser`, {
          withCredentials: true
        });

        if (res.status === 200 && res.data.user) {
          setIsAuthenticated(true);
          setUser(res.data.user);
          // Update user data in localStorage if it changed
          localStorage.setItem('user', JSON.stringify(res.data.user));
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
        setIsAuthenticated(false);
        localStorage.removeItem('user');
        setUser(null);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [user]);

  return { isAuthenticated, isLoading, user };
};

// Utility function to check if user is authenticated
export const isUserAuthenticated = () => {
  return !!localStorage.getItem('user');
};

// Utility function to get current user from localStorage
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Utility function to logout user
export const logoutUser = async () => {
  try {
    // Call logout endpoint to clear the cookie
    await axios.get(API_URL + '/api/auth/logout', {
      withCredentials: true
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear localStorage regardless of API call success
    localStorage.removeItem('user');
  }
};
