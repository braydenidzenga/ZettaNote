import { API_URL } from '../config';

export const adminAuth = {
  // Check if admin is logged in
  isAuthenticated: () => {
    const token = localStorage.getItem('adminToken');
    return !!token;
  },

  // Get admin user data
  getAdminUser: () => {
    const userData = localStorage.getItem('adminUser');
    return userData ? JSON.parse(userData) : null;
  },

  // Get admin token
  getToken: () => {
    return localStorage.getItem('adminToken');
  },

  // Login admin
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Check if password change is required
        if (data.requirePasswordChange) {
          return {
            success: true,
            requirePasswordChange: true,
            tempToken: data.tempToken,
            admin: data.admin,
          };
        }

        // Normal login
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.admin));
        return { success: true, admin: data.admin };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },

  // Change first login password
  changeFirstPassword: async (tempToken, newPassword, confirmPassword) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/change-first-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tempToken, newPassword, confirmPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return { success: true, message: data.message };
      } else {
        return {
          success: false,
          message: data.message || 'Password change failed',
          errors: data.errors,
        };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },

  // Logout admin
  logout: async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (token) {
        await fetch(`${API_URL}/api/admin/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    }
  },

  // Check if admin has specific permission
  hasPermission: (permission) => {
    const admin = adminAuth.getAdminUser();
    if (!admin) return false;
    if (admin.role === 'super_admin') return true;
    return admin.permissions && admin.permissions.includes(permission);
  },

  // Make authenticated API request
  apiRequest: async (endpoint, options = {}) => {
    const token = adminAuth.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {}),
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);
      const data = await response.json();

      // Handle token expiration
      if (response.status === 401) {
        adminAuth.logout();
        window.location.href = '/login';
        return null;
      }

      return { response, data };
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  },
};
