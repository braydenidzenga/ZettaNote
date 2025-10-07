import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import { Box, useTheme } from '@mui/material';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

// Component to protect routes that require authentication
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const theme = useTheme();

  if (isLoading) {
    return (
      <SkeletonTheme
        baseColor={theme.palette.mode === 'dark' ? '#2a2a2a' : '#ebebeb'}
        highlightColor={theme.palette.mode === 'dark' ? '#3a3a3a' : '#f5f5f5'}
      >
        <Box sx={{ p: 3 }}>
          <div style={{ marginBottom: 16 }}>
            <Skeleton height={64} borderRadius={8} />
          </div>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Skeleton width={280} height={500} borderRadius={8} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Skeleton height={48} width={'60%'} />
              <div style={{ marginTop: 16 }}>
                <Skeleton height={400} borderRadius={8} />
              </div>
            </Box>
          </Box>
        </Box>
      </SkeletonTheme>
    );
  }

  if (!isAuthenticated) {
    // Redirect to landing page with return url
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

// Component to protect auth routes (login/signup) when user is already authenticated
export const AuthRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const theme = useTheme();

  if (isLoading) {
    return (
      <SkeletonTheme
        baseColor={theme.palette.mode === 'dark' ? '#2a2a2a' : '#ebebeb'}
        highlightColor={theme.palette.mode === 'dark' ? '#3a3a3a' : '#f5f5f5'}
      >
        <Box sx={{ p: 3 }}>
          <div style={{ marginBottom: 16 }}>
            <Skeleton height={64} borderRadius={8} />
          </div>
          <Skeleton height={400} borderRadius={8} />
        </Box>
      </SkeletonTheme>
    );
  }

  if (isAuthenticated) {
    // Redirect to home if already authenticated
    return <Navigate to="/home" replace />;
  }

  return children;
};
