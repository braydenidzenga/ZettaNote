import React, { useState, useEffect } from "react";
import {
    Container,
    Typography,
    Box,
    Paper,
    CircularProgress,
    useTheme
} from "@mui/material";
import axios from 'axios';
import SharePageButton from "./sharePageButton";
import RichMarkdownEditor from "./RichMarkdownEditor";
import { API_URL } from "../../config";
import { showToast } from "../../utils/toast";

// Always normalize page id for backend requests
const normalizePage = (page) => ({
    id: String(page?.id || page?._id),
    name: page?.name,
    content: page?.pageData,
});

export default function PageView({ page, onPageDeleted }) {
    const normalizedPage = normalizePage(page);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const theme = useTheme();

    useEffect(() => {
        if (!normalizedPage.id) return;
        setLoading(true);
        setError("");
        const fetchPage = async () => {
            try {
                const res = await axios.post(`${API_URL}/api/pages/getpage`, 
                    { pageId: normalizedPage.id }, 
                    { withCredentials: true }
                );
                if (res.data.Page) {
                    setContent(res.data.Page.pageData || "");
                } else {
                    setError(res.data.message || "Failed to load page");
                }
            } catch (err) {
                if (err.response) {
                    setError(err.response.data.message || "Failed to load page");
                } else {
                    setError("Failed to load page");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchPage();
    }, [normalizedPage.id]);

    const handleSave = async () => {
        setError("");
        const loadingToast = showToast.loading("Saving page...");

        try {
            const res = await axios.post(`${API_URL}/api/pages/savepage`, {
                pageId: normalizedPage.id,
                newPageData: content,
            }, {
                withCredentials: true
            });

            showToast.dismiss(loadingToast);
            showToast.success("Page saved successfully!");
        } catch (err) {
            showToast.dismiss(loadingToast);
            const errorMessage = err.response?.data?.message || "Failed to save page";
            setError(errorMessage);
            showToast.error(errorMessage);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
            <Box>
                {/* Header Section */}
                <Paper
                    elevation={0}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 3,
                        p: 3,
                        borderRadius: 2,
                        background: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    <Typography
                        variant="h4"
                        sx={{
                            flexGrow: 1,
                            fontWeight: 600,
                            color: theme.palette.text.primary
                        }}
                    >
                        {normalizedPage.name}
                    </Typography>
                    <SharePageButton 
                        pageId={normalizedPage.id} 
                    />
                </Paper>

                {/* Error Display */}
                {error && (
                    <Paper
                        elevation={0}
                        sx={{
                            mb: 3,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: theme.palette.error.light,
                            border: `1px solid ${theme.palette.error.main}`,
                        }}
                    >
                        <Typography color="error" variant="body2">
                            {error}
                        </Typography>
                    </Paper>
                )}

                {/* Content Section */}
                {loading ? (
                    <Paper
                        elevation={0}
                        sx={{
                            minHeight: "70vh",
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            background: theme.palette.background.paper,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <CircularProgress size={60} thickness={4} />
                    </Paper>
                ) : (
                    <RichMarkdownEditor
                        content={content}
                        onChange={setContent}
                        onBlur={handleSave}
                        placeholder="Start writing your thoughts..."
                        height="70vh"
                        showPreview={true}
                    />
                )}
            </Box>
        </Container>
    );
}
