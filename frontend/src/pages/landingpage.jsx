// src/pages/Landing.jsx
import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import {
  Edit as EditIcon,
  Group as GroupIcon,
  Folder as FolderIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  CloudSync as CloudIcon,
  Star as StarIcon,
  GitHub as GitHubIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';
import { useAuth } from '../utils/auth';

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [featureVisible, setFeatureVisible] = useState(false);
  const [testimonialVisible, setTestimonialVisible] = useState(false);

  useEffect(() => {
    // Hero section animation
    const timer1 = setTimeout(() => setIsVisible(true), 300);

    // Features section animation
    const timer2 = setTimeout(() => setFeatureVisible(true), 800);

    // Testimonials section animation
    const timer3 = setTimeout(() => setTestimonialVisible(true), 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const features = [
    {
      icon: <EditIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Markdown Support',
      description:
        'Write beautiful notes with full Markdown support. Format text, add links, images, and code blocks effortlessly.',
    },
    {
      icon: <FolderIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Flexible Organization',
      description:
        'Organize your notes with a flexible folder structure. Create, rename, and manage your pages with ease.',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Lightweight & Fast',
      description:
        "Built for performance. ZettaNote is lightweight, fast, and doesn't slow you down with unnecessary features.",
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Secure & Private',
      description:
        'Your notes are secure and private. We respect your data and provide you with full control over your content.',
    },
    {
      icon: <CloudIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Cloud Sync',
      description:
        'Access your notes anywhere, anytime. Your data syncs seamlessly across all your devices.',
    },
  ];

  const testimonials = [
    {
      name: 'Alex Chen',
      role: 'Software Developer',
      content:
        'ZettaNote has transformed how our team collaborates on documentation. Real-time editing are game-changers.',
      rating: 5,
    },
    {
      name: 'Sarah Johnson',
      role: 'Product Manager',
      content:
        "Finally, a note-taking app that doesn't get in the way. Clean, fast, and exactly what we needed for our project planning.",
      rating: 5,
    },
    {
      name: 'Mike Rodriguez',
      role: 'Tech Lead',
      content:
        'The open-source nature of ZettaNote gives us confidence in our data. Plus, the collaboration features are top-notch.',
      rating: 5,
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navbar */}
      <Navbar />
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 12, pb: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Box>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 'bold',
                mb: 3,
                background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ZettaNote
            </Typography>
          </Box>

          <Slide direction="up" in={isVisible} timeout={800} style={{ transitionDelay: '400ms' }}>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  mb: 3,
                  color: 'text.secondary',
                  fontWeight: 300,
                }}
              >
                {isAuthenticated && user
                  ? `Welcome back, ${user.name}! Ready to continue your note-taking journey?`
                  : 'Markdown-based notes, real-time collaboration, and flexible organization in a lightweight package'}
              </Typography>
            </Box>
          </Slide>

          <Slide direction="up" in={isVisible} timeout={800} style={{ transitionDelay: '600ms' }}>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  mb: 4,
                  color: 'text.secondary',
                  maxWidth: '600px',
                  mx: 'auto',
                  lineHeight: 1.6,
                }}
              >
                The open-source note-taking app built for developers and teams who value simplicity,
                speed, and collaboration.
              </Typography>
            </Box>
          </Slide>

          <Slide direction="up" in={isVisible} timeout={800} style={{ transitionDelay: '800ms' }}>
            <Box>
              {isAuthenticated ? (
                // Show dashboard button for authenticated users
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<DashboardIcon />}
                    onClick={() => navigate('/home')}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 6,
                      },
                    }}
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<GitHubIcon />}
                    onClick={() =>
                      window.open('https://github.com/braydenidzenga/ZettaNote', '_blank')
                    }
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    View on GitHub
                  </Button>
                </Box>
              ) : (
                // Show auth buttons for non-authenticated users
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/signup')}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 6,
                      },
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
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    Already registered? Login now
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<GitHubIcon />}
                    onClick={() =>
                      window.open('https://github.com/braydenidzenga/ZettaNote', '_blank')
                    }
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    View on GitHub
                  </Button>
                </Box>
              )}
            </Box>
          </Slide>

          <Slide direction="up" in={isVisible} timeout={800} style={{ transitionDelay: '1000ms' }}>
            <Box>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Chip
                  label="Open Source"
                  color="primary"
                  variant="outlined"
                  sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      bgcolor: 'primary.main',
                      color: 'white',
                    },
                  }}
                />
                <Chip
                  label="Free Forever"
                  color="success"
                  variant="outlined"
                  sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      bgcolor: 'success.main',
                      color: 'white',
                    },
                  }}
                />
                <Chip
                  label="Self-hosted"
                  color="info"
                  variant="outlined"
                  sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      bgcolor: 'info.main',
                      color: 'white',
                    },
                  }}
                />
              </Box>
            </Box>
          </Slide>
        </Box>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Slide direction="up" in={featureVisible} timeout={800}>
          <Box>
            <Typography variant="h3" align="center" sx={{ mb: 6, fontWeight: 'bold' }}>
              Why Choose ZettaNote?
            </Typography>
          </Box>
        </Slide>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {features.map((feature, index) => (
            <Grow
              key={index}
              in={featureVisible}
              timeout={600}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <Card
                elevation={2}
                sx={{
                  flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 16px)' },
                  minWidth: { xs: '100%', md: '300px' },
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: 8,
                    '& .feature-icon': {
                      transform: 'scale(1.1) rotate(5deg)',
                    },
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box
                    sx={{
                      mb: 2,
                      transition: 'transform 0.3s ease',
                    }}
                    className="feature-icon"
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grow>
          ))}
        </Box>
      </Container>

      {/* Benefits Section */}

      {/* Final CTA Section */}
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Fade in={testimonialVisible} timeout={1000} style={{ transitionDelay: '500ms' }}>
          <Paper
            elevation={4}
            sx={{
              p: 6,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                animation: 'shimmer 3s infinite',
              },
              '@keyframes shimmer': {
                '0%': { left: '-100%' },
                '100%': { left: '100%' },
              },
            }}
          >
            <Zoom in={testimonialVisible} timeout={800} style={{ transitionDelay: '700ms' }}>
              <Box>
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
                  {isAuthenticated
                    ? 'Your Notes Are Waiting!'
                    : 'Ready to Transform Your Note-Taking?'}
                </Typography>
              </Box>
            </Zoom>
            <Slide
              direction="up"
              in={testimonialVisible}
              timeout={800}
              style={{ transitionDelay: '900ms' }}
            >
              <Box>
                <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                  {isAuthenticated
                    ? 'Continue where you left off and keep building your knowledge base.'
                    : 'Join thousands of developers and teams who have already made the switch to ZettaNote.'}
                </Typography>
              </Box>
            </Slide>
            <Slide
              direction="up"
              in={testimonialVisible}
              timeout={800}
              style={{ transitionDelay: '1100ms' }}
            >
              <Box>
                {isAuthenticated ? (
                  // Show different CTA for authenticated users
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<DashboardIcon />}
                      onClick={() => navigate('/home')}
                      sx={{
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        bgcolor: 'white',
                        color: 'primary.main',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'grey.100',
                          transform: 'translateY(-2px) scale(1.05)',
                          boxShadow: 6,
                        },
                      }}
                    >
                      Continue to Dashboard
                    </Button>
                  </Box>
                ) : (
                  // Show auth CTAs for non-authenticated users
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate('/signup')}
                      sx={{
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        bgcolor: 'white',
                        color: 'primary.main',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'grey.100',
                          transform: 'translateY(-2px) scale(1.05)',
                          boxShadow: 6,
                        },
                      }}
                    >
                      Start Your Journey
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/login')}
                      sx={{
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        borderColor: 'white',
                        color: 'white',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: 'white',
                          bgcolor: 'rgba(255,255,255,0.1)',
                          transform: 'translateY(-2px) scale(1.05)',
                          boxShadow: 4,
                        },
                      }}
                    >
                      Sign In
                    </Button>
                  </Box>
                )}
              </Box>
            </Slide>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
}
