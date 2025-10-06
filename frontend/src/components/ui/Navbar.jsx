import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useTheme,
  alpha,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
} from '@mui/material';
import {
  Login as LoginIcon,
  PersonAdd as SignupIcon,
  Home as HomeIcon,
  GitHub as GitHubIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeToggleButton } from './ThemeContext';
import { useAuth, logoutUser } from '../../utils/auth';

export default function Navbar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const { isAuthenticated } = useAuth();

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout API fails, clear localStorage and redirect
      localStorage.removeItem('user');
      navigate('/');
    } finally {
      handleMobileMenuClose();
    }
  };

  const navItems = isAuthenticated
    ? [
        { label: 'Dashboard', path: '/home', icon: <HomeIcon /> },
        { label: 'Logout', action: handleLogout, icon: <LogoutIcon /> },
      ]
    : [
        { label: 'Home', path: '/', icon: <HomeIcon /> },
        { label: 'Login', path: '/login', icon: <LoginIcon /> },
        { label: 'Sign Up', path: '/signup', icon: <SignupIcon /> },
      ];

  const renderDesktopNav = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {navItems.map((item, index) => (
        <Button
          key={index}
          startIcon={item.icon}
          onClick={item.action || (() => navigate(item.path))}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1,
            color: theme.palette.text.primary,
            transition: 'all 0.3s ease',
            '&:hover': {
              background: alpha(theme.palette.primary.main, 0.1),
              transform: 'translateY(-1px)',
              color: theme.palette.primary.main,
            },
            ...(location.pathname === item.path && {
              background: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
            }),
          }}
        >
          {item.label}
        </Button>
      ))}

      <Button
        startIcon={<GitHubIcon />}
        onClick={() => window.open('https://github.com/braydenidzenga/ZettaNote', '_blank')}
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 600,
          px: 3,
          py: 1,
          color: theme.palette.text.secondary,
          transition: 'all 0.3s ease',
          '&:hover': {
            background: alpha(theme.palette.text.primary, 0.1),
            transform: 'translateY(-1px)',
            color: theme.palette.text.primary,
          },
        }}
      >
        GitHub
      </Button>

      <ThemeToggleButton />
    </Box>
  );

  const renderMobileNav = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <ThemeToggleButton />
      <IconButton
        onClick={handleMobileMenuOpen}
        sx={{
          color: theme.palette.text.primary,
          transition: 'all 0.3s ease',
          '&:hover': {
            background: alpha(theme.palette.primary.main, 0.1),
            transform: 'rotate(90deg)',
          },
        }}
      >
        {mobileMenuAnchor ? <CloseIcon /> : <MenuIcon />}
      </IconButton>

      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMobileMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 200,
            borderRadius: 2,
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(20,20,20,0.98) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,250,250,0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0,0,0,0.4)'
                : '0 8px 32px rgba(0,0,0,0.15)',
          },
        }}
      >
        {navItems.map((item, index) => (
          <MenuItem
            key={index}
            onClick={
              item.action ||
              (() => {
                navigate(item.path);
                handleMobileMenuClose();
              })
            }
            sx={{
              gap: 2,
              py: 1.5,
              px: 2,
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              },
              ...(location.pathname === item.path && {
                background: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }),
            }}
          >
            {item.icon}
            {item.label}
          </MenuItem>
        ))}

        <MenuItem
          onClick={() => {
            window.open('https://github.com/braydenidzenga/ZettaNote', '_blank');
            handleMobileMenuClose();
          }}
          sx={{
            gap: 2,
            py: 1.5,
            px: 2,
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
            transition: 'all 0.3s ease',
            '&:hover': {
              background: alpha(theme.palette.text.primary, 0.1),
              color: theme.palette.text.primary,
            },
          }}
        >
          <GitHubIcon />
          GitHub
        </MenuItem>
      </Menu>
    </Box>
  );

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: 1300,
        background:
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(15,15,15,0.95) 0%, rgba(10,10,10,0.98) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,250,250,0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.4)'
            : '0 4px 20px rgba(0,0,0,0.08)',
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 4 }, py: 1 }}>
        <Typography
          variant="h5"
          onClick={() => navigate('/')}
          sx={{
            flexGrow: 1,
            fontWeight: 800,
            background:
              theme.palette.mode === 'dark'
                ? `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.secondary.light} 90%)`
                : `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em',
            cursor: 'pointer',
          }}
        >
          ZettaNote
        </Typography>

        {isMobile ? renderMobileNav() : renderDesktopNav()}
      </Toolbar>
    </AppBar>
  );
}
