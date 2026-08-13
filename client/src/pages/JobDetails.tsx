import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, Grid, Chip, Divider, Button, CircularProgress, Paper } from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  PeopleOutlined as PeopleIcon,
  CheckCircleOutlined as HiredIcon,
  TrendingUp as MetricIcon,
  EventOutlined as InterviewIcon,
  EditOutlined as EditIcon,
  BlockOutlined as BlockIcon,
  CheckCircleOutlined as CheckCircleIcon
} from '@mui/icons-material';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import AddCandidateModal from '../components/AddCandidateModal';
import CreateJobModal, { renderFormattedText } from '../components/CreateJobModal';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isInterviewer = user?.role === 'INTERVIEWER';
  const isAdmin = user?.role === 'ADMIN';

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchJob = async () => {
    try {
      const { data } = await apiClient.get(`/jobs/${id}`);
      setJob(data);
    } catch (error) {
      console.error('Failed to fetch job', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  const handleToggleStatus = async (newStatus: string) => {
    try {
      await apiClient.put(`/jobs/${id}`, { status: newStatus });
      fetchJob();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update job status');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress size={32} sx={{ color: '#818cf8' }} />
      </Box>
    );
  }

  if (!job) return <Box p={3}><Typography color="error">Job requisition not found</Typography></Box>;

  const renderStatusDot = (status: string) => {
    let dotClass = 'status-dot-applied';
    if (status === 'OPEN') dotClass = 'status-dot-open';
    if (status === 'DRAFT') dotClass = 'status-dot-draft';
    if (status === 'CLOSED') dotClass = 'status-dot-closed';

    return (
      <Box display="inline-flex" alignItems="center">
        <span className={`status-dot ${dotClass}`}></span>
        <Typography variant="caption" fontWeight={600} sx={{ color: '#F5F7FA', fontSize: '0.75rem' }}>
          {status}
        </Typography>
      </Box>
    );
  };

  const inInterviewCount = job.candidates?.filter((c: any) => c.status === 'INTERVIEW').length || 0;

  const funnelCards = [
    { title: 'Total Applicants', value: job.stats?.totalCandidates || 0, badge: 'Pipeline', icon: <PeopleIcon sx={{ fontSize: 18 }} /> },
    { title: 'Shortlisted', value: job.stats?.shortlisted || 0, badge: 'Target Fit', icon: <MetricIcon sx={{ fontSize: 18 }} /> },
    { title: 'Total Hired', value: job.stats?.hired || 0, badge: 'Success', icon: <HiredIcon sx={{ fontSize: 18 }} /> },
    { title: 'In Interview', value: inInterviewCount, badge: 'Evaluation', icon: <InterviewIcon sx={{ fontSize: 18 }} /> },
  ];

  return (
    <Box
      sx={{
        height: 'calc(100vh - 100px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        gap: 2
      }}
    >
      {/* Top Navigation & Action Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
        <Button
          startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
          onClick={() => navigate('/jobs')}
          sx={{ color: '#969DAA', '&:hover': { color: '#F5F7FA' }, py: 0.5 }}
          size="small"
        >
          Back to Requisitions
        </Button>

        {!isInterviewer && (
          <Button
            variant="contained"
            size="medium"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={() => setModalOpen(true)}
            sx={{
              backgroundColor: '#6366f1',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.82rem',
              borderRadius: '8px',
              px: 2,
              height: 36,
              '&:hover': { backgroundColor: '#4f46e5' }
            }}
          >
            Add Candidate for Job
          </Button>
        )}
      </Box>

      {/* Funnel Metrics Stat Cards matching Main Dashboard Style */}
      <Grid container spacing={2}>
        {funnelCards.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ backgroundColor: '#101318', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', p: 1.8 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography color="#626975" variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {item.title}
                </Typography>
                <Box sx={{ color: '#969DAA' }}>{item.icon}</Box>
              </Box>
              <Typography variant="h5" color="#F5F7FA" fontWeight={700} className="font-mono" sx={{ mb: 0.8 }}>
                {item.value}
              </Typography>
              <Chip
                label={item.badge}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  color: '#969DAA',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              />
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Job Requisition Info */}
      <Card
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#101318',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          p: 3,
          overflow: 'hidden'
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Box>
            <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
              {job.department} Requisition
            </Typography>
            <Typography variant="h5" fontWeight={700} sx={{ color: '#F5F7FA', letterSpacing: '-0.02em', mb: 0.5 }}>
              {job.title}
            </Typography>
            <Typography variant="body2" sx={{ color: '#969DAA', fontSize: '0.82rem' }}>
              {job.location} • {job.employmentType?.replace('_', ' ')} • Req ID: {job.id.slice(0, 8)}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1.5}>
            {renderStatusDot(job.status)}

            {isAdmin && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                  onClick={() => setEditModalOpen(true)}
                  sx={{ borderRadius: '6px', fontSize: '0.72rem', color: '#818cf8', borderColor: 'rgba(129, 140, 248, 0.3)', py: 0.4 }}
                >
                  Edit Job
                </Button>

                {job.status === 'OPEN' ? (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<BlockIcon sx={{ fontSize: 14 }} />}
                    onClick={() => handleToggleStatus('CLOSED')}
                    sx={{ borderRadius: '6px', fontSize: '0.72rem', py: 0.4 }}
                  >
                    Mark Inactive
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                    onClick={() => handleToggleStatus('OPEN')}
                    sx={{ borderRadius: '6px', fontSize: '0.72rem', py: 0.4 }}
                  >
                    Activate Job
                  </Button>
                )}
              </>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.06)' }} />

        <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1, display: 'block' }}>
          Job Description
        </Typography>

        {/* Scrollable Formatted Description Panel */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minHeight: 0,
            p: 2,
            backgroundColor: '#0B0D10',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            overflowY: 'auto',
            mb: 2
          }}
        >
          {renderFormattedText(job.description)}
        </Paper>

        <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1, display: 'block' }}>
          Required Competencies
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {job.requiredSkills?.split(',').map((skill: string, index: number) => (
            <Chip
              key={index}
              label={skill.trim()}
              size="small"
              sx={{
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                color: '#818cf8',
                border: '1px solid rgba(129, 140, 248, 0.2)',
                fontWeight: 500,
                fontSize: '0.72rem'
              }}
            />
          ))}
        </Box>
      </Card>

      <AddCandidateModal open={modalOpen} onClose={() => setModalOpen(false)} jobId={id!} onCandidateAdded={fetchJob} />
      <CreateJobModal open={editModalOpen} onClose={() => setEditModalOpen(false)} onJobCreated={fetchJob} editingJob={job} />
    </Box>
  );
};

export default JobDetails;
