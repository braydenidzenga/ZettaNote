import React, { useState, useEffect } from "react";
import {
    Container,
    Typography,
    Box,
    Paper,
    CircularProgress,
    useTheme
} from "@mui/material";
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
                        token={localStorage.getItem("token")} 
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
