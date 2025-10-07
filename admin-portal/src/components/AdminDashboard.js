import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  People,
  PersonOff,
  TrendingUp,
  Description,
  Search,
  Block,
  CheckCircle,
  Refresh,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import AdminNavbar from '../components/AdminNavbar';
import { adminAuth } from '../utils/adminAuth';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchAnalytics(), fetchUsers()]);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data } = await adminAuth.apiRequest('/api/admin/analytics');
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load analytics');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await adminAuth.apiRequest('/api/admin/users?limit=10');
      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load users');
    }
  };

  const handleBanUser = async (userId, currentlyBanned) => {
    if (!adminAuth.hasPermission('ban_users')) {
      setError('You do not have permission to ban users');
      return;
    }

    setActionLoading((prev) => ({ ...prev, [userId]: true }));

    try {
      const endpoint = currentlyBanned ? 'unban' : 'ban';
      const { data } = await adminAuth.apiRequest(`/api/admin/users/${userId}/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Admin action from dashboard' }),
      });

      if (data.success) {
        // Update user in local state
        setUsers((prev) =>
          prev.map((user) => (user._id === userId ? { ...user, banned: !currentlyBanned } : user))
        );
        // Refresh analytics to update counts
        fetchAnalytics();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(`Failed to ${currentlyBanned ? 'unban' : 'ban'} user`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <AdminNavbar />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#333' }}>
            Admin Dashboard
          </Typography>
          <IconButton onClick={fetchData} sx={{ bgcolor: 'white', boxShadow: 1 }}>
            <Refresh />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Analytics Cards */}
        {analytics && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                        {analytics.users.total.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Users
                      </Typography>
                    </Box>
                    <People sx={{ fontSize: 40, color: '#1976d2' }} />
                  </Box>
                  <Typography variant="caption" sx={{ color: 'green' }}>
                    +{analytics.users.newLast30Days} this month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                        {analytics.users.active.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Users
                      </Typography>
                    </Box>
                    <TrendingUp sx={{ fontSize: 40, color: '#4caf50' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#f44336' }}>
                        {analytics.users.banned.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Banned Users
                      </Typography>
                    </Box>
                    <PersonOff sx={{ fontSize: 40, color: '#f44336' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                        {analytics.pages.total.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Pages
                      </Typography>
                    </Box>
                    <Description sx={{ fontSize: 40, color: '#ff9800' }} />
                  </Box>
                  <Typography variant="caption" sx={{ color: 'green' }}>
                    +{analytics.pages.newLast30Days} this month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Charts */}
        {analytics && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    User Registration Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analytics.users.registrationTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#1976d2" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Page Creation Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analytics.pages.creationTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#ff9800" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Recent Users Table */}
        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent Users
              </Typography>
              <TextField
                size="small"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 300 }}
              />
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                    {adminAuth.hasPermission('ban_users') && (
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user._id} hover>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.banned ? 'Banned' : 'Active'}
                          color={user.banned ? 'error' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      {adminAuth.hasPermission('ban_users') && (
                        <TableCell>
                          <Button
                            size="small"
                            variant={user.banned ? 'contained' : 'outlined'}
                            color={user.banned ? 'success' : 'error'}
                            startIcon={user.banned ? <CheckCircle /> : <Block />}
                            onClick={() => handleBanUser(user._id, user.banned)}
                            disabled={actionLoading[user._id]}
                            sx={{ minWidth: 100 }}
                          >
                            {actionLoading[user._id] ? (
                              <CircularProgress size={16} />
                            ) : user.banned ? (
                              'Unban'
                            ) : (
                              'Ban'
                            )}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredUsers.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
