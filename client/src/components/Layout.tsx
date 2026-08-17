import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, IconButton,
  ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Menu, MenuItem, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, InputBase
} from '@mui/material';
import {
  SpaceDashboardOutlined as DashboardIcon,
  WorkOutline as WorkIcon,
  GroupsOutlined as ParticipantsIcon,
  AdminPanelSettingsOutlined as SettingsIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  WarningAmberOutlined as WarningIcon,
  PersonOutlined as PersonIcon,
  TimelineOutlined as PipelineIcon,
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { candidateService } from '../api/candidate.service';
import { jobService } from '../api/job.service';

const drawerWidth = 220;

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Command Palette Search State
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [allCandidates, setAllCandidates] = useState<any[]>([]);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleOpenLogout = () => {
    setAnchorEl(null);
    setLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    setLogoutModalOpen(false);
    logout();
    navigate('/login');
  };

  // Keyboard shortcut listener for ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch search items when search modal opens
  useEffect(() => {
    if (searchModalOpen && allJobs.length === 0 && allCandidates.length === 0) {
      Promise.all([
        jobService.getJobs().catch(() => ({ data: [] })),
        candidateService.getCandidates().catch(() => ({ data: [] })),
      ]).then(([jobsRes, candidatesRes]) => {
        const jobs = Array.isArray(jobsRes) ? jobsRes : (jobsRes as any)?.data || [];
        const candidates = Array.isArray(candidatesRes) ? candidatesRes : (candidatesRes as any)?.data || [];
        setAllJobs(jobs);
        setAllCandidates(candidates);
      });
    }
  }, [searchModalOpen, allJobs.length, allCandidates.length]);

  const filteredJobs = allJobs.filter((job) =>
    job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCandidates = allCandidates.filter((cand) =>
    cand.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cand.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cand.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cand.skills?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectSearchResult = (path: string) => {
    setSearchModalOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  const candidateMenuItems = [
    { text: 'My Profile & Resume', icon: <PersonIcon sx={{ fontSize: 20 }} />, path: '/candidate-portal/profile', roles: ['CANDIDATE'] },
    { text: 'AI Job Matcher & Open Jobs', icon: <WorkIcon sx={{ fontSize: 20 }} />, path: '/candidate-portal/jobs', roles: ['CANDIDATE'] },
    { text: 'My Applications & Interviews', icon: <PipelineIcon sx={{ fontSize: 20 }} />, path: '/candidate-portal/applications', roles: ['CANDIDATE'] },
  ];

  const staffMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: 20 }} />, path: '/dashboard', roles: ['ADMIN', 'RECRUITER', 'INTERVIEWER'] },
    { text: 'Job Openings', icon: <WorkIcon sx={{ fontSize: 20 }} />, path: '/jobs', roles: ['ADMIN', 'RECRUITER'] },
    { text: 'All Participants', icon: <ParticipantsIcon sx={{ fontSize: 20 }} />, path: '/candidates', roles: ['ADMIN', 'RECRUITER', 'INTERVIEWER'] },
    { text: 'Admin Settings', icon: <SettingsIcon sx={{ fontSize: 20 }} />, path: '/admin-settings', roles: ['ADMIN'] },
  ];

  const activeMenuItems = user?.role === 'CANDIDATE' ? candidateMenuItems : staffMenuItems;

  const getPageTitle = () => {
    if (location.pathname.startsWith('/candidate-portal/profile')) return 'My Candidate Profile & Resume';
    if (location.pathname.startsWith('/candidate-portal/jobs')) return 'AI Job Recommendation Engine';
    if (location.pathname.startsWith('/candidate-portal/applications')) return 'My Applications & Scheduled Interviews';
    if (location.pathname.startsWith('/jobs/create')) return 'Create Job Opening';
    if (location.pathname.startsWith('/jobs/')) return 'Job Details';
    if (location.pathname === '/jobs') return 'Job Openings';
    if (location.pathname === '/candidates') return 'All Participants Directory';
    if (location.pathname.startsWith('/candidates/')) return 'Candidate Operating System';
    if (location.pathname === '/admin-settings') return 'Admin & AI Settings';
    return 'Recruitment Intelligence Dashboard';
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0B0D10' }}>
      {/* Brand Header */}
      <Box sx={{ height: '60px', minHeight: '60px', px: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', boxSizing: 'border-box' }}>
        <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#F5F7FA', letterSpacing: '-0.02em', fontSize: '0.95rem' }}>
          {user?.role === 'CANDIDATE' && 'Candidate Portal'}
          {user?.role === 'RECRUITER' && 'Recruiter Portal'}
          {user?.role === 'INTERVIEWER' && 'Interviewer Portal'}
          {user?.role === 'ADMIN' && 'Admin Console'}
          {!user?.role && 'HireFlow'}
        </Typography>
      </Box>

      {/* Navigation Links */}
      <Box sx={{ flexGrow: 1, py: 2, px: 1 }}>
        <Typography variant="caption" sx={{ px: 2, color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.68rem', display: 'block', mb: 1 }}>
          {user?.role === 'CANDIDATE' ? 'Candidate Navigation' : 'Workspace'}
        </Typography>
        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {activeMenuItems
            .filter(item => user && item.roles.includes(user.role))
            .map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: '6px',
                      py: 1,
                      px: 2,
                      minHeight: 38,
                      position: 'relative',
                      backgroundColor: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                      color: isActive ? '#F5F7FA' : '#969DAA',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        color: '#F5F7FA',
                        '& .MuiListItemIcon-root': { color: '#818cf8' },
                      },
                      '&::before': isActive ? {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 6,
                        bottom: 6,
                        width: 3,
                        borderRadius: '0 2px 2px 0',
                        backgroundColor: '#6366f1',
                      } : {},
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: isActive ? '#818cf8' : '#626975', transition: 'color 180ms ease' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 600 : 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
        </List>
      </Box>

      {/* User Info Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={1.5} sx={{ overflow: 'hidden' }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(129, 140, 248, 0.3)' }}>
            {user?.name?.charAt(0)}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" noWrap fontWeight={600} sx={{ color: '#F5F7FA', fontSize: '0.82rem' }}>
              {user?.name}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: '#626975', fontSize: '0.7rem', display: 'block' }}>
              {user?.role}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={handleOpenLogout} sx={{ color: '#626975', '&:hover': { color: '#f43f5e' } }}>
          <LogoutIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#07080A' }}>
      {/* Top Header */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: '#07080A',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'none !important',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '60px !important', px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ display: { sm: 'none' }, color: '#969DAA' }}>
              <MenuIcon />
            </IconButton>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              noWrap
              sx={{
                color: '#F5F7FA',
                fontSize: { xs: '0.85rem', sm: '0.95rem' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: { xs: '180px', sm: '350px', md: 'none' }
              }}
            >
              {getPageTitle()}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Functional Quick Command Palette Button */}
            <Box
              onClick={() => setSearchModalOpen(true)}
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 1.2,
                backgroundColor: '#0B0D10',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                px: 1.8,
                py: 0.7,
                cursor: 'pointer',
                color: '#969DAA',
                transition: 'all 180ms ease',
                '&:hover': { borderColor: '#6366f1', color: '#F5F7FA', backgroundColor: 'rgba(99, 102, 241, 0.04)' }
              }}
            >
              <SearchIcon sx={{ fontSize: 16, color: '#818cf8' }} />
              <Typography variant="caption" sx={{ fontSize: '0.78rem', fontWeight: 500 }}>
                Search candidates or jobs...
              </Typography>
              <Chip label="⌘K" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#151920', color: '#818cf8', border: '1px solid rgba(129, 140, 248, 0.3)' }} />
            </Box>

            {/* User Profile Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={user?.role}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  backgroundColor: user?.role === 'ADMIN' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: user?.role === 'ADMIN' ? '#818cf8' : '#969DAA',
                  border: user?.role === 'ADMIN' ? '1px solid rgba(129, 140, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)'
                }}
              />
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ p: 0.5 }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: '#151920', color: '#F5F7FA', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {user?.name?.charAt(0)}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                elevation={0}
                sx={{ mt: 1 }}
              >
                <MenuItem onClick={handleOpenLogout} sx={{ fontSize: '0.85rem', color: '#f43f5e' }}>
                  <LogoutIcon sx={{ fontSize: 16, mr: 1.5 }} />
                  Sign Out
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: '#0B0D10',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Workspace Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2.5, md: 4 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: 'calc(100vh - 60px)',
          backgroundColor: '#07080A',
          mt: '60px',
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        <Outlet />
      </Box>

      {/* ⌘K Global Command Palette / Search Modal */}
      <Dialog
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#0F1219',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.15)',
            overflow: 'hidden',
          }
        }}
      >
        {/* Search Input Bar */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <SearchIcon sx={{ color: '#818cf8', fontSize: 22 }} />
          <InputBase
            autoFocus
            fullWidth
            placeholder="Type candidate name, email, job title, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              color: '#FFFFFF',
              fontSize: '0.95rem',
              fontWeight: 500,
              '& input::placeholder': { color: '#717A8C', opacity: 1 },
            }}
          />
          <IconButton size="small" onClick={() => setSearchModalOpen(false)} sx={{ color: '#626975' }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Search Results List */}
        <DialogContent sx={{ p: 2, maxHeight: 420, overflowY: 'auto' }}>
          {/* Quick Actions */}
          {!searchQuery && (
            <Box mb={2}>
              <Typography variant="caption" sx={{ px: 1, color: '#626975', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem', display: 'block', mb: 1 }}>
                Quick Navigation & Actions
              </Typography>
              <List disablePadding>
                {user?.role === 'ADMIN' && (
                  <ListItemButton onClick={() => handleSelectSearchResult('/jobs/create')} sx={{ borderRadius: '8px', py: 1, px: 1.5, mb: 0.5, '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.1)' } }}>
                    <ListItemIcon sx={{ minWidth: 32, color: '#06b6d4' }}>
                      <AddIcon sx={{ fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText primary="Create New Job Requisition" primaryTypographyProps={{ fontSize: '0.86rem', color: '#F5F7FA', fontWeight: 600 }} />
                  </ListItemButton>
                )}
                <ListItemButton onClick={() => handleSelectSearchResult('/jobs')} sx={{ borderRadius: '8px', py: 1, px: 1.5, mb: 0.5, '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.1)' } }}>
                  <ListItemIcon sx={{ minWidth: 32, color: '#818cf8' }}>
                    <WorkIcon sx={{ fontSize: 18 }} />
                  </ListItemIcon>
                  <ListItemText primary="Browse Job Openings" primaryTypographyProps={{ fontSize: '0.86rem', color: '#F5F7FA' }} />
                </ListItemButton>
                <ListItemButton onClick={() => handleSelectSearchResult('/candidates')} sx={{ borderRadius: '8px', py: 1, px: 1.5, '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.1)' } }}>
                  <ListItemIcon sx={{ minWidth: 32, color: '#10b981' }}>
                    <ParticipantsIcon sx={{ fontSize: 18 }} />
                  </ListItemIcon>
                  <ListItemText primary="View All Participants Directory" primaryTypographyProps={{ fontSize: '0.86rem', color: '#F5F7FA' }} />
                </ListItemButton>
              </List>
            </Box>
          )}

          {/* Jobs Search Results */}
          {filteredJobs.length > 0 && (
            <Box mb={2}>
              <Typography variant="caption" sx={{ px: 1, color: '#626975', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem', display: 'block', mb: 1 }}>
                Job Openings ({filteredJobs.length})
              </Typography>
              <List disablePadding>
                {filteredJobs.slice(0, 5).map((job) => (
                  <ListItemButton key={job.id} onClick={() => handleSelectSearchResult(`/jobs/${job.id}`)} sx={{ borderRadius: '8px', py: 1, px: 1.5, mb: 0.5, '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.1)' } }}>
                    <ListItemIcon sx={{ minWidth: 32, color: '#818cf8' }}>
                      <WorkIcon sx={{ fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={job.title}
                      secondary={`${job.department} • ${job.location}`}
                      primaryTypographyProps={{ fontSize: '0.86rem', color: '#F5F7FA', fontWeight: 600 }}
                      secondaryTypographyProps={{ fontSize: '0.75rem', color: '#969DAA' }}
                    />
                    <Chip label={job.status} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }} />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          )}

          {/* Candidates Search Results */}
          {filteredCandidates.length > 0 && (
            <Box mb={1}>
              <Typography variant="caption" sx={{ px: 1, color: '#626975', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem', display: 'block', mb: 1 }}>
                Candidates & Participants ({filteredCandidates.length})
              </Typography>
              <List disablePadding>
                {filteredCandidates.slice(0, 5).map((cand) => (
                  <ListItemButton key={cand.id} onClick={() => handleSelectSearchResult(`/candidates/${cand.id}`)} sx={{ borderRadius: '8px', py: 1, px: 1.5, mb: 0.5, '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.1)' } }}>
                    <ListItemIcon sx={{ minWidth: 32, color: '#10b981' }}>
                      <PersonIcon sx={{ fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={cand.name}
                      secondary={`${cand.email} • ${cand.job?.title || 'Applied Candidate'}`}
                      primaryTypographyProps={{ fontSize: '0.86rem', color: '#F5F7FA', fontWeight: 600 }}
                      secondaryTypographyProps={{ fontSize: '0.75rem', color: '#969DAA' }}
                    />
                    <Chip label={cand.status} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }} />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          )}

          {/* Empty Search Result State */}
          {searchQuery && filteredJobs.length === 0 && filteredCandidates.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" sx={{ color: '#969DAA', mb: 0.5 }}>
                No job openings or candidates matching "{searchQuery}"
              </Typography>
              <Typography variant="caption" sx={{ color: '#626975' }}>
                Try searching by candidate email, department, or job title.
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Sign Out Confirmation Modal */}
      <Dialog
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#101318',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '8px',
              backgroundColor: 'rgba(244, 63, 94, 0.12)',
              color: '#f43f5e',
            }}
          >
            <WarningIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.05rem', color: '#F5F7FA' }}>
              Confirm Sign Out
            </Typography>
            <Typography variant="caption" sx={{ color: '#626975' }}>
              HireFlow Operating System
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ py: 1.5 }}>
          <Typography variant="body2" sx={{ color: '#969DAA', lineHeight: 1.5, fontSize: '0.85rem' }}>
            Are you sure you want to sign out of your workspace account ({user?.name})? You will need to log back in to access candidate pipelines and AI evaluation reports.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setLogoutModalOpen(false)}
            sx={{
              borderRadius: '6px',
              fontSize: '0.82rem',
              color: '#969DAA',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              '&:hover': { borderColor: 'rgba(255, 255, 255, 0.24)', backgroundColor: 'rgba(255, 255, 255, 0.03)' }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmLogout}
            sx={{
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              backgroundColor: '#f43f5e',
              color: '#ffffff',
              '&:hover': { backgroundColor: '#e11d48' }
            }}
          >
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Layout;
