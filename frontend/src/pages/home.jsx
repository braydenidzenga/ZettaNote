import React, { useState, useEffect } from "react";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/ui/Navbar";
import Sidebar from "../components/ui/sidebar";
import PageView from "../components/ui/pageView";
import NewPagePopup from "../components/ui/newPagePopup";

export default function Home() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const [selectedPage, setSelectedPage] = useState(null);
    const [showNewPagePopup, setShowNewPagePopup] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const user = localStorage.getItem("user");
        if (!user) {
            navigate("/login");
        }
    }, [navigate]);

    const handleSelectPage = (page) => {
        setSelectedPage(page);
    };

    const handleNewPage = () => {
        setShowNewPagePopup(true);
    };

    const handleCloseNewPagePopup = () => {
        setShowNewPagePopup(false);
    };

    const handlePageCreated = () => {
        setRefreshTrigger(prev => prev + 1);
        setShowNewPagePopup(false);
    };

    const handlePageDeleted = () => {
        setSelectedPage(null);
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <Box sx={{ 
            minHeight: "100vh", 
            bgcolor: theme.palette.background.default,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Navbar />
            
            <Box sx={{ 
                display: 'flex', 
                flex: 1,
                pt: { xs: 8, md: 9 }
            }}>
                {/* Sidebar */}
                {!isMobile && (
                    <Box sx={{ 
                        width: 280, 
                        flexShrink: 0,
                        height: 'calc(100vh - 72px)',
                        position: 'fixed',
                        top: 72,
                        left: 0,
                        zIndex: theme.zIndex.drawer
                    }}>
                        <Sidebar 
                            onSelectPage={handleSelectPage}
                            refreshTrigger={refreshTrigger}
                            onNewPage={handleNewPage}
                        />
                    </Box>
                )}

                {/* Main Content */}
                <Box sx={{ 
                    flex: 1,
                    ml: isMobile ? 0 : '280px',
                    minHeight: 'calc(100vh - 72px)',
                    bgcolor: theme.palette.background.default
                }}>
                    {selectedPage ? (
                        <PageView 
                            page={selectedPage} 
                            onPageDeleted={handlePageDeleted}
                        />
                    ) : (
                        <Box sx={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 'calc(100vh - 72px)',
                            p: 4,
                            textAlign: 'center'
                        }}>
                            <Box sx={{ 
                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: { xs: '2rem', md: '3rem' },
                                fontWeight: 700,
                                mb: 2
                            }}>
                                Welcome to ZettaNote
                            </Box>
                            <Box sx={{ 
                                color: theme.palette.text.secondary,
                                fontSize: '1.1rem',
                                mb: 4,
                                maxWidth: 600,
                                mx: 'auto'
                            }}>
                                {isMobile 
                                    ? "Create your first note to get started with organizing your thoughts."
                                    : "Select a page from the sidebar to start editing, or create a new one to begin organizing your thoughts."
                                }
                            </Box>
                            
                            {isMobile && (
                                <Box sx={{
                                    position: 'fixed',
                                    bottom: 24,
                                    right: 24,
                                    zIndex: theme.zIndex.fab
                                }}>
                                    <Sidebar 
                                        onSelectPage={handleSelectPage}
                                        refreshTrigger={refreshTrigger}
                                        onNewPage={handleNewPage}
                                        isMobile={true}
                                    />
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>

            {/* New Page Popup */}
            <NewPagePopup 
                open={showNewPagePopup}
                onClose={handleCloseNewPagePopup}
                onPageCreated={handlePageCreated}
            />
        </Box>
    );
}
