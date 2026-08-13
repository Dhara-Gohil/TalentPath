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

const ProtectedRoute = ({ children, roles }: { children: JSX.Element; roles?: string[] }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'CANDIDATE' ? '/candidate-portal' : '/dashboard'} replace />;
  }
  
  return children;
};

const IndexRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'CANDIDATE') {
    return <Navigate to="/candidate-portal" replace />;
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
          <Route path="dashboard" element={
            <ProtectedRoute roles={['ADMIN', 'RECRUITER', 'INTERVIEWER']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="candidate-portal" element={<Navigate to="/candidate-portal/profile" replace />} />
          <Route path="candidate-portal/profile" element={
            <ProtectedRoute roles={['CANDIDATE', 'ADMIN']}>
              <CandidatePortal tab="profile" />
            </ProtectedRoute>
          } />
          <Route path="candidate-portal/jobs" element={
            <ProtectedRoute roles={['CANDIDATE', 'ADMIN']}>
              <CandidatePortal tab="jobs" />
            </ProtectedRoute>
          } />
          <Route path="candidate-portal/applications" element={
            <ProtectedRoute roles={['CANDIDATE', 'ADMIN']}>
              <CandidatePortal tab="applications" />
            </ProtectedRoute>
          } />
          <Route path="jobs" element={
            <ProtectedRoute roles={['ADMIN', 'RECRUITER']}>
              <JobList />
            </ProtectedRoute>
          } />
          <Route path="jobs/create" element={<Navigate to="/jobs" replace />} />
          <Route path="jobs/:id" element={<JobDetails />} />
          <Route path="candidates" element={
            <ProtectedRoute roles={['ADMIN', 'RECRUITER', 'INTERVIEWER']}>
              <CandidateList />
            </ProtectedRoute>
          } />
          <Route path="candidates/:id" element={<CandidateDetails />} />
          <Route path="admin-settings" element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminSettings />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
