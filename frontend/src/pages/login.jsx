import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Typography,
  Paper,
  Avatar,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  useTheme,
} from "@mui/material";
import { Visibility, VisibilityOff, Email, Lock } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import axios from 'axios';
import { API_URL } from '../config';

export default function Login() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors("");
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, 
        { email, password }, 
        { withCredentials: true }
      );
      
      // Store user data in localStorage (no token needed as it's in cookies)
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/home");
    } catch (err) {
      // Handle axios errors properly
      if (err.response) {
        // Server responded with error status
        setErrors(err.response.data.message || 'Login failed');
      } else if (err.request) {
        // Request was made but no response received
        setErrors("Network error - please check your connection");
      } else {
        // Something else happened
        setErrors(err.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.palette.background.default, p: 2 }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, mb: 2 }}>
            <Avatar src="/logo.png" alt="ZettaNote" sx={{ width: 86, height: 86, bgcolor: "transparent" }} />
            <Typography variant="h5" align="center" sx={{ color: theme.palette.text.primary, fontWeight: 800 }}>ZettaNote</Typography>
            <Typography variant="body2" align="center" sx={{ color: theme.palette.text.secondary }}>Sign in to your account</Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {errors && (<Typography color="error" variant="body2" align="center">{errors}</Typography>)}

            <TextField
              label="Email"
              type="email"
              variant="filled"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              InputProps={{
                startAdornment: (<InputAdornment position="start"><Email sx={{ color: theme.palette.primary.main }} /></InputAdornment>),
                disableUnderline: true,
              }}
              sx={{ bgcolor: theme.palette.background.paper, borderRadius: 2, '& .MuiFilledInput-input': { color: theme.palette.text.primary } }}
            />

            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              variant="filled"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              InputProps={{
                startAdornment: (<InputAdornment position="start"><Lock sx={{ color: theme.palette.primary.main }} /></InputAdornment>),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff sx={{ color: theme.palette.primary.main }} /> : <Visibility sx={{ color: theme.palette.primary.main }} />}
                    </IconButton>
                  </InputAdornment>
                ),
                disableUnderline: true,
              }}
              sx={{ bgcolor: theme.palette.background.paper, borderRadius: 2, '& .MuiFilledInput-input': { color: theme.palette.text.primary } }}
            />

            <LoadingButton
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              loading={loading}
              sx={{ bgcolor: theme.palette.primary.main, color: 'common.white', fontWeight: 700, py: 1.25 }}
            >
              Sign In
            </LoadingButton>

            <Typography variant="body2" align="center" sx={{ mt: 2, color: theme.palette.text.secondary }}>
              Don't have an account?{' '}
              <MuiLink component={RouterLink} to="/signup" underline="hover" sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>
                Create one
              </MuiLink>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
