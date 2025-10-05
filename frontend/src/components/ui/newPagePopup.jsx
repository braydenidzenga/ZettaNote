import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useNavigate } from 'react-router-dom';
import { Add as AddIcon } from '@mui/icons-material';

import { API_URL } from '../../config';
import { showToast } from '../../utils/toast';

export default function NewPagePopup({ open, onClose, onPageCreated }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = () => {
    if (!name.trim()) {
      showToast.error('Please enter a page name');
      return;
    }
    handleCreatePage(name);
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  const handleCreatePage = async (name) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const loadingToast = showToast.loading('Creating page...');

    try {
      const res = await fetch(API_URL + '/api/pages/createpage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageName: name,
          token: token,
        }),
      });

      showToast.dismiss(loadingToast);

      if (res.ok) {
        showToast.success(`Page "${name}" created successfully!`);
        setName('');
        onClose();
        if (onPageCreated) onPageCreated();
      } else {
        const data = await res.json();
        showToast.error(data.message || 'Failed to create page');
        navigate('/');
      }
    } catch (error) {
      showToast.dismiss(loadingToast);
      showToast.error('Failed to create page. Please try again.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background:
            theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon sx={{ color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Create New Page
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pb: 2 }}>
        <Typography
          variant="body2"
          sx={{
            mb: 3,
            color: theme.palette.text.secondary,
          }}
        >
          Give your new page a memorable name to get started.
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label="Page name"
          type="text"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSubmit();
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
          placeholder="e.g., Meeting Notes, Project Ideas..."
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleClose}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
          }}
        >
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSubmit}
          loading={loading}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
            fontWeight: 600,
          }}
        >
          Create Page
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
