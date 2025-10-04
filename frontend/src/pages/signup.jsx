import React, { useState } from "react";
import {
    Box,
    Container,
    TextField,
    Typography,
    Paper,
    Avatar,
    InputAdornment,
    Link as MuiLink,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { LoadingButton } from "@mui/lab";
import { useNavigate } from "react-router-dom";
import { } from '@mui/material/styles';

import { API_URL } from "../config";

export default function Signup() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors("");
        let data;

        try {
            const res = await fetch(API_URL + "/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, password, confirmPassword }),
            });

            data = await res.json();
            if (res.status !== 200) {
                setErrors(data.Error || data.message || "Error creating account");
            } else {
                localStorage.setItem("token", data.token);
                navigate("/home");
            }
        } catch (err) {
            setErrors(err?.message || "Network error");
        } finally {
            setLoading(false);
        }
    };

    

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f6ff',
            p: 2,
        }}>
            <Container maxWidth="sm">
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        backgroundColor: '#fbfeff',
                        border: '1px solid rgba(0,0,0,0.04)',
                        boxShadow: '12px 12px 24px rgba(163,177,198,0.12), -12px -12px 24px rgba(255,255,255,0.9)',
                        color: 'text.primary',
                    }}
                >
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, mb: 2 }}>
                    <Avatar
                        src="/logo.png"
                        alt="ZettaNote"
                        sx={{
                            width: 86,
                            height: 86,
                            bgcolor: "transparent",
                            boxShadow: `0 6px 18px rgba(21,101,192,0.08)`,
                        }}
                    />
                    <Typography variant="h5" align="center" sx={{ color: "#0f1724", fontWeight: 800 }}>
                        ZettaNote
                    </Typography>
                    <Typography variant="body2" align="center" sx={{ color: '#4b5563' }}>
                        Create your free account
                    </Typography>
                </Box>

                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                        {errors && (
                            <Typography color="error" variant="body2" align="center">
                                {errors}
                            </Typography>
                        )}

                    <TextField
                        label="Name"
                        type="text"
                        variant="filled"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        fullWidth
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PersonIcon sx={{ color: '#1976d2' }} />
                                </InputAdornment>
                            ),
                            disableUnderline: true,
                        }}
                        sx={{
                            bgcolor: '#ffffff',
                            borderRadius: 2,
                            '& .MuiFilledInput-input': { color: '#0f1724' },
                            boxShadow: 'inset 0 2px 6px rgba(16,24,40,0.04)',
                        }}
                    />

                    <TextField
                        label="Email"
                        type="email"
                        variant="filled"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        fullWidth
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmailIcon sx={{ color: '#1976d2' }} />
                                </InputAdornment>
                            ),
                            disableUnderline: true,
                        }}
                        sx={{
                            bgcolor: '#ffffff',
                            borderRadius: 2,
                            '& .MuiFilledInput-input': { color: '#0f1724' },
                            boxShadow: 'inset 0 2px 6px rgba(16,24,40,0.04)',
                        }}
                    />

                    <TextField
                        label="Password"
                        type="password"
                        variant="filled"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        fullWidth
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon sx={{ color: '#1976d2' }} />
                                </InputAdornment>
                            ),
                            disableUnderline: true,
                        }}
                        sx={{
                            bgcolor: '#ffffff',
                            borderRadius: 2,
                            '& .MuiFilledInput-input': { color: '#0f1724' },
                            boxShadow: 'inset 0 2px 6px rgba(16,24,40,0.04)',
                        }}
                    />

                    <TextField
                        label="Confirm password"
                        type="password"
                        variant="filled"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        fullWidth
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon sx={{ color: '#1976d2' }} />
                                </InputAdornment>
                            ),
                            disableUnderline: true,
                        }}
                        sx={{
                            bgcolor: '#ffffff',
                            borderRadius: 2,
                            '& .MuiFilledInput-input': { color: '#0f1724' },
                            boxShadow: 'inset 0 2px 6px rgba(16,24,40,0.04)',
                        }}
                    />

                    <LoadingButton
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        loading={loading}
                        sx={{
                            bgcolor: '#1976d2',
                            color: 'common.white',
                            fontWeight: 700,
                            boxShadow: '0 8px 20px rgba(25,118,210,0.12)',
                            '&:hover': { bgcolor: '#155fa8', transform: 'translateY(-2px)' },
                            py: 1.25,
                        }}
                    >
                        Sign Up
                    </LoadingButton>

                        <Typography variant="body2" align="center" sx={{ mt: 2, color: '#4b5563' }}>
                            Already have an account?{' '}
                            <MuiLink component={RouterLink} to="/login" underline="hover" sx={{ color: '#155fa8', fontWeight: 700 }}>
                                Sign in
                            </MuiLink>
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </Box>
        );
    }
