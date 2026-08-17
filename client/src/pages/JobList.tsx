import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import { Add as AddIcon, ArrowForward as ArrowIcon, WorkOutline as JobIcon } from '@mui/icons-material';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import CreateJobModal from '../components/CreateJobModal';

const JobList = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchJobs = async () => {
    try {
      const { data } = await apiClient.get('/jobs?all=true');
      const list = Array.isArray(data) ? data : (data.data || data.jobs || []);
      setJobs(list);
    } catch (error) {
      console.error('Failed to fetch jobs', error);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const renderStatusDot = (status: string) => {
    let dotClass = 'status-dot-applied';
    if (status === 'OPEN') dotClass = 'status-dot-open';
    if (status === 'DRAFT') dotClass = 'status-dot-draft';
    if (status === 'CLOSED') dotClass = 'status-dot-closed';

    return (
      <Box display="inline-flex" alignItems="center">
        <span className={`status-dot ${dotClass}`}></span>
        <Typography variant="caption" fontWeight={600} sx={{ color: '#F5F7FA', fontSize: '0.78rem' }}>
          {status}
        </Typography>
      </Box>
    );
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={3.5}>
        <Box>
          <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
            Active Requisitions
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ color: '#F5F7FA', letterSpacing: '-0.025em' }}>
            Job Openings
          </Typography>
        </Box>
        {user?.role === 'ADMIN' && (
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
            color="primary"
            onClick={() => setCreateModalOpen(true)}
            size="medium"
            sx={{
              borderRadius: '6px',
              backgroundColor: '#6366f1',
              '&:hover': { backgroundColor: '#4f46e5' },
              whiteSpace: 'nowrap',
              minWidth: 'fit-content',
              px: 2
            }}
          >
            Create Job
          </Button>
        )}
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: '#101318',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          boxShadow: 'none !important',
          overflowX: 'auto'
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: '#0B0D10' }}>
            <TableRow>
              <TableCell sx={{ color: '#626975', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Job Title</TableCell>
              <TableCell sx={{ color: '#626975', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Department</TableCell>
              <TableCell sx={{ color: '#626975', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location</TableCell>
              <TableCell sx={{ color: '#626975', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Type</TableCell>
              <TableCell sx={{ color: '#626975', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</TableCell>
              <TableCell align="right" sx={{ color: '#626975', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job) => (
              <TableRow
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02) !important' }
                }}
              >
                <TableCell sx={{ fontWeight: 600, color: '#F5F7FA' }}>{job.title}</TableCell>
                <TableCell sx={{ color: '#969DAA' }}>{job.department}</TableCell>
                <TableCell sx={{ color: '#969DAA' }}>{job.location}</TableCell>
                <TableCell sx={{ color: '#626975', fontSize: '0.82rem' }}>{job.employmentType.replace('_', ' ')}</TableCell>
                <TableCell>{renderStatusDot(job.status)}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" sx={{ color: '#626975', '&:hover': { color: '#818cf8' } }}>
                    <ArrowIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {jobs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Box sx={{ color: '#626975', textAlign: 'center' }}>
                    <JobIcon sx={{ fontSize: 32, mb: 1, color: '#626975' }} />
                    <Typography variant="body2" sx={{ color: '#969DAA', fontWeight: 500 }}>
                      No active job requisitions found.
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#626975', display: 'block', mt: 0.5 }}>
                      Create a new job position to start recruiting candidates.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateJobModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onJobCreated={fetchJobs}
      />
    </Box>
  );
};

export default JobList;
