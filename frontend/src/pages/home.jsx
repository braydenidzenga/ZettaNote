import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/ui/sidebar";
import Navbar from "../components/ui/Navbar";
import PageView from "../components/ui/pageView";
import NewPagePopup from "../components/ui/newPagePopup";
import { Typography, Box, Paper, Card, CardContent, useTheme } from "@mui/material";
import { useEffect } from "react";
import { API_URL } from "../config";
import { showToast } from "../utils/toast";
import { 
    MenuBook as NotesIcon, 
    CreateNewFolder as CreateIcon, 
    TrendingUp as TrendingIcon 
} from '@mui/icons-material';

export default function Home() {
    const navigate = useNavigate();
    const [selectedPage, setSelectedPage] = useState(null);
    const [name, setName] = useState("");
    const [newPagePopupOpen, setNewPagePopupOpen] = useState(false);
    const theme = useTheme();

    useEffect(() => {
        const token = localStorage.getItem("token");

        const getUser = async () => {
            try {
                const res = await fetch(API_URL+"/api/auth/getuser", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token })
                });
                const data = await res.json();
                if (res.ok && data.user) {
                    setName(data.user.name);
                } else {
                    showToast.error("Session expired. Please login again.");
                    navigate("/");
                }
            } catch (err) {
                showToast.error("Failed to authenticate. Please try again.");
                navigate("/");
            }
        }

        getUser();
    });


    // Logout handled in Navbar; keep function for future use if needed

    const onCreatePage = () => {
        setNewPagePopupOpen(true);
    };

    const onSelectPage = (page) => {
        setSelectedPage(page);
    };

    // Welcome screen component for when no page is selected
    const WelcomeScreen = () => (
        <Box 
            sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                minHeight: 'calc(100vh - 140px)', // Account for header and padding
                padding: { xs: 2, md: 4 },
                textAlign: 'center'
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    padding: { xs: 3, md: 6 },
                    borderRadius: 3,
                    background: theme.palette.mode === 'dark' 
                        ? 'linear-gradient(135deg, rgba(30,30,30,0.8) 0%, rgba(50,50,50,0.6) 100%)'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,247,250,0.8) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${theme.palette.divider}`,
                    maxWidth: 600,
                    width: '100%'
                }}
            >
                <Box sx={{ mb: 4 }}>
                    <NotesIcon 
                        sx={{ 
                            fontSize: { xs: 60, md: 80 }, 
                            color: theme.palette.primary.main,
                            mb: 2,
                            opacity: 0.8
                        }} 
                    />
                    <Typography 
                        variant="h3" 
                        component="h1"
                        sx={{ 
                            mb: 2,
                            fontWeight: 600,
                            fontSize: { xs: '1.8rem', md: '2.5rem' },
                            background: theme.palette.mode === 'dark'
                                ? 'linear-gradient(45deg, #90CAF9 30%, #CE93D8 90%)'
                                : 'linear-gradient(45deg, #1976D2 30%, #9c27b0 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}
                    >
                        Welcome back{name ? `, ${name}` : ''}!
                    </Typography>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            color: theme.palette.text.secondary,
                            fontWeight: 400,
                            lineHeight: 1.6,
                            fontSize: { xs: '1rem', md: '1.25rem' }
                        }}
                    >
                        Ready to capture your thoughts and ideas?
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Card 
                        elevation={0}
                        sx={{ 
                            flex: 1, 
                            minWidth: { xs: '100%', sm: 200 },
                            background: theme.palette.action.hover,
                            border: `1px solid ${theme.palette.divider}`,
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: theme.shadows[4],
                                background: theme.palette.action.selected
                            }
                        }}
                        onClick={onCreatePage}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <CreateIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                Create
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Start with a new page
                            </Typography>
                        </CardContent>
                    </Card>

                    <Card 
                        elevation={0}
                        sx={{ 
                            flex: 1, 
                            minWidth: { xs: '100%', sm: 200 },
                            background: theme.palette.action.hover,
                            border: `1px solid ${theme.palette.divider}`,
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: theme.shadows[4],
                                background: theme.palette.action.selected
                            }
                        }}
                        onClick={() => showToast.info("Select a page from the sidebar to continue editing")}
                    >
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <TrendingIcon sx={{ fontSize: 40, color: theme.palette.secondary.main, mb: 1 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                Continue
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Pick up where you left off
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                <Typography 
                    variant="body2" 
                    sx={{ 
                        mt: 4, 
                        color: theme.palette.text.secondary,
                        fontStyle: 'italic'
                    }}
                >
                    Select a page from the sidebar or create a new one to get started
                </Typography>
            </Paper>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            <Navbar />

            {/* Add spacer to account for fixed header */}
            <Box sx={{ height: { xs: 64, md: 72 } }} />

            <Box sx={{ display: "flex", flexGrow: 1, overflow: 'hidden' }}>
                <Sidebar
                    token={localStorage.getItem("token")}
                    onSelectPage={onSelectPage}
                />

                <Box 
                    component="main" 
                    sx={{ 
                        flexGrow: 1, 
                        padding: { xs: 1, md: 2 },
                        background: theme.palette.mode === 'dark'
                            ? 'linear-gradient(180deg, rgba(18,18,18,1) 0%, rgba(25,25,25,1) 100%)'
                            : 'linear-gradient(180deg, rgba(245,247,250,1) 0%, rgba(255,255,255,1) 100%)',
                        overflow: 'auto'
                    }}
                >
                    {selectedPage ? (
                        <PageView page={selectedPage} />
                    ) : (
                        <WelcomeScreen />
                    )}
                </Box>
            </Box>

            <NewPagePopup 
                open={newPagePopupOpen} 
                onClose={() => setNewPagePopupOpen(false)} 
            />
        </Box>
    );
}
