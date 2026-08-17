import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Grid, TextField, Button, Chip, Paper, Alert,
  CircularProgress, Stepper, Step, StepLabel, StepContent, Link, List,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Checkbox, FormControlLabel,
  Skeleton
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
  AutoAwesome as AiIcon,
  CheckCircle as CheckIcon,
  FileUpload as UploadIcon,
  Bookmark as BookmarkIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { candidateService } from '../api/candidate.service';
import type { CandidateProfile, CandidateProfileSummary, SuitableJobItem, MyCandidateApplication, CandidateStatus, SavedResume } from '../api/types';
import { candidateStatusColor } from '../theme/statusColors';
import ApplyJobModal from '../components/ApplyJobModal';
import { renderFormattedText } from '../utils/textFormatter';

const PIPELINE_STAGES: CandidateStatus[] = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'HIRED'];

const getPipelineStepIndex = (status: CandidateStatus): number => {
  if (status === 'REJECTED') return -1;
  const idx = PIPELINE_STAGES.indexOf(status);
  return idx !== -1 ? idx : 0;
};

interface CandidatePortalProps {
  tab?: 'profile' | 'jobs' | 'applications';
}

const CandidatePortal = ({ tab = 'profile' }: CandidatePortalProps) => {
  const navigate = useNavigate();
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
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedJobForApply, setSelectedJobForApply] = useState<SuitableJobItem | null>(null);

  // Applications State
  const [applications, setApplications] = useState<MyCandidateApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState('');

  // Saved Resumes Repository State
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [editingResumeId, setEditingResumeId] = useState<string | null>(null);
  const [newResumeTitle, setNewResumeTitle] = useState('');
  const [newResumeText, setNewResumeText] = useState('');
  const [newResumeAsDefault, setNewResumeAsDefault] = useState(false);
  const [savingResume, setSavingResume] = useState(false);
  const [resumeActionError, setResumeActionError] = useState('');

  // Load Profile on mount
  useEffect(() => {
    loadProfile();
    loadSavedResumes();
  }, []);

  const loadSavedResumes = async () => {
    setResumesLoading(true);
    try {
      const data = await candidateService.getSavedResumes();
      setSavedResumes(data);
    } catch (err) {
      console.error('Failed to load saved resumes', err);
    } finally {
      setResumesLoading(false);
    }
  };

  const handleOpenAddResumeModal = () => {
    setEditingResumeId(null);
    setNewResumeTitle('');
    setNewResumeText('');
    setNewResumeAsDefault(false);
    setResumeActionError('');
    setResumeModalOpen(true);
  };

  const handleOpenEditResumeModal = (sr: SavedResume) => {
    setEditingResumeId(sr.id);
    setNewResumeTitle(sr.title);
    setNewResumeText(sr.resumeText);
    setNewResumeAsDefault(sr.isDefault);
    setResumeActionError('');
    setResumeModalOpen(true);
  };

  const handleSaveSavedResume = async () => {
    if (!newResumeTitle.trim()) {
      setResumeActionError('Please enter a title for this resume.');
      return;
    }
    if (!newResumeText.trim() || newResumeText.trim().length < 10) {
      setResumeActionError('Resume text must be at least 10 characters.');
      return;
    }

    setSavingResume(true);
    setResumeActionError('');
    try {
      if (editingResumeId) {
        await candidateService.updateSavedResume(editingResumeId, {
          title: newResumeTitle.trim(),
          resumeText: newResumeText.trim(),
          setAsDefault: newResumeAsDefault,
        });
      } else {
        await candidateService.createSavedResume({
          title: newResumeTitle.trim(),
          resumeText: newResumeText.trim(),
          setAsDefault: newResumeAsDefault,
        });
      }
      setResumeModalOpen(false);
      await loadSavedResumes();
      await loadProfile();
    } catch (err: any) {
      setResumeActionError(err.response?.data?.error || err.message || 'Failed to save resume');
    } finally {
      setSavingResume(false);
    }
  };

  const handleDeleteSavedResume = async (resumeId: string) => {
    if (!window.confirm('Are you sure you want to delete this saved resume from your repository?')) return;
    try {
      await candidateService.deleteSavedResume(resumeId);
      await loadSavedResumes();
      await loadProfile();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete saved resume');
    }
  };

  const handleSetDefaultResume = async (resumeId: string) => {
    try {
      await candidateService.setDefaultResume(resumeId);
      await loadSavedResumes();
      await loadProfile();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to set default resume');
    }
  };

  // Trigger tab data fetching when tab prop changes
  useEffect(() => {
    if (tab === 'jobs' && jobs.length === 0) {
      if (profile.resumeText && profile.resumeText.length >= 10) {
        candidateService.updateProfile(profile).then(() => loadSuitableJobs()).catch(() => loadSuitableJobs());
      } else {
        loadSuitableJobs();
      }
    } else if (tab === 'applications') {
      loadMyApplications();
      const interval = setInterval(() => {
        candidateService.getMyApplications().then((data) => setApplications(data)).catch(() => {});
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [tab, profile]);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setProfile(prev => ({ ...prev, resumeText: text }));
        }
      };
      reader.readAsText(file);
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
      if (profile.resumeText && profile.resumeText.length >= 10) {
        await candidateService.updateProfile(profile);
      }
      const data = await candidateService.getSuitableJobs();
      setJobs(data);
    } catch (err: any) {
      setJobError(err.response?.data?.error || err.message || 'Failed to compute AI job recommendations');
    } finally {
      setMatchingJobs(false);
    }
  };

  const handleOpenApplyModal = (job: SuitableJobItem) => {
    setSelectedJobForApply(job);
    setApplyModalOpen(true);
  };

  const handleConfirmApply = async (payload: { jobId: string; resumeText: string; updateProfileResume: boolean }) => {
    setApplyingJobId(payload.jobId);
    setJobError('');
    setApplySuccess('');
    try {
      await candidateService.applyForJob({
        jobId: payload.jobId,
        resumeText: payload.resumeText,
        updateProfileResume: payload.updateProfileResume,
      });
      setApplySuccess('Job application submitted successfully with your confirmed resume! Your application is now in the recruitment pipeline.');
      setTimeout(() => setApplySuccess(''), 6000);
      loadSuitableJobs();
      loadMyApplications();
      loadProfile();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to submit job application';
      setJobError(msg);
      throw err;
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
      <Box sx={{ width: '100%' }}>
        <Paper elevation={0} sx={{ p: 3, backgroundColor: '#0B0D10', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', mb: 3 }}>
          <Skeleton variant="text" width={280} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.06)', mb: 1 }} />
          <Skeleton variant="text" width={420} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
        </Paper>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={7}>
            <Card sx={{ p: 3.5, backgroundColor: '#0B0D10', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px' }}>
              <Skeleton variant="text" width={220} height={28} sx={{ bgcolor: 'rgba(255,255,255,0.06)', mb: 3 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Skeleton variant="rounded" height={44} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: '8px', mb: 2 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Skeleton variant="rounded" height={44} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: '8px', mb: 2 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Skeleton variant="rounded" height={44} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: '8px', mb: 2 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Skeleton variant="rounded" height={44} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: '8px', mb: 2 }} />
                </Grid>
                <Grid item xs={12}>
                  <Skeleton variant="rounded" height={140} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: '8px' }} />
                </Grid>
              </Grid>
            </Card>
          </Grid>
          <Grid item xs={12} lg={5}>
            <Card sx={{ p: 3.5, backgroundColor: '#0B0D10', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px' }}>
              <Skeleton variant="text" width={200} height={28} sx={{ bgcolor: 'rgba(255,255,255,0.06)', mb: 2 }} />
              <Skeleton variant="rounded" height={100} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: '8px', mb: 2 }} />
              <Skeleton variant="rounded" height={80} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: '8px' }} />
            </Card>
          </Grid>
        </Grid>
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
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={1}>
                        <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
                          <Typography variant="caption" sx={{ color: '#C3C9D5', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            Candidate Stored Resume / Bio Text
                          </Typography>
                          {profile.resumeText && (
                            <Chip
                              icon={<CheckIcon sx={{ fontSize: '12px !important', color: '#34d399' }} />}
                              label="Stored in Profile"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                color: '#34d399',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                whiteSpace: 'nowrap'
                              }}
                            />
                          )}
                        </Box>
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography variant="caption" sx={{ color: '#626975', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                            {profile.resumeText.length} chars
                          </Typography>
                          <Button
                            component="label"
                            variant="outlined"
                            size="small"
                            startIcon={<UploadIcon sx={{ fontSize: 13 }} />}
                            sx={{
                              py: 0.2,
                              px: 1,
                              fontSize: '0.72rem',
                              whiteSpace: 'nowrap',
                              borderRadius: '6px',
                              color: '#818cf8',
                              borderColor: 'rgba(99, 102, 241, 0.3)',
                              '&:hover': { borderColor: '#818cf8', backgroundColor: 'rgba(99, 102, 241, 0.08)' }
                            }}
                          >
                            Import File
                            <input type="file" accept=".txt,.md,.text" hidden onChange={handleFileUpload} />
                          </Button>
                        </Box>
                      </Box>
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
                    boxShadow: 'none !important',
                    '&:hover': { backgroundColor: '#4f46e5', boxShadow: 'none !important' },
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

          {/* Saved Resume History Repository Section */}
          <Grid item xs={12}>
            <Card
              sx={{
                p: 3.5,
                backgroundColor: '#0B0D10',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                mt: 1,
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} mb={2.5}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <BookmarkIcon sx={{ color: '#6366f1', fontSize: 24 }} />
                  <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#F5F7FA', fontSize: '1.05rem' }}>
                      Saved Resumes Repository & History ({savedResumes.length})
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#969DAA', fontSize: '0.78rem' }}>
                      Store and manage multiple versions of your resume to use directly during job applications.
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                  onClick={handleOpenAddResumeModal}
                  sx={{
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    backgroundColor: '#6366f1',
                    color: '#ffffff',
                    '&:hover': { backgroundColor: '#4f46e5' },
                  }}
                >
                  Save New Resume to History
                </Button>
              </Box>

              {resumesLoading ? (
                <Grid container spacing={2}>
                  {[1, 2, 3].map((i) => (
                    <Grid item xs={12} sm={6} md={4} key={i}>
                      <Paper sx={{ p: 2.5, backgroundColor: '#0F1219', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Skeleton variant="text" width="70%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.06)', mb: 1 }} />
                        <Skeleton variant="text" width="40%" height={16} sx={{ bgcolor: 'rgba(255,255,255,0.04)', mb: 2 }} />
                        <Skeleton variant="rounded" height={80} sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: '6px', mb: 2 }} />
                        <Box display="flex" justifyContent="space-between">
                          <Skeleton variant="text" width={80} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                          <Skeleton variant="circular" width={24} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : savedResumes.length === 0 ? (
                <Box textAlign="center" py={4} sx={{ backgroundColor: '#0F1219', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                  <ResumeIcon sx={{ fontSize: 36, color: '#626975', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#969DAA', fontWeight: 600, mb: 0.5 }}>
                    No saved resume history in your repository yet.
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#626975', display: 'block', mb: 2, maxWidth: 500, mx: 'auto' }}>
                    Save different versions of your resume (e.g., Senior Full Stack, Frontend Specialist, Technical Lead) to easily select between them when applying for jobs.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                    onClick={handleOpenAddResumeModal}
                    sx={{ borderRadius: '8px', fontSize: '0.75rem', color: '#818cf8', borderColor: 'rgba(129, 140, 248, 0.3)' }}
                  >
                    Add Your First Saved Resume
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {savedResumes.map((sr) => (
                    <Grid item xs={12} sm={6} md={4} key={sr.id}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          backgroundColor: '#0F1219',
                          border: sr.isDefault ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                        }}
                      >
                        <Box>
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#F5F7FA', fontSize: '0.92rem' }}>
                              {sr.title}
                            </Typography>
                            {sr.isDefault && (
                              <Chip
                                label="Active Default"
                                size="small"
                                icon={<StarIcon sx={{ fontSize: '12px !important', color: '#34d399' }} />}
                                sx={{
                                  height: 20,
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                  color: '#34d399',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                }}
                              />
                            )}
                          </Box>

                          <Typography variant="caption" sx={{ color: '#626975', display: 'block', mb: 1.2 }}>
                            Updated on {new Date(sr.updatedAt).toLocaleDateString()} • {sr.resumeText.length} chars
                          </Typography>

                          <Box
                            sx={{
                              maxHeight: 95,
                              overflowY: 'auto',
                              p: 1.2,
                              backgroundColor: '#0B0D10',
                              borderRadius: '6px',
                              border: '1px solid rgba(255,255,255,0.05)',
                              mb: 2,
                              '&::-webkit-scrollbar': { width: '3px' },
                              '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.1)' },
                            }}
                          >
                            <Typography variant="caption" sx={{ color: '#CBD5E1', fontSize: '0.76rem', lineHeight: 1.4, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                              {sr.resumeText}
                            </Typography>
                          </Box>
                        </Box>

                        <Box display="flex" alignItems="center" justifyContent="space-between" pt={1.5} borderTop="1px solid rgba(255, 255, 255, 0.06)">
                          {!sr.isDefault ? (
                            <Button
                              size="small"
                              onClick={() => handleSetDefaultResume(sr.id)}
                              sx={{ fontSize: '0.7rem', color: '#34d399', p: 0, fontWeight: 700, '&:hover': { color: '#10b981' } }}
                            >
                              Set Active Default
                            </Button>
                          ) : (
                            <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 700, fontSize: '0.7rem' }}>
                              ✓ Current Active
                            </Typography>
                          )}

                          <Box display="flex" alignItems="center" gap={0.5}>
                            <IconButton size="small" onClick={() => handleOpenEditResumeModal(sr)} sx={{ color: '#818cf8', p: 0.5 }}>
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteSavedResume(sr.id)} sx={{ color: '#f43f5e', p: 0.5 }}>
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Dialog Modal for Add/Edit Saved Resume */}
      <Dialog
        open={resumeModalOpen}
        onClose={() => setResumeModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#0B0D10',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            color: '#F5F7FA',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <BookmarkIcon sx={{ color: '#818cf8', fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={700}>
              {editingResumeId ? 'Edit Saved Resume Version' : 'Save New Resume to History'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setResumeModalOpen(false)} sx={{ color: '#626975' }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5 }}>
          {resumeActionError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px', fontSize: '0.8rem' }}>
              {resumeActionError}
            </Alert>
          )}

          <Box mb={2}>
            <Typography variant="caption" sx={{ color: '#C3C9D5', fontWeight: 600, mb: 0.6, display: 'block' }}>
              Resume Title / Version Name *
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. Full Stack Senior Resume 2026, Frontend Specialist CV"
              value={newResumeTitle}
              onChange={(e) => setNewResumeTitle(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0F1219',
                  color: '#F5F7FA',
                  borderRadius: '8px',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                },
              }}
            />
          </Box>

          <Box mb={2}>
            <Typography variant="caption" sx={{ color: '#C3C9D5', fontWeight: 600, mb: 0.6, display: 'block' }}>
              Resume Text Content *
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={8}
              placeholder="Paste complete resume details, skills, summary, and experience..."
              value={newResumeText}
              onChange={(e) => setNewResumeText(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0F1219',
                  color: '#F5F7FA',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                },
              }}
            />
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={newResumeAsDefault}
                onChange={(e) => setNewResumeAsDefault(e.target.checked)}
                sx={{ color: '#6366f1', '&.Mui-checked': { color: '#6366f1' } }}
              />
            }
            label={
              <Typography variant="caption" sx={{ color: '#CBD5E1', fontSize: '0.82rem' }}>
                Set as my active default resume for profile & AI job matching
              </Typography>
            }
          />
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Button onClick={() => setResumeModalOpen(false)} variant="outlined" size="small" sx={{ borderRadius: '8px', color: '#969DAA' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveSavedResume}
            disabled={savingResume}
            variant="contained"
            size="small"
            startIcon={savingResume ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ borderRadius: '8px', backgroundColor: '#6366f1', color: '#ffffff', '&:hover': { backgroundColor: '#4f46e5' } }}
          >
            {savingResume ? 'Saving...' : 'Save to History'}
          </Button>
        </DialogActions>
      </Dialog>

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
            <Grid container spacing={3}>
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <Grid item xs={12} sm={6} lg={4} key={idx}>
                  <Card sx={{ p: 3, backgroundColor: '#0B0D10', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px' }}>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Box flex={1} mr={2}>
                        <Skeleton variant="text" width="80%" height={26} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                        <Skeleton variant="text" width="60%" height={18} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                      </Box>
                      <Skeleton variant="rounded" width={60} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: '12px' }} />
                    </Box>
                    <Skeleton variant="rounded" height={140} sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: '8px', mb: 2 }} />
                    <Box display="flex" gap={1} mb={2}>
                      <Skeleton variant="rounded" width={50} height={22} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                      <Skeleton variant="rounded" width={60} height={22} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                      <Skeleton variant="rounded" width={55} height={22} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Skeleton variant="text" width={100} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                      <Skeleton variant="rounded" width={90} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: '6px' }} />
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
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

                      <Box
                        sx={{
                          maxHeight: 180,
                          overflowY: 'auto',
                          mb: 2,
                          p: 1.5,
                          backgroundColor: '#0F1219',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          '&::-webkit-scrollbar': {
                            width: '4px',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            borderRadius: '4px',
                          },
                        }}
                      >
                        {renderFormattedText(job.description)}
                      </Box>

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

                    <Box pt={2} borderTop="1px solid rgba(255, 255, 255, 0.06)" display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                      <Typography variant="caption" sx={{ color: '#626975' }}>
                        Experience Required: {job.experienceRequired}
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={applyingJobId === job.id}
                        onClick={() => handleOpenApplyModal(job)}
                        startIcon={applyingJobId === job.id ? <CircularProgress size={14} color="inherit" /> : <SendIcon sx={{ fontSize: 14 }} />}
                        sx={{
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          whiteSpace: 'nowrap',
                          minWidth: 'fit-content',
                          backgroundColor: '#6366f1',
                          boxShadow: 'none !important',
                          '&:hover': { backgroundColor: '#4f46e5', boxShadow: 'none !important' },
                        }}
                      >
                        {applyingJobId === job.id ? 'Applying...' : 'Apply Now'}
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
            <Grid container spacing={3}>
              {[1, 2, 3, 4].map((i) => (
                <Grid item xs={12} lg={6} key={i}>
                  <Card sx={{ p: 3.5, backgroundColor: '#0B0D10', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px' }}>
                    <Box display="flex" justifyContent="space-between" mb={3}>
                      <Box flex={1}>
                        <Skeleton variant="text" width="60%" height={28} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                        <Skeleton variant="text" width="40%" height={18} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                      </Box>
                      <Skeleton variant="rounded" width={70} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                    </Box>
                    <Skeleton variant="rounded" height={160} sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: '10px' }} />
                  </Card>
                </Grid>
              ))}
            </Grid>
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
                  <Grid sx={{height:"100%"}} item xs={12} lg={6} key={app.id}>
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
                                            <Grid item xs={12} sm={6} key={inv.id}>
                                              <Paper
                                                elevation={0}
                                                sx={{
                                                  p: 2,
                                                  backgroundColor: '#0F1219',
                                                  border: inv.status === 'COMPLETED'
                                                    ? '1px solid rgba(16, 185, 129, 0.3)'
                                                    : inv.status === 'IN_PROGRESS'
                                                    ? '1px solid rgba(6, 182, 212, 0.4)'
                                                    : '1px solid rgba(99, 102, 241, 0.25)',
                                                  borderRadius: '10px',
                                                }}
                                              >
                                                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={1.2}>
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
                                                  {inv.status === 'IN_PROGRESS' ? (
                                                     <Button
                                                       size="small"
                                                       variant="contained"
                                                       startIcon={<AiIcon sx={{ fontSize: 13 }} />}
                                                       onClick={() => navigate(`/interviews/${inv.id}/copilot`)}
                                                       sx={{
                                                         height: 24,
                                                         fontSize: '0.72rem',
                                                         fontWeight: 700,
                                                         whiteSpace: 'nowrap',
                                                         background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                                                         color: '#ffffff',
                                                         borderRadius: '6px',
                                                         py: 0,
                                                         px: 1.5,
                                                         boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
                                                         '&:hover': {
                                                           background: 'linear-gradient(135deg, #4f46e5 0%, #0891b2 100%)',
                                                         }
                                                       }}
                                                     >
                                                       Join Live Session
                                                     </Button>
                                                   ) : (inv.status === 'SCHEDULED' || inv.status === 'RESCHEDULED') ? (
                                                     <Chip
                                                       label="Waiting for interviewer to start"
                                                       size="small"
                                                       sx={{
                                                         height: 20,
                                                         fontSize: '0.62rem',
                                                         fontWeight: 600,
                                                         bgcolor: 'rgba(255, 255, 255, 0.05)',
                                                         color: '#969DAA',
                                                         border: '1px solid rgba(255, 255, 255, 0.1)',
                                                         maxWidth: '100%'
                                                       }}
                                                     />
                                                   ) : (
                                                     <Chip
                                                       label={inv.status}
                                                       size="small"
                                                       color={inv.status === 'COMPLETED' ? 'success' : 'default'}
                                                       sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                                     />
                                                   )}
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
                                                      mr: 2,
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
                                    <Paper
                                      elevation={0}
                                      sx={{
                                        p: 2,
                                        mt: 1,
                                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        borderRadius: '10px'
                                      }}
                                    >
                                      <Box display="flex" alignItems="center" gap={1.2}>
                                        <CheckIcon sx={{ color: '#10b981', fontSize: 22 }} />
                                        <Box>
                                          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#10b981' }}>
                                            🎉 Congratulations! Offer Extended
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: '#969DAA', display: 'block', lineHeight: 1.4, mt: 0.3 }}>
                                            You have successfully cleared all interview rounds for <strong>{app.job?.title || 'this position'}</strong>! Our talent acquisition team will be in touch with your formal offer details.
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </Paper>
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

      {/* Confirmation & Resume Customization Modal for Job Application */}
      <ApplyJobModal
        open={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        job={selectedJobForApply}
        profile={profile}
        onConfirmApply={handleConfirmApply}
      />
    </Box>
  );
};

export default CandidatePortal;
