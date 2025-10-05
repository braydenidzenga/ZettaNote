import React, { useEffect, useState } from "react";
import { 
    Container, 
    Typography, 
    Button, 
    Box, 
    Paper, 
    Card, 
    CardContent, 
    Chip,
    Fade,
    Slide,
    Zoom,
    Grow,
    useTheme
} from "@mui/material";
import { 
    Edit as EditIcon,
    Folder as FolderIcon,
    Speed as SpeedIcon,
    Security as SecurityIcon,
    CloudSync as CloudIcon,
    GitHub as GitHubIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/ui/Navbar";

export default function Landingpage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const [isVisible, setIsVisible] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    useEffect(() => {
        setIsVisible(true);
        // Check if user is logged in
        const token = localStorage.getItem("token");
        setIsAuthenticated(!!token);
    }, []);

    const features = [
        {
            icon: <EditIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
            title: 'Rich Text Editor',
            description: 'Create and edit beautiful notes with our intuitive rich text editor'
        },
        {
            icon: <FolderIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
            title: 'Organized Storage',
            description: 'Keep your notes organized with folders and easy search functionality'
        },
        {
            icon: <SpeedIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
            title: 'Fast & Responsive',
            description: 'Lightning-fast performance with instant sync across all your devices'
        },
        {
            icon: <SecurityIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
            title: 'Secure & Private',
            description: 'Your notes are encrypted and stored securely with enterprise-grade protection'
        }
    ];

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default }}>
            <Navbar />
            
            {/* Hero Section */}
            <Container maxWidth="lg" sx={{ pt: 12, pb: 8 }}>
                <Fade in={isVisible} timeout={1000}>
                    <Box sx={{ textAlign: 'center', mb: 8 }}>
                        <Typography 
                            variant="h1" 
                            sx={{ 
                                fontSize: { xs: '2.5rem', md: '4rem' },
                                fontWeight: 800,
                                mb: 3,
                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}
                        >
                            ZettaNote
                        </Typography>
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                mb: 4, 
                                color: theme.palette.text.primary,
                                fontWeight: 500,
                                fontSize: { xs: '1.5rem', md: '2rem' }
                            }}
                        >
                            Your thoughts, organized and accessible anywhere
                        </Typography>
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                mb: 6, 
                                color: theme.palette.text.secondary,
                                fontSize: '1.2rem',
                                maxWidth: '600px',
                                mx: 'auto'
                            }}
                        >
                            A powerful note-taking app that helps you capture ideas, organize thoughts, 
                            and collaborate seamlessly across all your devices.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {isAuthenticated ? (
                                // Show Dashboard button when logged in
                                <Button 
                                    variant="contained" 
                                    size="large"
                                    onClick={() => navigate('/home')}
                                    sx={{ 
                                        px: 4, 
                                        py: 1.5,
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        boxShadow: `0 8px 25px ${theme.palette.primary.main}40`,
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: `0 12px 35px ${theme.palette.primary.main}60`
                                        }
                                    }}
                                >
                                    Go to Dashboard
                                </Button>
                            ) : (
                                // Show Sign Up / Sign In buttons when not logged in
                                <>
                                    <Button 
                                        variant="contained" 
                                        size="large"
                                        onClick={() => navigate('/signup')}
                                        sx={{ 
                                            px: 4, 
                                            py: 1.5,
                                            fontSize: '1.1rem',
                                            fontWeight: 600,
                                            borderRadius: 2,
                                            boxShadow: `0 8px 25px ${theme.palette.primary.main}40`,
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: `0 12px 35px ${theme.palette.primary.main}60`
                                            }
                                        }}
                                    >
                                        Get Started Free
                                    </Button>
                                    <Button 
                                        variant="outlined" 
                                        size="large"
                                        onClick={() => navigate('/login')}
                                        sx={{ 
                                            px: 4, 
                                            py: 1.5,
                                            fontSize: '1.1rem',
                                            fontWeight: 600,
                                            borderRadius: 2,
                                            borderWidth: 2,
                                            '&:hover': {
                                                borderWidth: 2,
                                                transform: 'translateY(-2px)'
                                            }
                                        }}
                                    >
                                        Sign In
                                    </Button>
                                </>
                            )}
                        </Box>
                    </Box>
                </Fade>
            </Container>

            {/* Features Section */}
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Typography 
                    variant="h3" 
                    sx={{ 
                        textAlign: 'center', 
                        mb: 6,
                        fontWeight: 700,
                        color: theme.palette.text.primary
                    }}
                >
                    Why Choose ZettaNote?
                </Typography>
                <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 4
                }}>
                    {features.map((feature, index) => (
                        <Grow 
                            in={isVisible} 
                            timeout={1000 + index * 200}
                            key={index}
                        >
                            <Card 
                                sx={{ 
                                    p: 3,
                                    height: '100%',
                                    transition: 'all 0.3s ease',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                                    }
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ mb: 2 }}>
                                        {feature.icon}
                                    </Box>
                                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                        {feature.description}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grow>
                    ))}
                </Box>
            </Container>

            {/* CTA Section */}
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Slide in={isVisible} direction="up" timeout={1500}>
                    <Paper 
                        sx={{ 
                            p: 6, 
                            textAlign: 'center',
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                            color: 'white',
                            borderRadius: 3
                        }}
                    >
                        <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
                            {isAuthenticated ? "Welcome back!" : "Ready to get started?"}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 4, fontSize: '1.2rem', opacity: 0.9 }}>
                            {isAuthenticated 
                                ? "Continue organizing your thoughts and ideas with ZettaNote."
                                : "Join thousands of users who trust ZettaNote with their ideas and thoughts."
                            }
                        </Typography>
                        <Button 
                            variant="contained" 
                            size="large"
                            onClick={() => navigate(isAuthenticated ? '/home' : '/signup')}
                            sx={{ 
                                bgcolor: 'white',
                                color: theme.palette.primary.main,
                                px: 4,
                                py: 1.5,
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                '&:hover': {
                                    bgcolor: theme.palette.grey[100],
                                    transform: 'translateY(-2px)'
                                }
                            }}
                        >
                            {isAuthenticated ? "Go to Dashboard" : "Create Your Account"}
                        </Button>
                    </Paper>
                </Slide>
            </Container>

            {/* Footer */}
            <Box sx={{ bgcolor: theme.palette.grey[800], color: 'white', py: 4, mt: 8 }}>
                <Container maxWidth="lg">
                    <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.8 }}>
                        © 2025 ZettaNote. All rights reserved.
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
}
