import React, { createContext, useState, useMemo, useContext } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline, IconButton } from '@mui/material';
// import { Brightness4, Brightness7 } from '@mui/icons-material';
import { WbSunny, Brightness4 } from '@mui/icons-material';

export const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: 'light',
});

export const useThemeContext = () => useContext(ColorModeContext);

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light Mode Palette
          primary: {
            main: '#1976D2',
            light: '#42a5f5',
            dark: '#1565c0',
            contrastText: '#fff',
          },
          secondary: {
            main: '#9c27b0',
          },
          background: {
            default: '#F5F7FA', // Consistent light background
            paper: '#FFFFFF', // Consistent white card background
          },
          text: {
            primary: '#1F2937',
            secondary: '#4B5563',
          },
        }
      : {
          // Dark Mode Palette
          primary: {
            main: '#90CAF9',
            light: '#e3f2fd',
            dark: '#42a5f5',
            contrastText: '#000',
          },
          secondary: {
            main: '#CE93D8',
          },
          background: {
            default: '#121212', // Consistent dark background
            paper: '#1E1E1E', // Consistent dark card background
          },
          text: {
            primary: '#FFFFFF',
            secondary: '#B0B0B0',
          },
        }),
  },
  shape: {
    borderRadius: 12, // Inherit from your original theme setting
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
});

export function ThemeContextProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const storedMode = localStorage.getItem('themeMode');
    if (storedMode) return storedMode;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', newMode);
          return newMode;
        });
      },
      mode,
    }),
    [mode]
  );

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      {/* APPLY MuiThemeProvider HERE to make the dynamic theme available */}
      <MuiThemeProvider theme={theme}>
        {/* CssBaseline must be inside the MuiThemeProvider */}
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
}

export function ThemeToggleButton() {
    const { mode, toggleColorMode } = useThemeContext();

    return (
        <IconButton
            sx={{
                ml: 1,
                bgcolor: mode === 'dark' ? 'rgba(40,40,40,0.85)' : 'rgba(230,240,255,0.9)', // soft blue/gray for light, subtle dark for dark
                color: mode === 'dark' ? '#fff' : '#1976d2', // white icon in dark mode, primary blue in light
                border: '1.5px solid',
                borderColor: mode === 'dark' ? '#444' : '#e0e0e0',
                boxShadow: mode === 'dark' ? 0 : 2,
                backdropFilter: 'blur(2px)',
                transition: 'background 0.2s, color 0.2s',
                '&:hover': {
                    bgcolor: mode === 'dark'
                        ? 'rgba(70,70,70,1)'
                        : 'rgba(180,210,255,0.4)',
                    color: mode === 'dark'
                        ? '#ffe082' // pale yellow accent on hover for dark
                        : '#135ca3', // darker blue accent for light
                }
            }}
            onClick={toggleColorMode}
            aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
        >
            {mode === 'light'
                ? <Brightness4 fontSize="medium" /> // moon icon for dark
                : <WbSunny fontSize="medium" /> // sun icon for light
            }
        </IconButton>
    );
}
