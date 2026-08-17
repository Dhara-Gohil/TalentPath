import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, Grid, Chip, Button, CircularProgress, MenuItem, TextField, Paper, Tooltip } from '@mui/material';
import {
  AutoAwesome as AiIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { candidateService } from '../api/candidate.service';
import { interviewService } from '../api/interview.service';
import { aiService } from '../api/ai.service';
import { useAuth } from '../contexts/AuthContext';
import ScheduleInterviewModal from '../components/ScheduleInterviewModal';
import FeedbackModal from '../components/FeedbackModal';
import InterviewTracePipeline from '../components/InterviewTracePipeline';
import ViewScorecardModal from '../components/ViewScorecardModal';
import ViewAiSummaryModal from '../components/ViewAiSummaryModal';
import { renderFormattedText } from '../utils/textFormatter';
import { showToast } from '../utils/toast';
import type { CandidateStatus } from '../api/types';

const CandidateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isInterviewer = user?.role === 'INTERVIEWER';
  const [candidate, setCandidate] = useState<any>(null);
  const [aiEvaluation, setAiEvaluation] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<any>(null);
  const [defaultRoundType, setDefaultRoundType] = useState<'TECHNICAL' | 'HR' | 'MANAGERIAL' | 'CULTURAL'>('TECHNICAL');

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState('');
  const [activeRoundType, setActiveRoundType] = useState<string>('TECHNICAL');

  const [viewScorecardOpen, setViewScorecardOpen] = useState(false);
  const [viewingInterview, setViewingInterview] = useState<any>(null);

  const [aiProcessModalOpen, setAiProcessModalOpen] = useState(false);

  const loadingSteps = [
    'Extracting resume metadata...',
    'Cross-referencing job requirements...',
    'Synthesizing interviewer scorecards...',
    'Formulating final hiring recommendation...'
  ];

  const fetchCandidate = async () => {
    if (!id) return;
    try {
      const data = await candidateService.getCandidateById(id);
      setCandidate(data);
      if (data.aiEvaluation) {
        try {
          setAiEvaluation(JSON.parse(data.aiEvaluation));
        } catch (err) { }
      }
    } catch (error) {
      console.error('Failed to fetch candidate', error);
      showToast.apiError(error, 'Failed to load candidate details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  const isInInterviewProcess = Boolean((candidate?.interviews && candidate.interviews.length > 0) || candidate?.status === 'INTERVIEW' || candidate?.status === 'SHORTLISTED' || candidate?.status === 'HIRED');

  const generateAI = async () => {
    if (!id) return;
    setLoadingAi(true);
    setLoadingStepIndex(0);

    const interval = setInterval(() => {
      setLoadingStepIndex((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      const data = await aiService.evaluateCandidate(id);
      setAiEvaluation(data);
      showToast.success('AI Evaluation synthesized successfully!');
      fetchCandidate();
    } catch (error: any) {
      console.error('AI generation failed', error);
      showToast.apiError(error, 'Failed to generate AI evaluation');
    } finally {
      clearInterval(interval);
      setLoadingAi(false);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id) return;
    const newStatus = e.target.value as CandidateStatus;
    try {
      await candidateService.updateCandidateStatus(id, newStatus);
      showToast.success(`Candidate status updated to ${newStatus.replace('_', ' ')}`);
      fetchCandidate();
    } catch (error: any) {
      showToast.apiError(error, 'Failed to update status');
    }
  };

  const markInterviewCompleted = async (interviewId: string) => {
    try {
      await interviewService.updateInterviewStatus(interviewId, 'COMPLETED');
      showToast.success('Interview marked as completed');
      fetchCandidate();
    } catch (error: any) {
      showToast.apiError(error, 'Failed to mark interview as completed');
    }
  };

  const handleOpenScheduleForRound = (type: 'TECHNICAL' | 'HR' | 'MANAGERIAL' | 'CULTURAL') => {
    setDefaultRoundType(type);
    setEditingInterview(null);
    setScheduleModalOpen(true);
  };

  const handleOpenEditInterview = (interview: any) => {
    setEditingInterview(interview);
    setScheduleModalOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress size={32} sx={{ color: '#818cf8' }} />
      </Box>
    );
  }

  if (!candidate) return <Box p={3}><Typography color="error">Candidate record not found</Typography></Box>;

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 100px)',
        height: { xs: 'auto', md: 'calc(100vh - 100px)' },
        display: 'flex',
        flexDirection: 'column',
        overflowY: { xs: 'auto', md: 'hidden' },
        gap: 2
      }}
    >
      {/* Top Header Bar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <Button
            startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate('/candidates')}
            sx={{ color: '#969DAA', '&:hover': { color: '#F5F7FA' }, py: 0.5 }}
            size="small"
          >
            Back
          </Button>

          <Box>
            <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
              <Typography variant="h5" fontWeight={700} sx={{ color: '#F5F7FA', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {candidate.name}
              </Typography>
              <Chip
                label={`Req: ${candidate.job?.title}`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#818cf8', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: '#626975', fontSize: '0.75rem', display: 'block' }}>
              {candidate.email} • {candidate.phone} • {candidate.experienceYears} Yrs Experience
            </Typography>
          </Box>
        </Box>

        {/* Action Controls & Pipeline Stage Select */}
        <Box display="flex" alignItems="center" flexWrap="wrap" gap={1.5}>
          <Tooltip title={!isInInterviewProcess ? 'Candidate is not yet in the interview process. Schedule an interview session first.' : ''}>
            <span>
              <Button
                variant="contained"
                size="medium"
                disabled={!isInInterviewProcess}
                startIcon={<AiIcon sx={{ fontSize: 16 }} />}
                onClick={() => setAiProcessModalOpen(true)}
                sx={{
                  background: isInInterviewProcess ? 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)' : 'rgba(255,255,255,0.05)',
                  color: isInInterviewProcess ? '#ffffff' : '#626975',
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', sm: '0.82rem' },
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  borderRadius: '8px',
                  px: { xs: 1.5, sm: 2 },
                  height: 36,
                  boxShadow: 'none',
                  '&:hover': {
                    background: isInInterviewProcess ? 'linear-gradient(135deg, #4f46e5 0%, #0891b2 100%)' : 'rgba(255,255,255,0.05)',
                  }
                }}
              >
                Generate AI Interview Summary
              </Button>
            </span>
          </Tooltip>

          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
              Pipeline Stage:
            </Typography>
            {isInterviewer ? (
              <Chip
                size="small"
                label={candidate.status}
                sx={{
                  height: 32,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#F5F7FA',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  px: 1
                }}
              />
            ) : (
              <TextField
                select
                size="small"
                value={candidate.status}
                onChange={handleStatusChange}
                sx={{
                  minWidth: 140,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#0B0D10',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    height: 36
                  }
                }}
              >
                {['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'HIRED', 'REJECTED'].map(s => (
                  <MenuItem key={s} value={s} sx={{ fontSize: '0.8rem' }}>
                    <Box display="flex" alignItems="center">
                      <span className={`status-dot status-dot-${s.toLowerCase()}`}></span>
                      {s}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>
        </Box>
      </Box>

      {/* Middle Section: Horizontal Connected Trace Stepper */}
      <Box sx={{ width: '100%' }}>
        <InterviewTracePipeline
          interviews={candidate.interviews || []}
          onSchedule={handleOpenScheduleForRound}
          onEdit={handleOpenEditInterview}
          onSubmitFeedback={(interview) => { setSelectedInterviewId(interview.id); setActiveRoundType(interview.type); setFeedbackModalOpen(true); }}
          onViewScorecard={(interview) => { setViewingInterview(interview); setViewScorecardOpen(true); }}
          onMarkCompleted={markInterviewCompleted}
          onRefresh={fetchCandidate}
        />
      </Box>

      {/* Bottom Viewport-Fit Split Grid */}
      <Box sx={{ flex: { xs: 'none', md: 1 }, minHeight: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        {/* Left Card: Candidate Resume & Skills (Internal Scroll) */}
        <Card
          sx={{
            flex: 1,
            minHeight: { xs: '260px', md: 0 },
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#101318',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            p: { xs: 2, sm: 2.5 },
            overflowY: 'auto'
          }}
        >
          <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1, display: 'block' }}>
            Extracted Resume Profile
          </Typography>
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#0B0D10', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', mb: 2, flex: 1, overflowY: 'auto' }}>
            {renderFormattedText(candidate.resumeText)}
          </Paper>

          <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1, display: 'block' }}>
            Skills & Technical Competencies
          </Typography>
          <Box display="flex" gap={0.8} flexWrap="wrap">
            {candidate.skills.split(',').map((skill: string, index: number) => (
              <Chip
                key={index}
                label={skill.trim()}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  color: '#F5F7FA',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.72rem',
                }}
              />
            ))}
          </Box>
        </Card>

        {/* Right Card: ✦ AI Intelligence Evaluation (Resume vs Job) */}
        <Card
          className="ai-gradient-card"
          sx={{
            flex: 1,
            minHeight: { xs: '300px', md: 0 },
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '10px',
            p: { xs: 2, sm: 2.5 },
            overflowY: 'auto'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <AiIcon sx={{ fontSize: 18, color: '#818cf8' }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#F5F7FA', letterSpacing: '-0.01em' }}>
                AI Intelligence Evaluation
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="small"
              startIcon={loadingAi ? <CircularProgress size={12} sx={{ color: '#ffffff' }} /> : <AiIcon sx={{ fontSize: 14 }} />}
              onClick={generateAI}
              disabled={loadingAi}
              sx={{
                backgroundColor: '#6366f1',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                minWidth: 'fit-content',
                py: 0.4,
                '&:hover': { backgroundColor: '#4f46e5' }
              }}
            >
              {loadingAi ? 'Analyzing...' : (aiEvaluation ? 'Regenerate AI Review' : 'Generate AI Review')}
            </Button>
          </Box>

          {loadingAi && (
            <Box textAlign="center" py={5} className="ai-pulse-loading">
              <AiIcon sx={{ fontSize: 32, color: '#818cf8', mb: 1.5 }} />
              <Typography variant="body2" fontWeight={600} sx={{ color: '#818cf8' }} className="font-mono">
                {loadingSteps[loadingStepIndex]}
              </Typography>
              <Typography variant="caption" sx={{ color: '#626975', display: 'block', mt: 0.5 }}>
                Synthesizing resume qualifications against job requirements...
              </Typography>
            </Box>
          )}

          {!aiEvaluation && !loadingAi && (
            <Box textAlign="center" py={6} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <AiIcon sx={{ fontSize: 32, color: '#818cf8', mb: 1.5 }} />
              <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 0.8 }}>
                AI Resume Analysis Ready
              </Typography>
              <Typography color="#969DAA" variant="body2" sx={{ maxWidth: 300, mx: 'auto', lineHeight: 1.5, fontSize: '0.8rem', mb: 2 }}>
                Click 'Generate AI Review' to synthesize candidate resume qualifications against job requirements.
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AiIcon sx={{ fontSize: 14 }} />}
                onClick={generateAI}
                sx={{ backgroundColor: '#6366f1', borderRadius: '6px', fontSize: '0.78rem' }}
              >
                Generate AI Review
              </Button>
            </Box>
          )}

          {aiEvaluation && !loadingAi && (
            <Box sx={{ overflowY: 'auto', flex: 1 }}>
              {aiEvaluation.recommendation && (
                <Box
                  p={1.5}
                  mb={2}
                  sx={{
                    borderRadius: '6px',
                    backgroundColor: String(aiEvaluation.recommendation).includes('YES') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                    border: String(aiEvaluation.recommendation).includes('YES') ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(244, 63, 94, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#969DAA', fontWeight: 600 }}>
                    AI Recommendation
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: String(aiEvaluation.recommendation).includes('YES') ? '#10b981' : '#f43f5e' }} className="font-mono">
                    {aiEvaluation.recommendation}
                  </Typography>
                </Box>
              )}

              {aiEvaluation.summary && (
                <>
                  <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5, display: 'block' }}>
                    Executive Summary
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#969DAA', lineHeight: 1.5, mb: 2, fontSize: '0.82rem' }}>
                    {aiEvaluation.summary}
                  </Typography>
                </>
              )}

              {aiEvaluation.reasoning && (
                <>
                  <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5, display: 'block' }}>
                    Evaluation Reasoning
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#969DAA', lineHeight: 1.5, mb: 2, fontSize: '0.82rem' }}>
                    {aiEvaluation.reasoning}
                  </Typography>
                </>
              )}

              <Grid container spacing={2}>
                {Array.isArray(aiEvaluation.strengths) && aiEvaluation.strengths.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" fontWeight={600} sx={{ color: '#10b981', display: 'block', mb: 0.8 }}>
                      ✓ Identified Strengths
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#969DAA', fontSize: '0.78rem', lineHeight: 1.5 }}>
                      {aiEvaluation.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                  </Grid>
                )}

                {Array.isArray(aiEvaluation.weaknesses) && aiEvaluation.weaknesses.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" fontWeight={600} sx={{ color: '#f43f5e', display: 'block', mb: 0.8 }}>
                      ⚠ Risk Areas & Gaps
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#969DAA', fontSize: '0.78rem', lineHeight: 1.5 }}>
                      {aiEvaluation.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                    </ul>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </Card>
      </Box>

      <ScheduleInterviewModal
        open={scheduleModalOpen}
        onClose={() => { setScheduleModalOpen(false); setEditingInterview(null); }}
        candidateId={id!}
        defaultType={defaultRoundType}
        editingInterview={editingInterview}
        onInterviewScheduled={fetchCandidate}
      />
      <FeedbackModal
        open={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        interviewId={selectedInterviewId}
        roundType={activeRoundType}
        onFeedbackSubmitted={fetchCandidate}
      />
      <ViewScorecardModal
        open={viewScorecardOpen}
        onClose={() => setViewScorecardOpen(false)}
        interview={viewingInterview}
      />
      <ViewAiSummaryModal
        open={aiProcessModalOpen}
        onClose={() => setAiProcessModalOpen(false)}
        candidate={candidate}
        onEvaluationGenerated={fetchCandidate}
      />
    </Box>
  );
};

export default CandidateDetails;
