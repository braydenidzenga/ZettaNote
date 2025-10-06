import React, { useState } from 'react';
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  Typography,
  Box,
  useTheme,
  Tooltip,
  Button,
  Tabs,
  Tab,
  InputAdornment,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import EmailIcon from '@mui/icons-material/Email';
import axios from 'axios';
import { API_URL } from '../../config';
import { showToast } from '../../utils/toast';

function SharePageButton({ pageId }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [giveWrite, setGiveWrite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [publicLink, setPublicLink] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();

  const handleOpen = () => {
    setOpen(true);
    setEmail('');
    setGiveWrite(false);
    setPublicLink('');
    setTabValue(0);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleShareEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    const loadingToast = showToast.loading('Sharing page...');

    try {
      await axios.post(
        `${API_URL}/api/pages/sharepage`,
        {
          pageId,
          userEmail: email,
          giveWritePermission: giveWrite,
        },
        {
          withCredentials: true,
        }
      );

      showToast.dismiss(loadingToast);
      showToast.success(`Page shared with ${email} successfully!`);
      setEmail('');
      setGiveWrite(false);
    } catch (err) {
      showToast.dismiss(loadingToast);
      const errorMessage = err.response?.data?.message || 'Failed to share page';
      showToast.error(errorMessage);
    }
    setLoading(false);
  };

  const handleGeneratePublicLink = async () => {
    setLoading(true);
    const loadingToast = showToast.loading('Generating public link...');

    try {
      const res = await axios.post(
        `${API_URL}/api/pages/publicshare`,
        {
          pageId,
        },
        {
          withCredentials: true,
        }
      );

      showToast.dismiss(loadingToast);

      if (res.data.publicShareId) {
        const link = `${window.location.origin}/share/${res.data.publicShareId}`;
        setPublicLink(link);
        showToast.success('Public link generated!');
      } else {
        showToast.error(res.data.message || 'Failed to generate public link');
      }
    } catch (err) {
      showToast.dismiss(loadingToast);
      const errorMessage =
        err.response?.data?.message || 'Error generating public link. Please try again.';
      showToast.error(errorMessage);
    }
    setLoading(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      showToast.success('Link copied to clipboard!');
    } catch {
      showToast.error('Failed to copy link to clipboard');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <>
      <Tooltip title="Share Page" arrow>
        <IconButton
          color="secondary"
          onClick={handleOpen}
          sx={{
            '&:hover': {
              transform: 'scale(1.1)',
              transition: 'transform 0.2s ease',
            },
          }}
        >
          <ShareIcon />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShareIcon sx={{ color: theme.palette.secondary.main }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Share Page
            </Typography>
          </Box>
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<EmailIcon />} label="Share with User" />
            <Tab icon={<LinkIcon />} label="Public Link" />
          </Tabs>
        </Box>

        <DialogContent sx={{ pb: 2 }}>
          {tabValue === 0 && (
            <Box component="form" onSubmit={handleShareEmail}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Share this page with another user by entering their email address.
              </Typography>

              <TextField
                label="User Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                margin="normal"
                placeholder="colleague@example.com"
              />

              <FormControlLabel
                control={
                  <Checkbox checked={giveWrite} onChange={(e) => setGiveWrite(e.target.checked)} />
                }
                label="Give edit permission"
                sx={{ mt: 2 }}
              />
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Generate a public link that anyone can use to view this page.
              </Typography>

              {!publicLink ? (
                <LoadingButton
                  variant="contained"
                  startIcon={<LinkIcon />}
                  onClick={handleGeneratePublicLink}
                  loading={loading}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  Generate Public Link
                </LoadingButton>
              ) : (
                <Box>
                  <TextField
                    label="Public Link"
                    value={publicLink}
                    fullWidth
                    margin="normal"
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Copy Link">
                            <IconButton onClick={handleCopyLink} edge="end">
                              <ContentCopyIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<ContentCopyIcon />}
                      onClick={handleCopyLink}
                      sx={{ flex: 1 }}
                    >
                      Copy Link
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<LinkIcon />}
                      onClick={handleGeneratePublicLink}
                      disabled={loading}
                      sx={{ flex: 1 }}
                    >
                      Regenerate
                    </Button>
                  </Box>
                </Box>
              )}

              <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 2 }}>
                ⚠️ Anyone with this link can view your page
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>

          {tabValue === 0 && (
            <LoadingButton variant="contained" loading={loading} onClick={handleShareEmail}>
              Share Page
            </LoadingButton>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

export default SharePageButton;
