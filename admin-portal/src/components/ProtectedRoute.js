import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { adminAuth } from '../utils/adminAuth';

// Component to protect admin routes
export const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = adminAuth.isAuthenticated();

  if (!isAuthenticated) {
    // Redirect to login with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Component to protect login route when admin is already authenticated
export const PublicRoute = ({ children }) => {
  const isAuthenticated = adminAuth.isAuthenticated();

  if (isAuthenticated) {
    // Redirect to dashboard if already authenticated
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Component to check specific permissions
export const PermissionGuard = ({ permission, children, fallback = null }) => {
  const hasPermission = adminAuth.hasPermission(permission);

  if (!hasPermission) {
    return fallback;
  }

  return children;
};
