import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Grid, TextField, Button, Chip, Paper, Alert,
  CircularProgress, Stepper, Step, StepLabel, StepContent, Link, List
} from '@mui/material';
import {
  WorkOutline as WorkIcon,
  TimelineOutlined as PipelineIcon,
  PsychologyOutlined as AiBrainIcon,
  SaveOutlined as SaveIcon,
  Send as SendIcon,
  Event as EventIcon,
  VideoCall as MeetingIcon,
  Description as ResumeIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { candidateService } from '../api/candidate.service';
import type { CandidateProfile, CandidateProfileSummary, SuitableJobItem, MyCandidateApplication, CandidateStatus } from '../api/types';
import { candidateStatusColor } from '../theme/statusColors';

const PIPELINE_STAGES: CandidateStatus[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'SHORTLISTED', 'HIRED'];

const getPipelineStepIndex = (status: CandidateStatus): number => {
  if (status === 'REJECTED') return -1;
  const idx = PIPELINE_STAGES.indexOf(status);
  return idx !== -1 ? idx : 0;
};

interface CandidatePortalProps {
  tab?: 'profile' | 'jobs' | 'applications';
}

const CandidatePortal = ({ tab = 'profile' }: CandidatePortalProps) => {
  // Candidate Profile State
  const [profile, setProfile] = useState<CandidateProfile>({
    name: '',
    email: '',
    phone: '',
    experienceYears: 0,
    skills: '',
    resumeText: '',
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // 3rd AI Summary State (Candidate Profile Executive Summary)
  const [aiSummary, setAiSummary] = useState<CandidateProfileSummary | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  // Job Matcher & Open Jobs State
  const [jobs, setJobs] = useState<SuitableJobItem[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [matchingJobs, setMatchingJobs] = useState(false);
  const [jobError, setJobError] = useState('');
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState('');

  // Applications State
  const [applications, setApplications] = useState<MyCandidateApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState('');

  // Load Profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  // Trigger tab data fetching when tab prop changes
  useEffect(() => {
    if (tab === 'jobs' && jobs.length === 0) {
      loadSuitableJobs();
    } else if (tab === 'applications') {
      loadMyApplications();
    }
  }, [tab]);

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const data = await candidateService.getProfile();
      if (data.profile) {
        setProfile({
          name: data.profile.name || data.user.name || '',
          email: data.profile.email || data.user.email || '',
          phone: data.profile.phone || '',
          experienceYears: data.profile.experienceYears || 0,
          skills: data.profile.skills || '',
          resumeText: data.profile.resumeText || '',
        });

        if (data.profile.aiSummary) {
          try {
            setAiSummary(JSON.parse(data.profile.aiSummary));
          } catch (e) {
            console.error('Failed to parse AI summary', e);
          }
        }
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.error || err.message || 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      await candidateService.updateProfile(profile);
      setProfileSuccess('Candidate profile and resume details saved successfully!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: any) {
      setProfileError(err.response?.data?.error || err.message || 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleGenerateAiSummary = async () => {
    if (!profile.resumeText || profile.resumeText.length < 10) {
      setSummaryError('Please add your resume or bio summary details before generating AI Summary.');
      return;
    }

    setGeneratingSummary(true);
    setSummaryError('');
    try {
      await candidateService.updateProfile(profile);
      const summary = await candidateService.generateProfileSummary();
      setAiSummary(summary);
    } catch (err: any) {
      setSummaryError(err.response?.data?.error || err.message || 'Failed to generate AI profile summary');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const loadSuitableJobs = async () => {
    setJobsLoading(true);
    setJobError('');
    try {
      const data = await candidateService.getSuitableJobs();
      setJobs(data);
    } catch (err: any) {
      setJobError(err.response?.data?.error || err.message || 'Failed to load open jobs');
    } finally {
      setJobsLoading(false);
    }
  };

  const handleRunAiJobMatching = async () => {
    setMatchingJobs(true);
    setJobError('');
    try {
      const data = await candidateService.getSuitableJobs();
      setJobs(data);
    } catch (err: any) {
      setJobError(err.response?.data?.error || err.message || 'Failed to compute AI job recommendations');
    } finally {
      setMatchingJobs(false);
    }
  };

  const handleApplyForJob = async (jobId: string) => {
    setApplyingJobId(jobId);
    setJobError('');
    setApplySuccess('');
    try {
      await candidateService.applyForJob(jobId);
      setApplySuccess('Job application submitted successfully! Your application is now in the recruitment pipeline.');
      setTimeout(() => setApplySuccess(''), 5000);
      loadSuitableJobs();
      loadMyApplications();
    } catch (err: any) {
      setJobError(err.response?.data?.error || err.message || 'Failed to submit job application');
    } finally {
      setApplyingJobId(null);
    }
  };

  const loadMyApplications = async () => {
    setAppsLoading(true);
    setAppsError('');
    try {
      const data = await candidateService.getMyApplications();
      setApplications(data);
    } catch (err: any) {
      setAppsError(err.response?.data?.error || err.message || 'Failed to load applications');
    } finally {
      setAppsLoading(false);
    }
  };

  if (profileLoading && tab === 'profile') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header Banner - Screen Area Optimized */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          mb: 3.5,
          backgroundColor: 'rgba(15, 18, 25, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(15, 18, 25, 0.95) 0%, rgba(30, 27, 75, 0.4) 100%)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
        }}
      >
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" fontWeight={800} sx={{ color: '#FFFFFF', letterSpacing: '-0.02em', fontSize: { xs: '1.5rem', md: '1.85rem' } }}>
              {tab === 'profile' && `${profile.name || 'Candidate'} : Profile & AI Executive Summary `}
              {tab === 'jobs' && 'AI Job Recommendation Engine & Open Requisitions'}
              {tab === 'applications' && 'My Job Applications & Live Interview Schedule'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#969DAA', mt: 0.6, fontSize: '0.88rem' }}>
              {tab === 'profile' && 'Update your candidate background details, skills, and resume to generate a deep executive AI profile summary.'}
              {tab === 'jobs' && 'Browse open job openings and run AI matching to discover positions aligned with your skills & experience.'}
              {tab === 'applications' && 'Track your submitted job applications, hiring pipeline progress, and upcoming interview sessions.'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
            {tab === 'profile' && (
              <Button
                variant="contained"
                onClick={handleGenerateAiSummary}
                disabled={generatingSummary}
                startIcon={generatingSummary ? <CircularProgress size={16} color="inherit" /> : <AiBrainIcon sx={{ color: '#06b6d4' }} />}
                sx={{
                  py: 1.2,
                  px: 2.5,
                  borderRadius: '10px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #0891b2 100%)',
                  },
                }}
              >
                {generatingSummary ? 'Generating AI Summary...' : 'Generate Executive AI Summary'}
              </Button>
            )}

            {tab === 'jobs' && (
              <Button
                variant="contained"
                onClick={handleRunAiJobMatching}
                disabled={matchingJobs}
                startIcon={matchingJobs ? <CircularProgress size={16} color="inherit" /> : <AiBrainIcon sx={{ color: '#ffffff' }} />}
                sx={{
                  py: 1.2,
                  px: 2.5,
                  borderRadius: '10px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  backgroundColor: '#06b6d4',
                  color: '#ffffff',
                  boxShadow: '0 4px 20px rgba(6, 182, 212, 0.35)',
                  '&:hover': { backgroundColor: '#0891b2' },
                }}
              >
                {matchingJobs ? 'Evaluating Matches...' : 'AI Match My Profile'}
              </Button>
            )}

            {tab === 'applications' && (
              <Chip
                icon={<PipelineIcon sx={{ fontSize: '16px !important', color: '#10b981' }} />}
                label={`${applications.length} Active Application${applications.length === 1 ? '' : 's'}`}
                sx={{
                  py: 2,
                  px: 1.5,
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#34d399',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              />
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* VIEW 1: PROFILE & RESUME DETAILS + 3RD AI SUMMARY */}
      {tab === 'profile' && (
        <Grid container spacing={3}>
          {/* Left Column: Candidate Details Form */}
          <Grid item xs={12} lg={7}>
            <Card
              sx={{
                p: 3.5,
                backgroundColor: '#0B0D10',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
                  <ResumeIcon sx={{ color: '#818cf8', fontSize: 22 }} />
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#F5F7FA', fontSize: '1.05rem' }}>
                    Candidate Details & Resume
                  </Typography>
                </Box>

                {profileError && (
                  <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px', fontSize: '0.84rem' }}>
                    {profileError}
                  </Alert>
                )}

                {profileSuccess && (
                  <Alert severity="success" sx={{ mb: 2.5, borderRadius: '8px', fontSize: '0.84rem' }}>
                    {profileSuccess}
                  </Alert>
                )}

                <Box component="form" id="candidate-profile-form" onSubmit={handleSaveProfile}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: '#C3C9D5', fontWeight: 600, mb: 0.6, display: 'block' }}>
                        Full Name
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Alex Morgan"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#0F1219',
                            color: '#FFF',
                            borderRadius: '8px',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: '#C3C9D5', fontWeight: 600, mb: 0.6, display: 'block' }}>
                        Email Address
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="email"
                        placeholder="alex@example.com"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#0F1219',
                            color: '#FFF',
                            borderRadius: '8px',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: '#C3C9D5', fontWeight: 600, mb: 0.6, display: 'block' }}>
                        Phone Number
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="+1 (555) 234-5678"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#0F1219',
                            color: '#FFF',
                            borderRadius: '8px',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: '#C3C9D5', fontWeight: 600, mb: 0.6, display: 'block' }}>
                        Years of Experience
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        placeholder="5"
                        value={profile.experienceYears}
                        onChange={(e) => setProfile({ ...profile, experienceYears: parseInt(e.target.value) || 0 })}
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#0F1219',
                            color: '#FFF',
                            borderRadius: '8px',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ color: '#C3C9D5', fontWeight: 600, mb: 0.6, display: 'block' }}>
                        Key Technical & Professional Skills (Comma Separated)
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="React, TypeScript, Node.js, Express, PostgreSQL, AWS"
                        value={profile.skills}
                        onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#0F1219',
                            color: '#FFF',
                            borderRadius: '8px',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ color: '#C3C9D5', fontWeight: 600, mb: 0.6, display: 'block' }}>
                        Resume / Bio Text
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={14}
                        placeholder="Paste your full resume summary, past employment highlights, education, projects, and achievements..."
                        value={profile.resumeText}
                        onChange={(e) => setProfile({ ...profile, resumeText: e.target.value })}
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#0F1219',
                            color: '#FFF',
                            borderRadius: '8px',
                            fontSize: '0.88rem',
                            fontFamily: 'monospace',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Box>

              <Box display="flex" justifyContent="flex-end" mt={2.5}>
                <Button
                  form="candidate-profile-form"
                  type="submit"
                  variant="contained"
                  disabled={savingProfile}
                  startIcon={savingProfile ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  sx={{
                    py: 1.2,
                    px: 3.5,
                    borderRadius: '8px',
                    fontWeight: 700,
                    backgroundColor: '#6366f1',
                    boxShadow: '0 4px 18px rgba(99, 102, 241, 0.4)',
                    '&:hover': { backgroundColor: '#4f46e5' },
                  }}
                >
                  {savingProfile ? 'Saving Profile...' : 'Save Profile Details'}
                </Button>
              </Box>
            </Card>
          </Grid>

          {/* Right Column: 3rd AI Summary Display Card */}
          <Grid item xs={12} lg={5}>
            <Card
              sx={{
                p: 3.5,
                backgroundColor: 'rgba(15, 18, 25, 0.92)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(6, 182, 212, 0.08)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5}>
                <Box display="flex" alignItems="center" gap={1.2}>
                  <AiBrainIcon sx={{ color: '#06b6d4', fontSize: 26 }} />
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#F5F7FA', fontSize: '1.05rem' }}>
                    Executive AI Career Summary
                  </Typography>
                </Box>
                <Chip
                  label="NEW SUMMARY TYPE"
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    backgroundColor: 'rgba(6, 182, 212, 0.15)',
                    color: '#06b6d4',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                  }}
                />
              </Box>

              {summaryError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: '8px', fontSize: '0.82rem' }}>
                  {summaryError}
                </Alert>
              )}

              {aiSummary ? (
                <Box display="flex" flexDirection="column" gap={2.5} sx={{ flexGrow: 1 }}>
                  <Box sx={{ p: 2.2, backgroundColor: '#0F1219', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Typography variant="caption" sx={{ color: '#06b6d4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5, display: 'block' }}>
                      Executive Overview
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#E2E8F0', lineHeight: 1.6, fontSize: '0.88rem' }}>
                      {aiSummary.executiveSummary}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#969DAA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.8, display: 'block' }}>
                      Core Competencies
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.8}>
                      {aiSummary.coreCompetencies.map((comp, idx) => (
                        <Chip
                          key={idx}
                          label={comp}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(99, 102, 241, 0.12)',
                            color: '#818cf8',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#969DAA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.8, display: 'block' }}>
                      Key Strengths & Differentiators
                    </Typography>
                    <List disablePadding>
                      {aiSummary.keyStrengths.map((str, idx) => (
                        <Box key={idx} display="flex" alignItems="flex-start" gap={1} mb={0.8}>
                          <StarIcon sx={{ fontSize: 16, color: '#f59e0b', mt: 0.2 }} />
                          <Typography variant="caption" sx={{ color: '#CBD5E1', fontSize: '0.84rem', lineHeight: 1.4 }}>
                            {str}
                          </Typography>
                        </Box>
                      ))}
                    </List>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#969DAA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.8, display: 'block' }}>
                      Recommended Target Roles
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.8}>
                      {aiSummary.recommendedRoles.map((role, idx) => (
                        <Chip
                          key={idx}
                          label={role}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(16, 185, 129, 0.12)',
                            color: '#34d399',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>

                  {aiSummary.careerTrajectory && (
                    <Box sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                      <Typography variant="caption" sx={{ color: '#A78BFA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5, display: 'block' }}>
                        Career Trajectory
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#969DAA', fontSize: '0.82rem', lineHeight: 1.5, display: 'block' }}>
                        {aiSummary.careerTrajectory}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8, px: 2, my: 'auto' }}>
                  <AiBrainIcon sx={{ fontSize: 52, color: '#626975', mb: 1.5, opacity: 0.5 }} />
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#F5F7FA', mb: 0.8 }}>
                    No Profile AI Summary Generated Yet
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#969DAA', display: 'block', mb: 3, maxWidth: 360, mx: 'auto' }}>
                    Fill in your resume details on the left and click "Generate Executive AI Summary" to build a dedicated AI evaluation of your profile.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleGenerateAiSummary}
                    disabled={generatingSummary}
                    sx={{
                      py: 1,
                      px: 2.5,
                      borderRadius: '8px',
                      color: '#06b6d4',
                      borderColor: 'rgba(6, 182, 212, 0.4)',
                      fontWeight: 700,
                      '&:hover': { borderColor: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.05)' },
                    }}
                  >
                    Generate AI Summary Now
                  </Button>
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* VIEW 2: JOB MATCHER & AVAILABLE OPEN JOBS */}
      {tab === 'jobs' && (
        <Box>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <WorkIcon sx={{ color: '#06b6d4', fontSize: 24 }} />
              <Typography variant="h6" fontWeight={700} sx={{ color: '#F5F7FA' }}>
                Open Position Requisitions ({jobs.length})
              </Typography>
            </Box>
          </Box>

          {jobError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
              {jobError}
            </Alert>
          )}

          {applySuccess && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: '8px' }}>
              {applySuccess}
            </Alert>
          )}

          {jobsLoading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress sx={{ color: '#06b6d4' }} />
            </Box>
          ) : jobs.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: '#0B0D10', borderRadius: '16px' }}>
              <Typography variant="subtitle1" sx={{ color: '#969DAA' }}>
                No active open jobs currently available.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {jobs.map((job) => (
                <Grid item xs={12} sm={6} lg={4} key={job.id}>
                  <Card
                    sx={{
                      p: 3,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      backgroundColor: '#0B0D10',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      transition: 'transform 180ms ease, border-color 180ms ease',
                      '&:hover': {
                        borderColor: 'rgba(99, 102, 241, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Box>
                      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
                        <Box>
                          <Typography variant="h6" fontWeight={700} sx={{ color: '#F5F7FA', fontSize: '1.05rem' }}>
                            {job.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#969DAA' }}>
                            {job.department} • {job.location} • {job.employmentType}
                          </Typography>
                        </Box>
                        {job.matchScore > 0 && (
                          <Chip
                            label={`${job.matchScore}% Match`}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: job.matchScore >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: job.matchScore >= 80 ? '#34d399' : '#fbbf24',
                              border: job.matchScore >= 80 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                            }}
                          />
                        )}
                      </Box>

                      <Typography variant="body2" sx={{ color: '#CBD5E1', mb: 2, lineHeight: 1.5, fontSize: '0.86rem' }}>
                        {job.description}
                      </Typography>

                      <Box mb={2}>
                        <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 0.6 }}>
                          Required Requisition Skills
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.6}>
                          {job.requiredSkills.split(',').map((skill, idx) => (
                            <Chip
                              key={idx}
                              label={skill.trim()}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.7rem',
                                backgroundColor: '#0F1219',
                                color: '#969DAA',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                              }}
                            />
                          ))}
                        </Box>
                      </Box>

                      {job.fitRationale && (
                        <Box sx={{ p: 1.5, backgroundColor: '#0F1219', borderRadius: '8px', mb: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                          <Typography variant="caption" sx={{ color: '#06b6d4', fontWeight: 600, display: 'block', mb: 0.4 }}>
                            AI Fit Rationale
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#969DAA', fontSize: '0.78rem', lineHeight: 1.4, display: 'block' }}>
                            {job.fitRationale}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Box pt={2} borderTop="1px solid rgba(255, 255, 255, 0.06)" display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" sx={{ color: '#626975' }}>
                        Experience Required: {job.experienceRequired}
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={applyingJobId === job.id}
                        onClick={() => handleApplyForJob(job.id)}
                        startIcon={applyingJobId === job.id ? <CircularProgress size={14} color="inherit" /> : <SendIcon sx={{ fontSize: 14 }} />}
                        sx={{
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          backgroundColor: '#6366f1',
                          '&:hover': { backgroundColor: '#4f46e5' },
                        }}
                      >
                        {applyingJobId === job.id ? 'Submitting...' : 'Apply Now'}
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* VIEW 3: MY APPLICATIONS & INTERVIEW SCHEDULE */}
      {tab === 'applications' && (
        <Box>
          <Box display="flex" alignItems="center" gap={1.5} mb={3}>
            <PipelineIcon sx={{ color: '#818cf8', fontSize: 24 }} />
            <Typography variant="h6" fontWeight={700} sx={{ color: '#F5F7FA' }}>
              My Applications & Active Hiring Processes ({applications.length})
            </Typography>
          </Box>

          {appsError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
              {appsError}
            </Alert>
          )}

          {appsLoading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress sx={{ color: '#818cf8' }} />
            </Box>
          ) : applications.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: '#0B0D10', borderRadius: '16px' }}>
              <Typography variant="subtitle1" sx={{ color: '#969DAA', mb: 1 }}>
                You have not submitted any job applications yet.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {applications.map((app) => {
                const activeStep = getPipelineStepIndex(app.status);
                const isRejected = app.status === 'REJECTED';

                return (
                  <Grid item xs={12} lg={6} key={app.id}>
                    <Card
                      sx={{
                        p: 3.5,
                        backgroundColor: '#0B0D10',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ color: '#F5F7FA', fontSize: '1.1rem' }}>
                          {app.job?.title || 'Job Position'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#969DAA' }}>
                          {app.job?.department} • Applied on {new Date(app.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip
                        label={app.status}
                        color={candidateStatusColor[app.status] || 'default'}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                      />
                    </Box>

                    {/* Vertical Pipeline Progress Trail */}
                    <Box sx={{ my: 2, px: 1 }}>
                      {isRejected ? (
                        <Alert severity="error" sx={{ borderRadius: '8px', backgroundColor: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                          Application status updated to <strong>REJECTED</strong> for this position requisition.
                        </Alert>
                      ) : (
                        <Stepper
                          activeStep={activeStep}
                          orientation="vertical"
                          sx={{
                            '& .MuiStepConnector-line': {
                              borderColor: 'rgba(99, 102, 241, 0.2)',
                              minHeight: 24,
                            },
                            '& .MuiStepIcon-root': {
                              color: '#151920',
                              '&.Mui-active': { color: '#6366f1' },
                              '&.Mui-completed': { color: '#10b981' },
                            },
                          }}
                        >
                          {PIPELINE_STAGES.map((stageLabel, index) => {
                            const isCurrent = index === activeStep;
                            const isCompleted = index < activeStep;
                            return (
                              <Step key={stageLabel} completed={isCompleted} active={isCurrent}>
                                <StepLabel
                                  sx={{
                                    py: 0.5,
                                    '& .MuiStepLabel-label': {
                                      fontSize: '0.88rem',
                                      fontWeight: isCurrent ? 700 : 600,
                                      color: isCurrent ? '#F5F7FA' : (isCompleted ? '#34d399' : '#626975'),
                                    },
                                  }}
                                >
                                  <Box display="flex" alignItems="center" gap={1.5}>
                                    <Typography variant="body2" fontWeight={isCurrent ? 700 : 600} sx={{ color: isCurrent ? '#F5F7FA' : (isCompleted ? '#34d399' : '#626975') }}>
                                      {stageLabel} STAGE
                                    </Typography>
                                    {isCurrent && (
                                      <Chip label="Current Active Stage" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, backgroundColor: 'rgba(99, 102, 241, 0.18)', color: '#818cf8', border: '1px solid rgba(129, 140, 248, 0.3)' }} />
                                    )}
                                    {isCompleted && (
                                      <Chip label="Passed" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)' }} />
                                    )}
                                  </Box>
                                </StepLabel>

                                <StepContent sx={{ borderLeftColor: isCompleted ? '#10b981' : (isCurrent ? '#6366f1' : 'rgba(255, 255, 255, 0.08)'), pb: 2.5, pl: 2.5 }}>
                                  {stageLabel === 'APPLIED' && (
                                    <Typography variant="caption" sx={{ color: '#969DAA', display: 'block', lineHeight: 1.5 }}>
                                      Application submitted on {new Date(app.createdAt).toLocaleDateString()}. Initial candidate dossier & profile details received.
                                    </Typography>
                                  )}

                                  {stageLabel === 'SCREENING' && (
                                    <Typography variant="caption" sx={{ color: '#969DAA', display: 'block', lineHeight: 1.5 }}>
                                      Recruiter screening in progress. Resume qualifications and technical background evaluation.
                                    </Typography>
                                  )}

                                  {stageLabel === 'INTERVIEW' && (
                                    <Box mt={0.5}>
                                      <Typography variant="caption" sx={{ color: '#969DAA', display: 'block', mb: 1.5, lineHeight: 1.5 }}>
                                        Scheduled interview rounds and live evaluation sessions for this requisition:
                                      </Typography>

                                      {app.interviews && app.interviews.length > 0 ? (
                                        <Grid container spacing={2}>
                                          {app.interviews.map((inv) => (
                                            <Grid item xs={12} sm={6} md={6} key={inv.id}>
                                              <Paper
                                                elevation={0}
                                                sx={{
                                                  p: 2,
                                                  backgroundColor: '#0F1219',
                                                  border: '1px solid rgba(99, 102, 241, 0.25)',
                                                  borderRadius: '10px',
                                                }}
                                              >
                                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                                  <Chip
                                                    label={`${inv.type} ROUND`}
                                                    size="small"
                                                    sx={{
                                                      height: 20,
                                                      fontSize: '0.65rem',
                                                      fontWeight: 700,
                                                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                                      color: '#818cf8',
                                                    }}
                                                  />
                                                  <Chip
                                                    label={inv.status}
                                                    size="small"
                                                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                                                  />
                                                </Box>

                                                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                                  <EventIcon sx={{ fontSize: 16, color: '#06b6d4' }} />
                                                  <Typography variant="caption" sx={{ color: '#F5F7FA', fontWeight: 600 }}>
                                                    {new Date(inv.scheduledAt).toLocaleString()} ({inv.duration} mins)
                                                  </Typography>
                                                </Box>

                                                <Typography variant="caption" sx={{ color: '#969DAA', display: 'block', mb: 1 }}>
                                                  Interviewer: {inv.interviewer?.name || 'Assigned Staff'}
                                                </Typography>

                                                {inv.meetingLink && (
                                                  <Link
                                                    href={inv.meetingLink}
                                                    target="_blank"
                                                    underline="none"
                                                    sx={{
                                                      display: 'inline-flex',
                                                      alignItems: 'center',
                                                      gap: 0.5,
                                                      fontSize: '0.78rem',
                                                      fontWeight: 700,
                                                      color: '#10b981',
                                                      '&:hover': { color: '#34d399' },
                                                    }}
                                                  >
                                                    <MeetingIcon sx={{ fontSize: 16 }} />
                                                    Join Interview Room
                                                  </Link>
                                                )}
                                              </Paper>
                                            </Grid>
                                          ))}
                                        </Grid>
                                      ) : (
                                        <Typography variant="caption" sx={{ color: '#626975', fontStyle: 'italic', display: 'block' }}>
                                          No interview sessions scheduled yet. Recruiter scheduling in progress.
                                        </Typography>
                                      )}
                                    </Box>
                                  )}

                                  {stageLabel === 'SHORTLISTED' && (
                                    <Typography variant="caption" sx={{ color: '#969DAA', display: 'block', lineHeight: 1.5 }}>
                                      Candidate profile recommended and shortlisted for final hiring manager review.
                                    </Typography>
                                  )}

                                  {stageLabel === 'HIRED' && (
                                    <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, display: 'block', lineHeight: 1.5 }}>
                                      Offer extended! Candidate successfully hired for this position requisition.
                                    </Typography>
                                  )}
                                </StepContent>
                              </Step>
                            );
                          })}
                        </Stepper>
                      )}
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CandidatePortal;
