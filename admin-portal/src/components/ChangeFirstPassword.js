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
  Alert,
  CssBaseline,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  CheckCircle,
  Cancel,
  Security,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useNavigate } from 'react-router-dom';
import { adminAuth } from '../utils/adminAuth';

export default function ChangeFirstPassword({ tempToken, adminData }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Password validation rules
  const validatePassword = (password) => {
    const rules = [
      {
        test: password.length >= 8,
        label: 'At least 8 characters long',
        key: 'length',
      },
      {
        test: /[A-Z]/.test(password),
        label: 'Contains uppercase letter',
        key: 'uppercase',
      },
      {
        test: /[a-z]/.test(password),
        label: 'Contains lowercase letter',
        key: 'lowercase',
      },
      {
        test: /\d/.test(password),
        label: 'Contains number',
        key: 'number',
      },
      {
        test: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        label: 'Contains special character',
        key: 'special',
      },
    ];
    return rules;
  };

  const passwordRules = validatePassword(newPassword);
  const isPasswordValid = passwordRules.every((rule) => rule.test);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!isPasswordValid) {
      setError('Password does not meet all requirements.');
      setLoading(false);
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const result = await adminAuth.changeFirstPassword(tempToken, newPassword, confirmPassword);

      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(result.message);
        if (result.errors) {
          setError(`${result.message}: ${result.errors.join(', ')}`);
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 2,
        }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={10}
            sx={{
              p: 4,
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                mb: 3,
              }}
            >
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: '#ff9800',
                  color: 'white',
                }}
              >
                <Security sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography
                variant="h4"
                align="center"
                sx={{
                  color: '#ff9800',
                  fontWeight: 700,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                Password Change Required
              </Typography>
              <Typography
                variant="body1"
                align="center"
                sx={{
                  color: '#666',
                  fontWeight: 500,
                }}
              >
                Welcome, {adminData?.name}! Please create a new password for your first login.
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              <TextField
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                variant="outlined"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#ff9800' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#ff9800',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ff9800',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#ff9800',
                  },
                }}
              />

              {newPassword && (
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Password Requirements:
                  </Typography>
                  <List dense>
                    {passwordRules.map((rule) => (
                      <ListItem key={rule.key} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {rule.test ? (
                            <CheckCircle sx={{ color: 'green', fontSize: 20 }} />
                          ) : (
                            <Cancel sx={{ color: 'red', fontSize: 20 }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={rule.label}
                          sx={{
                            '& .MuiTypography-root': {
                              fontSize: '0.875rem',
                              color: rule.test ? 'green' : 'red',
                            },
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}

              <TextField
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                variant="outlined"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                fullWidth
                error={confirmPassword && !passwordsMatch}
                helperText={confirmPassword && !passwordsMatch ? 'Passwords do not match' : ''}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#ff9800' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#ff9800',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ff9800',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#ff9800',
                  },
                }}
              />

              <LoadingButton
                type="submit"
                variant="contained"
                size="large"
                loading={loading}
                disabled={!isPasswordValid || !passwordsMatch}
                sx={{
                  bgcolor: '#ff9800',
                  '&:hover': { bgcolor: '#f57c00' },
                  color: 'white',
                  fontWeight: 700,
                  py: 1.5,
                  mt: 2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                }}
              >
                Change Password
              </LoadingButton>
            </Box>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#999' }}>
                🔒 After changing your password, you'll be redirected to login with your new
                credentials.
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
}
