import React, { useEffect, useState } from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
  Box,
  Chip,
  useTheme,
  ListItemIcon,
  Skeleton,
  Button,
  IconButton, // New: for the edit/save/cancel buttons
  TextField, // New: for the input field
} from '@mui/material';
import {
  Description as PageIcon,
  Share as SharedIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Edit as EditIcon, // New: Edit icon
  Check as CheckIcon, // New: Save icon
  Close as CancelIcon, // New: Cancel icon
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';
import { showToast } from '../../utils/toast';

export default function Sidebar({ onSelectPage, refreshTrigger, onNewPage }) {
  const [ownedPages, setOwnedPages] = useState([]);
  const [sharedPages, setSharedPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  // New states for renaming functionality
  const [renamingPageId, setRenamingPageId] = useState(null);
  const [newPageName, setNewPageName] = useState('');

  useEffect(() => {
    const fetchPages = async () => {
      setLoading(true);
      try {
        const res = await axios.post(
          `${API_URL}/api/pages/getpages`,
          {},
          {
            withCredentials: true,
          }
        );

        setOwnedPages(res.data.OwnedPages || []);
        setSharedPages(res.data.SharedPages || []);
      } catch (err) {
        console.error('Failed to fetch pages:', err.message);
        showToast.error('Failed to load pages');
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, [refreshTrigger]);

  // Normalize page object for frontend
  const normalizePage = (page) => ({
    id: String(page.id || page._id),
    name: page.pageName || page.name,
    content: page.pageData,
  });

  // Handler to start the renaming process
  const startRename = (page) => {
    setRenamingPageId(page.id);
    setNewPageName(page.name);
  };

  // Handler to cancel the renaming process
  const cancelRename = () => {
    setRenamingPageId(null);
    setNewPageName('');
  };

  // Handler for API call to rename the page
  const handleRenamePage = async (pageId) => {
    const trimmedName = newPageName.trim();
    if (!trimmedName) {
      showToast.error('Page name cannot be empty');
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/api/pages/renamepage`,
        {
          pageId: pageId,
          newPageName: trimmedName,
        },
        { withCredentials: true }
      );

      if (res.status === 200) {
        showToast.success('Page renamed successfully!');

        setOwnedPages((prevPages) =>
          prevPages.map((page) =>
            String(page.id || page._id) === pageId
              ? { ...page, pageName: trimmedName, name: trimmedName }
              : page
          )
        );
      }
    } catch (err) {
      console.error('Failed to rename page:', err);
      showToast.error(err.response?.data?.resMessage?.message || 'Failed to rename page');
    } finally {
      setRenamingPageId(null);
      setNewPageName('');
    }
  };

  // Handler for key presses (Enter to save, Escape to cancel)
  const handleKeyPress = (e, pageId) => {
    if (e.key === 'Enter') {
      handleRenamePage(pageId);
    }
    if (e.key === 'Escape') {
      cancelRename();
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 280,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 280,
          boxSizing: 'border-box',
          top: { xs: 64, md: 72 },
          height: { xs: 'calc(100% - 64px)', md: 'calc(100% - 72px)' },
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(30,30,30,0.95) 0%, rgba(20,20,20,0.98) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(250,250,250,0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Your Pages Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
            >
              Your Pages
            </Typography>
            <Chip
              label={ownedPages.length}
              size="small"
              sx={{
                ml: 'auto',
                background: theme.palette.primary.main,
                color: 'white',
                fontSize: '0.75rem',
              }}
            />
          </Box>
          <Divider sx={{ mb: 2 }} />

          {/* Create New Page Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewPage}
            fullWidth
            sx={{
              mb: 2,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              py: 1,
              background: theme.palette.primary.main,
              color: 'white',
              '&:hover': {
                background: theme.palette.primary.dark,
                transform: 'translateY(-1px)',
                boxShadow: theme.shadows[4],
              },
              transition: 'all 0.2s ease',
            }}
          >
            Create New Page
          </Button>

          <List sx={{ py: 0 }}>
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
                </Box>
              ))
            ) : ownedPages.length === 0 ? (
              <Typography
                variant="body2"
                sx={{
                  pl: 2,
                  py: 1,
                  color: theme.palette.text.secondary,
                  fontStyle: 'italic',
                }}
              >
                No pages yet
              </Typography>
            ) : (
              ownedPages.map((page) => {
                const normalized = normalizePage(page);
                const isRenaming = normalized.id === renamingPageId;

                return (
                  <ListItemButton
                    key={normalized.id}
                    onClick={() => !isRenaming && onSelectPage(normalized)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: theme.palette.action.hover,
                        transform: 'translateX(4px)',
                      },
                      '&:hover .rename-icon': {
                        visibility: isRenaming ? 'hidden' : 'visible',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <PageIcon
                        sx={{
                          fontSize: 20,
                          color: theme.palette.primary.main,
                        }}
                      />
                    </ListItemIcon>

                    {isRenaming ? (
                      <>
                        <TextField
                          value={newPageName}
                          onChange={(e) => setNewPageName(e.target.value)}
                          onKeyDown={(e) => handleKeyPress(e, normalized.id)}
                          size="small"
                          variant="standard"
                          autoFocus
                          fullWidth
                          inputProps={{
                            style: { fontSize: '0.9rem', fontWeight: 500, padding: 0 },
                          }}
                          sx={{ mr: 1 }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenamePage(normalized.id);
                          }}
                          color="primary"
                          sx={{ p: 0.5 }}
                        >
                          <CheckIcon fontSize="inherit" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelRename();
                          }}
                          color="default"
                          sx={{ p: 0.5 }}
                        >
                          <CancelIcon fontSize="inherit" />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <ListItemText
                          primary={normalized.name}
                          primaryTypographyProps={{
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        />
                        {/* Edit button - only for owned pages */}
                        <IconButton
                          className="rename-icon"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent onSelectPage from firing
                            startRename(normalized);
                          }}
                          sx={{
                            visibility: 'hidden',
                            // Show on hover of ListItemButton
                            '*:hover > &': { visibility: 'visible' },
                            mr: -0.5, // Pull the icon closer to the edge
                            p: 0.5,
                          }}
                        >
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </>
                    )}
                  </ListItemButton>
                );
              })
            )}
          </List>
        </Box>

        {/* Shared Pages Section */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <SharedIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
            >
              Shared With You
            </Typography>
            <Chip
              label={sharedPages.length}
              size="small"
              sx={{
                ml: 'auto',
                background: theme.palette.secondary.main,
                color: 'white',
                fontSize: '0.75rem',
              }}
            />
          </Box>
          <Divider sx={{ mb: 2 }} />

          <List sx={{ py: 0 }}>
            {loading ? (
              Array.from({ length: 2 }).map((_, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
                </Box>
              ))
            ) : sharedPages.length === 0 ? (
              <Typography
                variant="body2"
                sx={{
                  pl: 2,
                  py: 1,
                  color: theme.palette.text.secondary,
                  fontStyle: 'italic',
                }}
              >
                No shared pages
              </Typography>
            ) : (
              sharedPages.map((page) => {
                const normalized = normalizePage(page);
                return (
                  <ListItemButton
                    key={normalized.id}
                    onClick={() => onSelectPage(normalized)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: theme.palette.action.hover,
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <SharedIcon
                        sx={{
                          fontSize: 20,
                          color: theme.palette.secondary.main,
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={normalized.name}
                      primaryTypographyProps={{
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    />
                  </ListItemButton>
                );
              })
            )}
          </List>
        </Box>
      </Box>
    </Drawer>
  );
}
