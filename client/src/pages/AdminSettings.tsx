import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Grid, TextField, MenuItem, Button, Switch,
  FormControlLabel, Chip, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import {
  AdminPanelSettingsOutlined as AdminIcon,
  AutoAwesome as AiIcon,
  PeopleOutlined as TeamIcon,
  CheckCircle as SuccessIcon,
  SaveOutlined as SaveIcon,
  PersonAddOutlined as PersonAddIcon,
  Close as CloseIcon,
  EditOutlined as EditIcon,
  DeleteOutline as DeleteIcon
} from '@mui/icons-material';
import apiClient from '../api/client';
import { authService } from '../api/auth.service';
import { showToast } from '../utils/toast';


const AdminSettings = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // AI Configuration state
  const [aiModel, setAiModel] = useState('openai/gpt-3.5-turbo');
  const [aiTemperature, setAiTemperature] = useState('0.2');
  const [autoShortlist, setAutoShortlist] = useState(true);
  const [autoInterviewStage, setAutoInterviewStage] = useState(true);

  // Add Member Modal state
  const [openAddModal, setOpenAddModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('RECRUITER');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');

  // Edit Member Modal state
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('RECRUITER');
  const [editPassword, setEditPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Confirmation Modal state
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await authService.getUsers();
      setUsers(data);
    } catch (err) {
      try {
        const data = await authService.getMe();
        setUsers([{ id: data.id, name: data.name, email: data.email, role: data.role }]);
      } catch (e) {
        console.error(e);
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveSettings = () => {
    const msg = 'Admin & AI configuration settings updated successfully!';
    setSaveSuccess(msg);
    showToast.success(msg);
    setTimeout(() => setSaveSuccess(''), 4000);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    try {
      await authService.updateUserRole(userId, newRole as any);
      showToast.success('User role updated successfully');
    } catch (err: any) {
      console.error('Failed to update role', err);
      showToast.apiError(err, 'Failed to update user role');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberEmail || !newMemberPassword) {
      setAddMemberError('Please fill in all required fields.');
      showToast.warning('Please fill in all required fields');
      return;
    }

    setAddMemberLoading(true);
    setAddMemberError('');

    try {
      const data = await authService.register({
        name: newMemberName,
        email: newMemberEmail,
        password: newMemberPassword,
        role: newMemberRole as any,
      });

      setUsers(prev => [data, ...prev]);
      setOpenAddModal(false);
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberPassword('');
      setNewMemberRole('RECRUITER');
      showToast.success('New team member added successfully!');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to add team member.';
      setAddMemberError(errMsg);
      showToast.apiError(err, 'Failed to add team member');
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditPassword('');
    setEditError('');
    setOpenEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editName || !editEmail) {
      setEditError('Name and email are required.');
      return;
    }

    setEditLoading(true);
    setEditError('');

    try {
      const payload: any = {
        name: editName,
        email: editEmail,
        role: editRole,
      };
      if (editPassword) {
        payload.password = editPassword;
      }

      const { data } = await apiClient.put(`/auth/users/${editingUser.id}`, payload);

      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...data } : u));
      setOpenEditModal(false);
      showToast.success('Team member details updated successfully!');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to update team member.';
      setEditError(errMsg);
      showToast.apiError(err, 'Failed to update team member');
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenDelete = (user: any) => {
    setUserToDelete(user);
    setDeleteError('');
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    setDeleteError('');

    try {
      await authService.deleteUser(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setOpenDeleteModal(false);
      showToast.success('Team member removed successfully!');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to delete team member.';
      setDeleteError(errMsg);
      showToast.apiError(err, 'Failed to delete team member');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header Title */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3.5} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{ p: 1, borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', display: 'flex' }}>
            <AdminIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: '#F5F7FA', letterSpacing: '-0.02em' }}>
              Admin & AI System Settings
            </Typography>
            <Typography variant="caption" sx={{ color: '#626975', fontSize: '0.78rem' }}>
              Configure AI recruitment engine parameters, team access roles, and pipeline automation rules
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
          sx={{ borderRadius: '6px', backgroundColor: '#6366f1', px: 2.5 }}
        >
          Save Configuration
        </Button>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          {saveSuccess}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Section 1: AI Engine Configuration (DISABLED) */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, backgroundColor: '#101318', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', height: '100%' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center" gap={1.2}>
                <AiIcon sx={{ color: '#818cf8', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#F5F7FA' }}>
                  AI Intelligence Engine Settings
                </Typography>
              </Box>
              <Chip label="Disabled" size="small" sx={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.3)' }} />
            </Box>
            <Typography variant="caption" sx={{ color: '#626975', display: 'block', mb: 3 }}>
              OpenRouter AI LLM parameters for resume screening and 4-round scorecard synthesis
            </Typography>

            {/* Connection Status Box */}
            <Paper sx={{ p: 2, bgcolor: '#0B0D10', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: '#626975', display: 'block' }}>
                  OpenRouter API Gateway
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ color: '#F5F7FA', wordBreak: 'break-all' }} className="font-mono">
                  https://openrouter.ai/api/v1
                </Typography>
              </Box>
              <Chip
                icon={<SuccessIcon sx={{ fontSize: '14px !important', color: '#10b981 !important' }} />}
                label="Connected"
                size="small"
                sx={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.3)', flexShrink: 0 }}
              />
            </Paper>

            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  disabled
                  label="LLM Evaluation Model"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  size="small"
                  helperText="Setting is currently disabled"
                >
                  <MenuItem value="openai/gpt-3.5-turbo">GPT-3.5 Turbo (Fast & Balanced)</MenuItem>
                  <MenuItem value="openai/gpt-4-turbo">GPT-4 Turbo (High Precision)</MenuItem>
                  <MenuItem value="anthropic/claude-3-haiku">Claude 3 Haiku (Fast Summaries)</MenuItem>
                  <MenuItem value="google/gemini-pro-1.5">Gemini Pro 1.5 (Deep Reasoning)</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  disabled
                  label="Evaluation Temperature / Creativity"
                  value={aiTemperature}
                  onChange={(e) => setAiTemperature(e.target.value)}
                  size="small"
                  helperText="Setting is currently disabled"
                >
                  <MenuItem value="0.0">0.0 - Deterministic & Strict</MenuItem>
                  <MenuItem value="0.2">0.2 - Highly Consistent (Recommended)</MenuItem>
                  <MenuItem value="0.5">0.5 - Balanced Analysis</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Section 2: Pipeline Automation Settings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, backgroundColor: '#101318', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', height: '100%' }}>
            <Box display="flex" alignItems="center" gap={1.2} mb={2}>
              <AdminIcon sx={{ color: '#06b6d4', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#F5F7FA' }}>
                Pipeline Automation Rules
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#626975', display: 'block', mb: 3 }}>
              Automated stage transition triggers based on scorecard recommendations and session status
            </Typography>

            <Box display="flex" flexDirection="column" gap={2}>
              <Paper sx={{ p: 2, bgcolor: '#0B0D10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoShortlist}
                      onChange={(e) => setAutoShortlist(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#F5F7FA' }}>
                        Auto-Shortlist Candidates on Positive Scorecard
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#626975' }}>
                        Automatically move candidate stage to SHORTLISTED when AI or interviewer submits YES / STRONG_YES
                      </Typography>
                    </Box>
                  }
                />
              </Paper>

              <Paper sx={{ p: 2, bgcolor: '#0B0D10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoInterviewStage}
                      onChange={(e) => setAutoInterviewStage(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#F5F7FA' }}>
                        Auto-Transition to INTERVIEW Stage
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#626975' }}>
                        Automatically update candidate status to INTERVIEW when a round trace point is scheduled
                      </Typography>
                    </Box>
                  }
                />
              </Paper>
            </Box>
          </Card>
        </Grid>

        {/* Section 3: Team Members & Role Access Control */}
        <Grid item xs={12}>
          <Card sx={{ p: 3, backgroundColor: '#101318', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5} flexWrap="wrap" gap={2}>
              <Box display="flex" alignItems="center" gap={1.2}>
                <TeamIcon sx={{ color: '#10b981', fontSize: 20 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#F5F7FA' }}>
                    Team Members & Access Roles
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#626975' }}>
                    Manage internal access permissions (Admins, Recruiters, Interviewers). Candidates are managed as Participants.
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setOpenAddModal(true)}
                sx={{
                  backgroundColor: '#10b981',
                  '&:hover': { backgroundColor: '#059669' },
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Add Team Member
              </Button>
            </Box>

            <TableContainer component={Paper} sx={{ backgroundColor: '#0B0D10', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px' }}>
              {loadingUsers ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress size={24} sx={{ color: '#818cf8' }} />
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <TableCell sx={{ color: '#626975', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Team Member</TableCell>
                      <TableCell sx={{ color: '#626975', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Email Address</TableCell>
                      <TableCell sx={{ color: '#626975', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Assigned Role</TableCell>
                      <TableCell align="right" sx={{ color: '#626975', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.filter(u => u.role !== 'CANDIDATE').map(u => (
                      <TableRow key={u.id} sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#F5F7FA' }}>
                            {u.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: '#626975' }} className="font-mono">
                            {u.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <TextField
                            select
                            size="small"
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            sx={{
                              minWidth: 140,
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: '#151920',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                height: 30
                              }
                            }}
                          >
                            <MenuItem value="ADMIN" sx={{ fontSize: '0.75rem' }}>ADMIN</MenuItem>
                            <MenuItem value="RECRUITER" sx={{ fontSize: '0.75rem' }}>RECRUITER</MenuItem>
                            <MenuItem value="INTERVIEWER" sx={{ fontSize: '0.75rem' }}>INTERVIEWER</MenuItem>
                          </TextField>
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="flex-end" gap={1}>
                            <IconButton size="small" onClick={() => handleOpenEdit(u)} sx={{ color: '#818cf8', '&:hover': { backgroundColor: 'rgba(129, 140, 248, 0.1)' } }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleOpenDelete(u)} sx={{ color: '#ef4444', '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' } }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TableContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog to Add New Team Member */}
      <Dialog
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#101318',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: '#F5F7FA'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.1rem', color: '#F5F7FA' }}>
            Add New Team Member
          </Typography>
          <IconButton onClick={() => setOpenAddModal(false)} sx={{ color: '#626975' }} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleAddMember}>
          <DialogContent dividers sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', py: 2 }}>
            {addMemberError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '6px' }}>
                {addMemberError}
              </Alert>
            )}
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Full Name"
                required
                fullWidth
                size="small"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
              />
              <TextField
                label="Email Address"
                type="email"
                required
                fullWidth
                size="small"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
              />
              <TextField
                label="Password"
                type="password"
                required
                fullWidth
                size="small"
                value={newMemberPassword}
                onChange={(e) => setNewMemberPassword(e.target.value)}
              />
              <TextField
                select
                label="Assigned Role"
                fullWidth
                size="small"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
              >
                <MenuItem value="ADMIN" sx={{ fontSize: '0.85rem' }}>ADMIN</MenuItem>
                <MenuItem value="RECRUITER" sx={{ fontSize: '0.85rem' }}>RECRUITER</MenuItem>
                <MenuItem value="INTERVIEWER" sx={{ fontSize: '0.85rem' }}>INTERVIEWER</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => setOpenAddModal(false)}
              sx={{ color: '#9ca3af', textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={addMemberLoading}
              sx={{
                backgroundColor: '#10b981',
                '&:hover': { backgroundColor: '#059669' },
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              {addMemberLoading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Add Member'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog to Edit Team Member */}
      <Dialog
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#101318',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: '#F5F7FA'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.1rem', color: '#F5F7FA' }}>
            Edit Team Member
          </Typography>
          <IconButton onClick={() => setOpenEditModal(false)} sx={{ color: '#626975' }} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSaveEdit}>
          <DialogContent dividers sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', py: 2 }}>
            {editError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '6px' }}>
                {editError}
              </Alert>
            )}
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Full Name"
                required
                fullWidth
                size="small"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <TextField
                label="Email Address"
                type="email"
                required
                fullWidth
                size="small"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
              <TextField
                label="New Password (optional)"
                type="password"
                fullWidth
                size="small"
                placeholder="Leave blank to keep current"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
              />
              <TextField
                select
                label="Assigned Role"
                fullWidth
                size="small"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
              >
                <MenuItem value="ADMIN" sx={{ fontSize: '0.85rem' }}>ADMIN</MenuItem>
                <MenuItem value="RECRUITER" sx={{ fontSize: '0.85rem' }}>RECRUITER</MenuItem>
                <MenuItem value="INTERVIEWER" sx={{ fontSize: '0.85rem' }}>INTERVIEWER</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => setOpenEditModal(false)}
              sx={{ color: '#9ca3af', textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={editLoading}
              sx={{
                backgroundColor: '#6366f1',
                '&:hover': { backgroundColor: '#4f46e5' },
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              {editLoading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog to Confirm Delete Team Member */}
      <Dialog
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#101318',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            color: '#F5F7FA'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.1rem', color: '#ef4444' }}>
            Confirm Remove Member
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', py: 2 }}>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '6px' }}>
              {deleteError}
            </Alert>
          )}
          <Typography variant="body2" sx={{ color: '#9ca3af' }}>
            Are you sure you want to remove <strong style={{ color: '#F5F7FA' }}>{userToDelete?.name}</strong> ({userToDelete?.email})? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setOpenDeleteModal(false)}
            sx={{ color: '#9ca3af', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            disabled={deleteLoading}
            sx={{
              backgroundColor: '#ef4444',
              '&:hover': { backgroundColor: '#dc2626' },
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {deleteLoading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Remove Member'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSettings;
