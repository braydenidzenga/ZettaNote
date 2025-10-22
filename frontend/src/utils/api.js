// Centralized API module for all HTTP operations
import axios from 'axios';
import { VITE_API_URL } from '../env';

// =============================================================================
// DEVELOPER NOTES
// =============================================================================
// This file contains all API endpoints and configurations.
// When adding new API endpoints, follow these guidelines:
// - Add to the appropriate API object (authAPI, pagesAPI, tasksAPI, etc.)
// - Include proper error handling with apiUtils.handleUnauthorized()
// - Document the endpoint purpose and parameters
// - Test both success and error scenarios

// =============================================================================
// TODO
// =============================================================================
// - [ ] Add request/response interceptors for global loading states
// - [ ] Implement API versioning strategy
// - [ ] Add retry logic for failed requests
// - [ ] Consider implementing GraphQL for complex queries

// Create axios instance with default config

// Create axios instance with default config
const api = axios.create({
  baseURL: VITE_API_URL,
  withCredentials: true,
  timeout: 10000,
});

// Request interceptor for adding auth headers if needed
api.interceptors.request.use(
  (config) => {
    // Add any request preprocessing here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors here
    if (error.response?.status === 401) {
      // Handle unauthorized - could emit event or call callback
      console.warn('Unauthorized request');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  getUser: () => api.get('/api/auth/getuser'),

  getUserById: (userId) => api.post('/api/auth/getuserbyid', { userId }),

  login: (credentials) => api.post('/api/auth/login', credentials),

  register: (userData) => api.post('/api/auth/register', userData),

  logout: () => api.post('/api/auth/logout'),

  googleAuth: () => api.get('/api/auth/google'),

  githubAuth: () => api.get('/api/auth/github'),
};

// Pages API
export const pagesAPI = {
  getPage: (pageId) => api.post('/api/pages/getpage', { pageId }),

  savePage: (pageId, content) => api.post('/api/pages/savepage', { pageId, newPageData: content }),

  createPage: (pageData) => api.post('/api/pages/createpage', pageData),

  deletePage: (pageId) => api.delete('/api/pages/deletepage', { data: { pageId } }),

  renamePage: (pageId, newName) =>
    api.post('/api/pages/renamepage', { pageId, newPageName: newName }),

  getAllPages: () => api.get('/api/pages/getallpages'),

  // Sharing APIs
  publicShare: (data) => api.post('/api/pages/publicshare', data),

  sharePage: (pageId, email) => api.post('/api/pages/sharepage', { pageId, email }),

  removeSharedUser: (email, pageId) =>
    api.post('/api/pages/sharepage/remove-user', { gmail: email, id: pageId }),

  getPublicPage: (publicShareId) => api.get(`/api/pages/public/${publicShareId}`),
};

// Tasks API
export const tasksAPI = {
  getTasks: (pageId) => api.post('/api/task/gettasks', { pageId }),

  getAllTasks: () => api.get('/api/task/getAllTasks'),

  createTask: (taskData) => api.post('/api/task/createTask', taskData),

  updateTask: (taskId, updates) => api.put('/api/task/updateTask', { taskId, ...updates }),

  deleteTask: (taskId) => api.delete('/api/task/deleteTask', { data: { taskId } }),

  toggleTask: (taskId) => api.post('/api/task/toggletask', { taskId }),

  toggleCompletion: (taskId) => api.put('/api/task/toggleCompletion', { taskId }),

  getTaskById: (taskId) => api.get('/api/task/getTaskById', { params: { taskId } }),
};

// Mailer API
export const mailerAPI = {
  sendEmail: (emailData) => api.post('/api/mailer/send', emailData),
};

// Admin API
export const adminAPI = {
  getUsers: () => api.get('/api/admin/users'),

  updateUser: (userId, updates) => api.post('/api/admin/update-user', { userId, ...updates }),

  deleteUser: (userId) => api.delete('/api/admin/delete-user', { data: { userId } }),

  getStats: () => api.get('/api/admin/stats'),
};

// Utility functions
export const apiUtils = {
  // Handle unauthorized errors consistently
  handleUnauthorized: (error, callback) => {
    if (error.response?.status === 401) {
      if (callback) callback(error);
      return true;
    }
    return false;
  },

  // Create abort controller for requests
  createAbortController: () => new AbortController(),

  // Check if error is network error
  isNetworkError: (error) => !error.response && error.request,

  // Check if error is timeout
  isTimeoutError: (error) => error.code === 'ECONNABORTED',
};

export default api;
