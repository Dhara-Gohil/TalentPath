import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, MenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, InputAdornment,
  Grid, CircularProgress, Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  PeopleOutlined as ApplicantsIcon,
  PersonSearchOutlined as ScreeningIcon,
  EventOutlined as InterviewIcon,
  TrendingUpOutlined as ShortlistIcon,
  CheckCircleOutlined as HiredIcon,
  OpenInNew as OpenIcon,
  FilterList as FilterIcon,
  AutoAwesome as AiIcon
} from '@mui/icons-material';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import AddCandidateModal from '../components/AddCandidateModal';
import ViewAiSummaryModal from '../components/ViewAiSummaryModal';
import { showToast } from '../utils/toast';

const CandidateList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isInterviewer = user?.role === 'INTERVIEWER';
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState('ALL');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [selectedInterviewStep, setSelectedInterviewStep] = useState('ALL');

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [aiSummaryModalOpen, setAiSummaryModalOpen] = useState(false);
  const [selectedCandidateForAi, setSelectedCandidateForAi] = useState<any>(null);

  const fetchCandidatesAndJobs = async () => {
    setLoading(true);
    try {
      const [candidatesRes, jobsRes] = await Promise.all([
        apiClient.get('/candidates?all=true'),
        apiClient.get('/jobs?all=true')
      ]);
      const candidateData = Array.isArray(candidatesRes.data)
        ? candidatesRes.data
        : (candidatesRes.data.data || candidatesRes.data.candidates || []);
      setCandidates(candidateData);

      const jobData = Array.isArray(jobsRes.data)
        ? jobsRes.data
        : (jobsRes.data.data || jobsRes.data.jobs || []);
      setJobs(jobData);
    } catch (error) {
      console.error('Failed to fetch participants data', error);
      showToast.apiError(error, 'Failed to fetch candidate list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidatesAndJobs();
  }, []);

  const handleStatusChange = async (candidateId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/candidates/${candidateId}/status`, { status: newStatus });
      showToast.success(`Candidate status updated to ${newStatus.replace('_', ' ')}`);
      fetchCandidatesAndJobs();
    } catch (error) {
      showToast.apiError(error, 'Failed to update pipeline stage');
    }
  };

  // Helper to determine candidate's highest interview step
  const getCandidateInterviewStep = (candidate: any) => {
    if (!candidate.interviews || candidate.interviews.length === 0) return 'NOT_SCHEDULED';
    const roundsOrder = ['TECHNICAL', 'HR', 'MANAGERIAL', 'CULTURAL'];
    const scheduledOrCompleted = candidate.interviews.map((i: any) => i.type);

    // Find the highest step candidate has reached
    for (let i = roundsOrder.length - 1; i >= 0; i--) {
      if (scheduledOrCompleted.includes(roundsOrder[i])) {
        return roundsOrder[i];
      }
    }
    return 'NOT_SCHEDULED';
  };

  // Filter logic
  const filteredCandidates = candidates.filter(candidate => {
    // Search query filter
    const matchesSearch = searchQuery === '' ||
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (candidate.skills && candidate.skills.toLowerCase().includes(searchQuery.toLowerCase()));

    // Job filter
    const matchesJob = selectedJob === 'ALL' || candidate.jobId === selectedJob;

    // Stage filter
    const matchesStage = selectedStage === 'ALL' || candidate.status === selectedStage;

    // Interview step filter
    const step = getCandidateInterviewStep(candidate);
    const matchesStep = selectedInterviewStep === 'ALL' || step === selectedInterviewStep;

    return matchesSearch && matchesJob && matchesStage && matchesStep;
  });

  // Calculate Metrics
  const totalApplicants = candidates.length;
  const screeningCount = candidates.filter(c => c.status === 'SCREENING' || c.status === 'APPLIED').length;
  const interviewCount = candidates.filter(c => c.status === 'INTERVIEW').length;
  const shortlistedCount = candidates.filter(c => c.status === 'SHORTLISTED').length;
  const hiredCount = candidates.filter(c => c.status === 'HIRED').length;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Top Header Title & Actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#F5F7FA', letterSpacing: '-0.02em', mb: 0.5 }}>
            All Participants & Candidates
          </Typography>
          <Typography variant="caption" sx={{ color: '#626975', fontSize: '0.78rem' }}>
            Unified directory with pipeline filtering, interview trace tracking, and candidate dossiers
          </Typography>
        </Box>

        {!isInterviewer && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddModalOpen(true)}
            sx={{ borderRadius: '6px', backgroundColor: '#6366f1', px: 2 }}
          >
            Add Participant
          </Button>
        )}
      </Box>

      {isInterviewer && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(129, 140, 248, 0.25)' }}>
          Interviewer Workspace: Displaying candidates assigned to you for interview evaluation.
        </Alert>
      )}

      {/* Top Summary Stat Cards (Matching Design Reference) */}
      <Grid container spacing={2} mb={3.5}>
        {/* Card 1: TOTAL APPLICANTS */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            sx={{
              p: 2.2,
              backgroundColor: '#0B0D10',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              position: 'relative'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
              <Typography variant="caption" fontWeight={700} sx={{ color: '#626975', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                TOTAL APPLICANTS
              </Typography>
              <ApplicantsIcon sx={{ fontSize: 16, color: '#626975' }} />
            </Box>
            <Typography variant="h4" fontWeight={700} sx={{ color: '#F5F7FA', mb: 1.5 }} className="font-mono">
              {totalApplicants}
            </Typography>
            <Chip label="Pipeline" size="small" sx={{ height: 18, fontSize: '0.62rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#969DAA' }} />
          </Paper>
        </Grid>

        {/* Card 2: IN SCREENING */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            sx={{
              p: 2.2,
              backgroundColor: '#0B0D10',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              position: 'relative'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
              <Typography variant="caption" fontWeight={700} sx={{ color: '#626975', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                IN SCREENING
              </Typography>
              <ScreeningIcon sx={{ fontSize: 16, color: '#626975' }} />
            </Box>
            <Typography variant="h4" fontWeight={700} sx={{ color: '#F5F7FA', mb: 1.5 }} className="font-mono">
              {screeningCount}
            </Typography>
            <Chip label="Applied / Screening" size="small" sx={{ height: 18, fontSize: '0.62rem', backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }} />
          </Paper>
        </Grid>

        {/* Card 3: IN INTERVIEWS */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            sx={{
              p: 2.2,
              backgroundColor: '#0B0D10',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              position: 'relative'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
              <Typography variant="caption" fontWeight={700} sx={{ color: '#626975', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                IN INTERVIEWS
              </Typography>
              <InterviewIcon sx={{ fontSize: 16, color: '#626975' }} />
            </Box>
            <Typography variant="h4" fontWeight={700} sx={{ color: '#F5F7FA', mb: 1.5 }} className="font-mono">
              {interviewCount}
            </Typography>
            <Chip label="Active Rounds" size="small" sx={{ height: 18, fontSize: '0.62rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }} />
          </Paper>
        </Grid>

        {/* Card 4: SHORTLISTED */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            sx={{
              p: 2.2,
              backgroundColor: '#0B0D10',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              position: 'relative'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
              <Typography variant="caption" fontWeight={700} sx={{ color: '#626975', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                SHORTLISTED
              </Typography>
              <ShortlistIcon sx={{ fontSize: 16, color: '#626975' }} />
            </Box>
            <Typography variant="h4" fontWeight={700} sx={{ color: '#F5F7FA', mb: 1.5 }} className="font-mono">
              {shortlistedCount}
            </Typography>
            <Chip label="Target Fit" size="small" sx={{ height: 18, fontSize: '0.62rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }} />
          </Paper>
        </Grid>

        {/* Card 5: TOTAL HIRED */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            sx={{
              p: 2.2,
              backgroundColor: '#0B0D10',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              position: 'relative'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
              <Typography variant="caption" fontWeight={700} sx={{ color: '#626975', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                TOTAL HIRED
              </Typography>
              <HiredIcon sx={{ fontSize: 16, color: '#626975' }} />
            </Box>
            <Typography variant="h4" fontWeight={700} sx={{ color: '#F5F7FA', mb: 1.5 }} className="font-mono">
              {hiredCount}
            </Typography>
            <Chip label="Success" size="small" sx={{ height: 18, fontSize: '0.62rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }} />
          </Paper>
        </Grid>
      </Grid>

      {/* Multi-Criteria Filters Bar */}
      <Paper sx={{ p: 2, backgroundColor: '#0B0D10', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search Query Input */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search participants by name, email, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: '#626975' }} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          {/* Job Filter */}
          <Grid item xs={12} sm={4} md={2.6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Job Opening"
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
            >
              <MenuItem value="ALL">All Jobs ({jobs.length})</MenuItem>
              {jobs.map((job) => (
                <MenuItem key={job.id} value={job.id}>{job.title}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Pipeline Stage Filter */}
          <Grid item xs={12} sm={4} md={2.7}>
            <TextField
              select
              fullWidth
              size="small"
              label="Pipeline Stage"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
            >
              <MenuItem value="ALL">All Stages</MenuItem>
              <MenuItem value="APPLIED">Applied</MenuItem>
              <MenuItem value="SCREENING">Screening</MenuItem>
              <MenuItem value="INTERVIEW">Interview</MenuItem>
              <MenuItem value="SHORTLISTED">Shortlisted</MenuItem>
              <MenuItem value="HIRED">Hired</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </TextField>
          </Grid>

          {/* Interview Step Filter */}
          <Grid item xs={12} sm={4} md={2.7}>
            <TextField
              select
              fullWidth
              size="small"
              label="Interview Step"
              value={selectedInterviewStep}
              onChange={(e) => setSelectedInterviewStep(e.target.value)}
            >
              <MenuItem value="ALL">All Interview Steps</MenuItem>
              <MenuItem value="TECHNICAL">Round 1: Technical</MenuItem>
              <MenuItem value="HR">Round 2: HR & Culture</MenuItem>
              <MenuItem value="MANAGERIAL">Round 3: Managerial</MenuItem>
              <MenuItem value="CULTURAL">Round 4: Cultural Fit</MenuItem>
              <MenuItem value="NOT_SCHEDULED">Not Scheduled</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Participants Table */}
      <TableContainer component={Paper} sx={{ backgroundColor: '#101318', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress size={28} sx={{ color: '#818cf8' }} />
          </Box>
        ) : filteredCandidates.length === 0 ? (
          <Box textAlign="center" py={6}>
            <FilterIcon sx={{ fontSize: 36, color: '#626975', mb: 1 }} />
            <Typography variant="body2" color="#969DAA">
              No participants match your filter criteria.
            </Typography>
            <Button
              size="small"
              onClick={() => { setSearchQuery(''); setSelectedJob('ALL'); setSelectedStage('ALL'); setSelectedInterviewStep('ALL'); }}
              sx={{ mt: 1, color: '#818cf8', fontSize: '0.75rem' }}
            >
              Reset Filters
            </Button>
          </Box>
        ) : (
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <TableCell sx={{ color: '#626975', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Participant</TableCell>
                <TableCell sx={{ color: '#626975', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Job Opening</TableCell>
                <TableCell sx={{ color: '#626975', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pipeline Stage</TableCell>
                <TableCell sx={{ color: '#626975', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interview Step</TableCell>
                <TableCell sx={{ color: '#626975', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Experience</TableCell>
                <TableCell align="right" sx={{ color: '#626975', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCandidates.map((candidate) => {
                const currentStep = getCandidateInterviewStep(candidate);

                return (
                  <TableRow key={candidate.id} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' }, borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    {/* Candidate Name & Email */}
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                            color: '#818cf8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            border: '1px solid rgba(129, 140, 248, 0.3)'
                          }}
                        >
                          {candidate.name.charAt(0)}
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            onClick={() => navigate(`/candidates/${candidate.id}`)}
                            sx={{ color: '#F5F7FA', cursor: 'pointer', '&:hover': { color: '#818cf8' } }}
                          >
                            {candidate.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#626975' }}>
                            {candidate.email} • {candidate.phone}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Job Opening */}
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#F5F7FA', fontSize: '0.82rem' }}>
                        {candidate.job?.title || 'Unassigned'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#626975' }}>
                        {candidate.job?.department || 'General'}
                      </Typography>
                    </TableCell>

                    {/* Pipeline Stage Select */}
                    <TableCell>
                      {isInterviewer ? (
                        <Chip
                          size="small"
                          label={candidate.status}
                          sx={{
                            height: 24,
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: '#F5F7FA',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        />
                      ) : (
                        <TextField
                          select
                          size="small"
                          value={candidate.status}
                          onChange={(e) => handleStatusChange(candidate.id, e.target.value)}
                          sx={{
                            minWidth: 130,
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#0B0D10',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              height: 30
                            }
                          }}
                        >
                          {['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'HIRED', 'REJECTED'].map(s => (
                            <MenuItem key={s} value={s} sx={{ fontSize: '0.75rem' }}>
                              <Box display="flex" alignItems="center">
                                <span className={`status-dot status-dot-${s.toLowerCase()}`}></span>
                                {s}
                              </Box>
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    </TableCell>

                    {/* Current Interview Step */}
                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          currentStep === 'TECHNICAL' ? '1. Technical Round' :
                            currentStep === 'HR' ? '2. HR & Culture' :
                              currentStep === 'MANAGERIAL' ? '3. Managerial' :
                                currentStep === 'CULTURAL' ? '4. Cultural Fit' : 'Not Scheduled'
                        }
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: currentStep !== 'NOT_SCHEDULED' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                          color: currentStep !== 'NOT_SCHEDULED' ? '#818cf8' : '#626975',
                          border: currentStep !== 'NOT_SCHEDULED' ? '1px solid rgba(129, 140, 248, 0.25)' : '1px solid rgba(255, 255, 255, 0.06)'
                        }}
                      />
                    </TableCell>

                    {/* Experience Years */}
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#969DAA', fontSize: '0.8rem' }} className="font-mono">
                        {candidate.experienceYears} Yrs
                      </Typography>
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<AiIcon sx={{ fontSize: 13 }} />}
                          onClick={() => { setSelectedCandidateForAi(candidate); setAiSummaryModalOpen(true); }}
                          sx={{
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            py: 0.4,
                            px: 1.2,
                            backgroundColor: '#6366f1',
                            color: '#ffffff',
                            fontWeight: 600,
                            boxShadow: 'none',
                            '&:hover': { backgroundColor: '#4f46e5' }
                          }}
                        >
                          AI Summary
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          endIcon={<OpenIcon sx={{ fontSize: 13 }} />}
                          onClick={() => navigate(`/candidates/${candidate.id}`)}
                          sx={{ borderRadius: '6px', fontSize: '0.72rem', py: 0.3 }}
                        >
                          View Dossier
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Slide-Over Modal to Add New Candidate */}
      <AddCandidateModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onCandidateAdded={fetchCandidatesAndJobs}
      />

      {/* Slide-Over Modal to View AI Interview Summary */}
      <ViewAiSummaryModal
        open={aiSummaryModalOpen}
        onClose={() => setAiSummaryModalOpen(false)}
        candidate={selectedCandidateForAi}
        onEvaluationGenerated={fetchCandidatesAndJobs}
      />
    </Box>
  );
};

export default CandidateList;
