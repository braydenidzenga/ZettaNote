import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  Chip,
  Avatar,
} from '@mui/material';
import {
  AdminPanelSettings,
  ExitToApp,
  Person,
  Dashboard,
  People,
  Analytics,
  SupervisorAccount,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminAuth } from '../utils/adminAuth';
import { APP_NAME } from '../config';

export default function AdminNavbar() {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const adminUser = adminAuth.getAdminUser();

  const handleLogout = async () => {
    await adminAuth.logout();
    navigate('/login');
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin':
        return 'error';
      case 'admin':
        return 'warning';
      case 'moderator':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'moderator':
        return 'Moderator';
      default:
        return role;
    }
  };

  const menuItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <Dashboard />,
      permission: null,
    },
    {
      label: 'Users',
      path: '/users',
      icon: <People />,
      permission: 'read_users',
    },
    {
      label: 'Analytics',
      path: '/analytics',
      icon: <Analytics />,
      permission: 'read_analytics',
    },
    {
      label: 'Admin Management',
      path: '/admin-management',
      icon: <SupervisorAccount />,
      permission: 'manage_admins',
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar position="static" sx={{ backgroundColor: '#d32f2f' }}>
      <Toolbar>
        <AdminPanelSettings sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
          {APP_NAME}
        </Typography>

        {/* Navigation Menu */}
        <Box sx={{ ml: 4, display: 'flex', gap: 1 }}>
          {menuItems.map((item) => {
            // Check permission
            if (item.permission && !adminAuth.hasPermission(item.permission)) {
              return null;
            }

            return (
              <Button
                key={item.path}
                color="inherit"
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  backgroundColor: isActive(item.path) ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {adminUser && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={getRoleLabel(adminUser.role)}
              color={getRoleColor(adminUser.role)}
              size="small"
              sx={{ color: 'white', fontWeight: 600 }}
            />

            <Button
              color="inherit"
              startIcon={
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                  <Person sx={{ fontSize: 20 }} />
                </Avatar>
              }
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              {adminUser.name}
            </Button>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  mt: 1,
                  borderRadius: 2,
                  minWidth: 200,
                },
              }}
            >
              <MenuItem disabled>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {adminUser.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {adminUser.email}
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
