import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

// Custom hook to check authentication status with cookies
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Always check with the server - cookies are sent automatically
        const res = await axios.get(`${API_URL}/api/auth/getuser`, {
          withCredentials: true,
        });

        if (res.status === 200 && res.data.user) {
          setIsAuthenticated(true);
          setUser(res.data.user);
          // Store user data in localStorage for quick access (optional)
          localStorage.setItem('user', JSON.stringify(res.data.user));
        } else {
          setIsAuthenticated(false);
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch (error) {
        // If server returns error (401, 403, etc.), user is not authenticated
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('user');
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []); // Empty dependency array - only run once on mount

  return { isAuthenticated, isLoading, user };
};

// Utility function to check if user is authenticated
// Note: This only checks localStorage - for accurate check, use useAuth hook or verify with server
export const isUserAuthenticated = () => {
  return !!localStorage.getItem('user');
};

// Utility function to get current user from localStorage
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Utility function to verify authentication with server
export const verifyAuth = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/auth/getuser`, {
      withCredentials: true,
    });

    if (res.status === 200 && res.data.user) {
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return { authenticated: true, user: res.data.user };
    }

    localStorage.removeItem('user');
    return { authenticated: false, user: null };
  } catch (error) {
    localStorage.removeItem('user');
    return { authenticated: false, user: null };
  }
};

// Utility function to logout user
export const logoutUser = async () => {
  try {
    // Call logout endpoint to clear the cookie
    await axios.post(
      `${API_URL}/api/auth/logout`,
      {},
      {
        withCredentials: true,
      }
    );
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear localStorage regardless of API call success
    localStorage.removeItem('user');
  }
};
