import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button } from '@mui/material';
import Skeleton from 'react-loading-skeleton';
import ReactMarkdown from 'react-markdown';
import { API_URL } from '../config';

function PublicShare() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSharedPage = async () => {
      if (!shareId) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/pages/share/${shareId}`);
        const data = await response.json();

        if (response.ok) {
          setPageData(data);
        } else {
          setError(data.Error || data.message || 'Failed to load shared page');
        }
      } catch (err) {
        console.error('Error fetching shared page:', err);
        setError('Failed to load shared page');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedPage();
  }, [shareId]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <div style={{ marginBottom: 8 }}>
            <Skeleton width={240} height={40} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Skeleton width={320} height={24} />
          </div>
          <Skeleton height={400} borderRadius={8} />
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom color="error">
            Error
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Go to Home
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          {pageData?.title || 'Shared Page'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          This page has been shared with you
        </Typography>
        <Box
          sx={{
            p: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            minHeight: 400,
            backgroundColor: 'background.paper',
            fontFamily: 'inherit',
            lineHeight: 1.7,
            '& h1': {
              fontSize: '2rem',
              fontWeight: 600,
              marginTop: 3,
              marginBottom: 2,
              color: 'text.primary',
            },
            '& h2': {
              fontSize: '1.5rem',
              fontWeight: 600,
              marginTop: 2.5,
              marginBottom: 1.5,
              color: 'text.primary',
            },
            '& h3': {
              fontSize: '1.25rem',
              fontWeight: 600,
              marginTop: 2,
              marginBottom: 1,
              color: 'text.primary',
            },
            '& h4, & h5, & h6': {
              fontSize: '1.1rem',
              fontWeight: 600,
              marginTop: 1.5,
              marginBottom: 1,
              color: 'text.primary',
            },
            '& p': {
              marginBottom: 1.5,
              color: 'text.primary',
            },
            '& pre': {
              backgroundColor: 'grey.100',
              padding: 2,
              borderRadius: 1,
              overflow: 'auto',
              border: '1px solid',
              borderColor: 'grey.300',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            },
            '& code': {
              backgroundColor: 'grey.100',
              padding: '2px 6px',
              borderRadius: 1,
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              color: 'error.main',
            },
            '& blockquote': {
              borderLeft: '4px solid',
              borderColor: 'primary.main',
              paddingLeft: 2,
              marginLeft: 0,
              marginY: 2,
              fontStyle: 'italic',
              backgroundColor: 'grey.50',
              padding: 2,
              borderRadius: 1,
            },
            '& ul, & ol': {
              paddingLeft: 3,
              marginBottom: 1.5,
              '& li': {
                marginBottom: 0.5,
              },
            },
            '& a': {
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            '& strong': {
              fontWeight: 600,
              color: 'text.primary',
            },
            '& em': {
              fontStyle: 'italic',
            },
            '& hr': {
              marginY: 3,
              borderColor: 'divider',
            },
          }}
        >
          <ReactMarkdown>{pageData?.content || 'No content available'}</ReactMarkdown>
        </Box>
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button variant="contained" onClick={() => navigate('/')}>
            Try ZettaNote
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default PublicShare;
