import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Box, useTheme, alpha } from '@mui/material';
import { Add as AddIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { ThemeToggleButton } from './ThemeContext';

export default function HeaderBar({ onLogout, onNewPage }) {
  const theme = useTheme();

  const handleNewPage = () => {
    if (onNewPage) onNewPage();
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: 1300,
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(20,20,20,0.98) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,250,250,0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0,0,0,0.3)'
              : '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
          <Typography
            variant="h5"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #90CAF9 30%, #CE93D8 90%)'
                  : 'linear-gradient(45deg, #1976D2 30%, #9c27b0 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
            }}
          >
            ZettaNote
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleNewPage}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                color: theme.palette.primary.main,
                borderColor: alpha(theme.palette.primary.main, 0.5),
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  background: alpha(theme.palette.primary.main, 0.1),
                  transform: 'translateY(-1px)',
                },
              }}
            >
              New Page
            </Button>

            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={onLogout}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                color: theme.palette.text.primary,
                borderColor: alpha(theme.palette.text.primary, 0.3),
                '&:hover': {
                  borderColor: theme.palette.text.primary,
                  background: alpha(theme.palette.text.primary, 0.1),
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Logout
            </Button>

            <ThemeToggleButton />
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
}
