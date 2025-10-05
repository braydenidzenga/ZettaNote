import React, { useState, useRef, useEffect } from "react";
import { 
    Container, 
    Typography, 
    IconButton, 
    Box, 
    Paper, 
    CircularProgress,
    useTheme,
    useMediaQuery,
    Tooltip,
    Fade
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { API_URL } from "../../config";
import ReactMarkdown from "react-markdown";
import SharePageButton from "./sharePageButton";
import { FaTrashCan } from "react-icons/fa6";
import { showToast } from "../../utils/toast";

// Always normalize page id for backend requests
const normalizePage = (page) => ({
    id: String(page?.id || page?._id),
    name: page?.name,
    content: page?.pageData,
});

export default function PageView({ page }) {
    const normalizedPage = normalizePage(page);
    const [content, setContent] = useState("");
    const [editing, setEditing] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const textareaRef = useRef(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        if (!normalizedPage.id) return;
        setLoading(true);
        setError("");
        const fetchPage = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(API_URL + "/api/pages/getpage", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token, pageId: normalizedPage.id }),
                });
                const data = await res.json();
                if (res.ok && data.Page) {
                    setContent(data.Page.pageData || "");
                } else {
                    setError(data.message || "Failed to load page");
                }
            } catch (err) {
                setError("Failed to load page");
            } finally {
                setLoading(false);
            }
        };
        fetchPage();
    }, [normalizedPage.id]);

    useEffect(()=>{
        const timer = setTimeout(()=>{
            if(content){
                console.log("Firing Auto Save")
                handleSave()
            }
        },2000);

        return ()=> clearTimeout(timer)
    },[content])

    const handleSave = async () => {
        setError("");
        const loadingToast = showToast.loading("Saving page...");
        
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(API_URL + "/api/pages/savepage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    pageId: normalizedPage.id,
                    newPageData: content,
                }),
            });
            const data = await res.json();
            
            showToast.dismiss(loadingToast);
            
            if (!res.ok) {
                setError(data.message || "Failed to save page");
                showToast.error("Failed to save page");
            } else {
                showToast.success("Page saved successfully!");
            }
        } catch (err) {
            showToast.dismiss(loadingToast);
            setError("Failed to save page");
            showToast.error("Failed to save page");
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this page?")) return;
        setError("");
        setLoading(true);

        const loadingToast = showToast.loading("Deleting page...");

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(API_URL + "/api/pages/deletepage", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, pageId: normalizedPage.id }),
            });

            const data = await res.json();
            
            showToast.dismiss(loadingToast);

            if (!res.ok) {
                setError(data.message || "Failed to delete page");
                showToast.error("Failed to delete page");
            } else {
                showToast.success("Page deleted successfully");
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
            showToast.dismiss(loadingToast);
            setError("Failed to delete page");
            showToast.error("Failed to delete page");
        } finally {
            setLoading(false);
        }
    };


    const token = localStorage.getItem("token");

    return (
        <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 3 }, mb: 4 }}>
            <Fade in={true} timeout={600}>
                <Box>
                    {/* Header Section */}
                    <Paper
                        elevation={0}
                        sx={{
                            display: "flex", 
                            alignItems: "center", 
                            mb: 3,
                            p: { xs: 2, md: 3 },
                            borderRadius: 2,
                            background: theme.palette.mode === 'dark'
                                ? 'rgba(30,30,30,0.6)'
                                : 'rgba(255,255,255,0.8)',
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${theme.palette.divider}`,
                        }}
                    >
                        <Typography 
                            variant={isMobile ? "h5" : "h4"} 
                            sx={{ 
                                flexGrow: 1,
                                fontWeight: 600,
                                background: theme.palette.mode === 'dark'
                                    ? 'linear-gradient(45deg, #90CAF9 30%, #CE93D8 90%)'
                                    : 'linear-gradient(45deg, #1976D2 30%, #9c27b0 90%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}
                        >
                            {normalizedPage.name}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Delete Page" arrow>
                                <IconButton 
                                    color="error" 
                                    onClick={handleDelete} 
                                    disabled={loading}
                                    sx={{
                                        '&:hover': {
                                            transform: 'scale(1.1)',
                                            transition: 'transform 0.2s ease'
                                        }
                                    }}
                                >
                                    <FaTrashCan />
                                </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Save Page" arrow>
                                <IconButton 
                                    color="primary" 
                                    onClick={handleSave} 
                                    disabled={loading}
                                    sx={{
                                        '&:hover': {
                                            transform: 'scale(1.1)',
                                            transition: 'transform 0.2s ease'
                                        }
                                    }}
                                >
                                    <SaveIcon />
                                </IconButton>
                            </Tooltip>
                            
                            <SharePageButton token={token} pageId={normalizedPage.id} />
                        </Box>
                    </Paper>

                    {/* Error Display */}
                    {error && (
                        <Paper
                            elevation={0}
                            sx={{
                                mb: 3,
                                p: 2,
                                borderRadius: 2,
                                background: theme.palette.mode === 'dark'
                                    ? 'rgba(244, 67, 54, 0.1)'
                                    : 'rgba(244, 67, 54, 0.05)',
                                border: `1px solid ${theme.palette.error.main}20`,
                            }}
                        >
                            <Typography color="error" variant="body2">
                                {error}
                            </Typography>
                        </Paper>
                    )}

                    {/* Content Section */}
                    <Paper
                        elevation={0}
                        sx={{
                            minHeight: { xs: "70vh", md: "75vh" },
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            background: theme.palette.mode === 'dark'
                                ? 'rgba(30,30,30,0.4)'
                                : 'rgba(255,255,255,0.9)',
                            backdropFilter: 'blur(10px)',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                boxShadow: theme.shadows[4]
                            }
                        }}
                        onClick={() => setEditing(true)}
                    >
                        {loading ? (
                            <Box 
                                display="flex" 
                                justifyContent="center" 
                                alignItems="center" 
                                minHeight="70vh"
                            >
                                <CircularProgress size={60} thickness={4} />
                            </Box>
                        ) : editing ? (
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                onBlur={() => setEditing(false)}
                                style={{
                                    width: "100%",
                                    minHeight: isMobile ? "70vh" : "75vh",
                                    border: "none",
                                    outline: "none",
                                    background: "transparent",
                                    fontSize: isMobile ? "16px" : "18px",
                                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                                    resize: "none",
                                    padding: isMobile ? "20px" : "32px",
                                    lineHeight: 1.7,
                                    color: theme.palette.text.primary,
                                }}
                                autoFocus
                                placeholder="Start writing your thoughts..."
                            />
                        ) : (
                            <Box 
                                onClick={() => setEditing(true)}
                                sx={{ 
                                    p: { xs: 2.5, md: 4 },
                                    minHeight: { xs: "70vh", md: "75vh" },
                                    cursor: 'text',
                                    '& p': {
                                        fontSize: { xs: '16px', md: '18px' },
                                        lineHeight: 1.7,
                                        mb: 2
                                    },
                                    '& h1, & h2, & h3, & h4, & h5, & h6': {
                                        fontWeight: 600,
                                        mb: 2,
                                        mt: 3
                                    },
                                    '& code': {
                                        background: theme.palette.action.hover,
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.9em'
                                    },
                                    '& pre': {
                                        background: theme.palette.action.hover,
                                        padding: '16px',
                                        borderRadius: '8px',
                                        overflow: 'auto'
                                    }
                                }}
                            >
                                {content ? (
                                    <ReactMarkdown>{content}</ReactMarkdown>
                                ) : (
                                    <Typography 
                                        variant="body1" 
                                        sx={{ 
                                            fontStyle: 'italic',
                                            color: theme.palette.text.secondary,
                                            fontSize: { xs: '16px', md: '18px' }
                                        }}
                                    >
                                        Click to start writing...
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Paper>
                </Box>
            </Fade>
        </Container>
    );
}
