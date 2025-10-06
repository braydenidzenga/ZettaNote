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
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
  FormHelperText,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AdminPanelSettings,
  Security,
  Person,
  Email,
  Lock,
  Close,
  Refresh,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import AdminNavbar from '../components/AdminNavbar';
import { adminAuth } from '../utils/adminAuth';

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    permissions: [],
  });

  const [formErrors, setFormErrors] = useState({});

  const rolePermissions = {
    super_admin: [
      'read_users',
      'write_users',
      'delete_users',
      'ban_users',
      'read_pages',
      'delete_pages',
      'read_analytics',
      'manage_admins',
      'system_config',
    ],
    admin: [
      'read_users',
      'write_users',
      'ban_users',
      'read_pages',
      'delete_pages',
      'read_analytics',
    ],
    moderator: ['read_users', 'ban_users', 'read_pages', 'delete_pages'],
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data } = await adminAuth.apiRequest('/api/admin/admins');
      if (data.success) {
        setAdmins(data.admins);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!validateForm()) return;

    setActionLoading(true);
    try {
      const { data } = await adminAuth.apiRequest('/api/admin/create', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          permissions: rolePermissions[formData.role],
        }),
      });

      if (data.success) {
        setSuccess('Admin user created successfully!');
        setGeneratedPassword(data.defaultPassword);
        setShowPasswordDialog(true);
        setCreateDialogOpen(false);
        resetForm();
        fetchAdmins();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to create admin user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAdmin = async () => {
    if (!validateForm(true)) return;

    setActionLoading(true);
    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        permissions: rolePermissions[formData.role],
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const { data } = await adminAuth.apiRequest(`/api/admin/admins/${selectedAdmin._id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      if (data.success) {
        setSuccess('Admin user updated successfully!');
        setEditDialogOpen(false);
        resetForm();
        fetchAdmins();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to update admin user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin user?')) return;

    try {
      const { data } = await adminAuth.apiRequest(`/api/admin/admins/${adminId}`, {
        method: 'DELETE',
      });

      if (data.success) {
        setSuccess('Admin user deleted successfully!');
        fetchAdmins();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to delete admin user');
    }
  };

  const validateForm = (isEdit = false) => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    // For edit operations, password is optional (only if they want to change it)
    if (isEdit && formData.password && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!formData.role) {
      errors.role = 'Role is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'admin',
      permissions: [],
    });
    setFormErrors({});
    setSelectedAdmin(null);
  };

  const openEditDialog = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      role: admin.role,
      permissions: admin.permissions,
    });
    setEditDialogOpen(true);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin':
        return 'error';
      case 'admin':
        return 'warning';
      case 'moderator':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'moderator':
        return 'Moderator';
      default:
        return role;
    }
  };

  const currentAdmin = adminAuth.getAdminUser();
  const isSuperAdmin = currentAdmin?.role === 'super_admin';

  if (!isSuperAdmin) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <AdminNavbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">
            You don't have permission to access admin management. Super admin privileges required.
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <AdminNavbar />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#333' }}>
            Admin User Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <IconButton onClick={fetchAdmins} sx={{ bgcolor: 'white', boxShadow: 1 }}>
              <Refresh />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ fontWeight: 600 }}
            >
              Create Admin
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Admin Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                      {admins.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Admins
                    </Typography>
                  </Box>
                  <AdminPanelSettings sx={{ fontSize: 40, color: '#d32f2f' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                      {admins.filter((a) => a.role === 'super_admin').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Super Admins
                    </Typography>
                  </Box>
                  <Security sx={{ fontSize: 40, color: '#ff9800' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                      {admins.filter((a) => a.active).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Admins
                    </Typography>
                  </Box>
                  <Person sx={{ fontSize: 40, color: '#4caf50' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Admin Users Table */}
        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Admin Users
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Last Login</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin._id} hover>
                      <TableCell>{admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleLabel(admin.role)}
                          color={getRoleColor(admin.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={admin.active ? 'Active' : 'Inactive'}
                          color={admin.active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit Admin">
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(admin)}
                              disabled={admin._id === currentAdmin.id}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Admin">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteAdmin(admin._id)}
                              disabled={
                                admin._id === currentAdmin.id || admin.role === 'super_admin'
                              }
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {admins.length === 0 && !loading && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">No admin users found.</Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Create Admin Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            Create New Admin User
            <IconButton onClick={() => setCreateDialogOpen(false)}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              <TextField
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={!!formErrors.name}
                helperText={formErrors.name}
                fullWidth
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />

              <TextField
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={!!formErrors.email}
                helperText={formErrors.email}
                fullWidth
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />

              <Alert severity="info" sx={{ my: 2 }}>
                A secure password will be automatically generated for this admin account. They will
                be required to change it on their first login.
              </Alert>

              <FormControl fullWidth error={!!formErrors.role}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <MenuItem value="moderator">Moderator</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="super_admin">Super Admin</MenuItem>
                </Select>
                {formErrors.role && <FormHelperText>{formErrors.role}</FormHelperText>}
              </FormControl>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Permissions for {getRoleLabel(formData.role)}:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {rolePermissions[formData.role]?.map((permission) => (
                    <Chip
                      key={permission}
                      label={permission.replace(/_/g, ' ')}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <LoadingButton variant="contained" onClick={handleCreateAdmin} loading={actionLoading}>
              Create Admin
            </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Edit Admin Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            Edit Admin User
            <IconButton onClick={() => setEditDialogOpen(false)}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              <TextField
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={!!formErrors.name}
                helperText={formErrors.name}
                fullWidth
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />

              <TextField
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={!!formErrors.email}
                helperText={formErrors.email}
                fullWidth
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />

              <TextField
                label="New Password (optional)"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={!!formErrors.password}
                helperText={formErrors.password || 'Leave empty to keep current password'}
                fullWidth
                InputProps={{
                  startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />

              <FormControl fullWidth error={!!formErrors.role}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <MenuItem value="moderator">Moderator</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="super_admin">Super Admin</MenuItem>
                </Select>
                {formErrors.role && <FormHelperText>{formErrors.role}</FormHelperText>}
              </FormControl>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Permissions for {getRoleLabel(formData.role)}:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {rolePermissions[formData.role]?.map((permission) => (
                    <Chip
                      key={permission}
                      label={permission.replace(/_/g, ' ')}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <LoadingButton variant="contained" onClick={handleUpdateAdmin} loading={actionLoading}>
              Update Admin
            </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Generated Password Dialog */}
        <Dialog
          open={showPasswordDialog}
          onClose={() => setShowPasswordDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security color="success" />
              Admin Account Created Successfully
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="success" sx={{ mb: 2 }}>
              The admin account has been created with the following temporary password:
            </Alert>

            <Paper
              sx={{
                p: 2,
                bgcolor: '#f5f5f5',
                border: '2px solid #4caf50',
                fontFamily: 'monospace',
                fontSize: '1.2rem',
                textAlign: 'center',
                letterSpacing: '0.1em',
              }}
            >
              {generatedPassword}
            </Paper>

            <Alert severity="warning" sx={{ mt: 2 }}>
              <strong>Important:</strong> Please share this password securely with the new admin.
              They will be required to change it on their first login for security purposes.
            </Alert>

            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              📋 Click to copy the password to clipboard, then share it through a secure channel.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(generatedPassword);
                // You could add a toast notification here
              }}
              variant="outlined"
            >
              Copy Password
            </Button>
            <Button
              onClick={() => setShowPasswordDialog(false)}
              variant="contained"
              color="primary"
            >
              Done
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
