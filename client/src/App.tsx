import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import JobList from './pages/JobList';
import JobDetails from './pages/JobDetails';

import CandidateDetails from './pages/CandidateDetails';
import CandidateList from './pages/CandidateList';
import AdminSettings from './pages/AdminSettings';
import CandidatePortal from './pages/CandidatePortal';
import InterviewWorkspace from './pages/InterviewWorkspace';
import { Box, CircularProgress } from '@mui/material';

const ProtectedRoute = ({ children, roles }: { children: JSX.Element; roles?: string[] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#0B0D10">
        <CircularProgress sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'CANDIDATE' ? '/candidate-portal/profile' : '/dashboard'} replace />;
  }
  
  return children;
};

const IndexRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#0B0D10">
        <CircularProgress sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'CANDIDATE') {
    return <Navigate to="/candidate-portal/profile" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<IndexRedirect />} />
          
          {/* STAFF ROUTES (ADMIN, RECRUITER, INTERVIEWER ONLY) */}
          <Route path="dashboard" element={
            <ProtectedRoute roles={['ADMIN', 'RECRUITER', 'INTERVIEWER']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* CANDIDATE PORTAL ROUTES (CANDIDATE ONLY) */}
          <Route path="candidate-portal" element={
            <ProtectedRoute roles={['CANDIDATE']}>
              <Navigate to="/candidate-portal/profile" replace />
            </ProtectedRoute>
          } />
          <Route path="candidate-portal/profile" element={
            <ProtectedRoute roles={['CANDIDATE']}>
              <CandidatePortal tab="profile" />
            </ProtectedRoute>
          } />
          <Route path="candidate-portal/jobs" element={
            <ProtectedRoute roles={['CANDIDATE']}>
              <CandidatePortal tab="jobs" />
            </ProtectedRoute>
          } />
          <Route path="candidate-portal/applications" element={
            <ProtectedRoute roles={['CANDIDATE']}>
              <CandidatePortal tab="applications" />
            </ProtectedRoute>
          } />
          
          {/* JOBS ROUTES (ADMIN, RECRUITER, INTERVIEWER ONLY) */}
          <Route path="jobs" element={
            <ProtectedRoute roles={['ADMIN', 'RECRUITER', 'INTERVIEWER']}>
              <JobList />
            </ProtectedRoute>
          } />
          <Route path="jobs/create" element={<Navigate to="/jobs" replace />} />
          <Route path="jobs/:id" element={
            <ProtectedRoute roles={['ADMIN', 'RECRUITER', 'INTERVIEWER']}>
              <JobDetails />
            </ProtectedRoute>
          } />
          
          {/* CANDIDATES MANAGEMENT (ADMIN, RECRUITER, INTERVIEWER ONLY) */}
          <Route path="candidates" element={
            <ProtectedRoute roles={['ADMIN', 'RECRUITER', 'INTERVIEWER']}>
              <CandidateList />
            </ProtectedRoute>
          } />
          <Route path="candidates/:id" element={
            <ProtectedRoute roles={['ADMIN', 'RECRUITER', 'INTERVIEWER']}>
              <CandidateDetails />
            </ProtectedRoute>
          } />
          
          {/* LIVE INTERVIEW WORKSPACE (ACCESSIBLE TO CANDIDATE AND ASSIGNED STAFF) */}
          <Route path="interviews/:id/copilot" element={
            <ProtectedRoute roles={['ADMIN', 'RECRUITER', 'INTERVIEWER', 'CANDIDATE']}>
              <InterviewWorkspace />
            </ProtectedRoute>
          } />
          
          {/* ADMIN SETTINGS (ADMIN ONLY) */}
          <Route path="admin-settings" element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminSettings />
            </ProtectedRoute>
          } />
          
          {/* WILDCARD FALLBACK */}
          <Route path="*" element={<IndexRedirect />} />
        </Route>
        <Route path="*" element={<IndexRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;
