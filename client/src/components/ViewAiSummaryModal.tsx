import { useState, useEffect } from 'react';
import { Drawer, Box, Typography, IconButton, Button, Chip, Grid, CircularProgress, Paper } from '@mui/material';
import { Close as CloseIcon, AutoAwesome as AiIcon, Refresh as RefreshIcon, EventAvailableOutlined as RoundIcon } from '@mui/icons-material';
import { aiService } from '../api/ai.service';

interface Props {
  open: boolean;
  onClose: () => void;
  candidate: any;
  onEvaluationGenerated?: () => void;
}

const loadingSteps = [
  'Extracting interview trace points...',
  'Cross-referencing 4-round scorecards...',
  'Synthesizing interviewer notes & ratings...',
  'Formulating final hiring recommendation...'
];

const ViewAiSummaryModal = ({ open, onClose, candidate, onEvaluationGenerated }: Props) => {
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    setEvaluation(null);

    if (candidate) {
      const scorecardsCount = candidate.interviews
        ? candidate.interviews.reduce((acc: number, curr: any) => acc + (Array.isArray(curr.feedback) ? curr.feedback.length : Array.isArray(curr.feedbacks) ? curr.feedbacks.length : 0), 0)
        : (Array.isArray(candidate.feedbacks) ? candidate.feedbacks.length : Array.isArray(candidate.feedback) ? candidate.feedback.length : 0);

      // ONLY parse and display evaluation if candidate actually has completed scorecards
      if (scorecardsCount > 0 && candidate.aiEvaluation) {
        let parsed: any = null;
        if (typeof candidate.aiEvaluation === 'string') {
          try {
            parsed = JSON.parse(candidate.aiEvaluation);
          } catch (e) {
            parsed = null;
          }
        } else if (typeof candidate.aiEvaluation === 'object') {
          parsed = candidate.aiEvaluation;
        }

        if (parsed && (parsed.summary || parsed.roundAnalysis)) {
          setEvaluation(parsed);
        }
      }
    }
  }, [candidate?.id, candidate?.aiEvaluation, candidate?.interviews, open]);

  const completedScorecardsCount = candidate?.interviews
    ? candidate.interviews.reduce((acc: number, curr: any) => acc + (Array.isArray(curr.feedback) ? curr.feedback.length : Array.isArray(curr.feedbacks) ? curr.feedbacks.length : 0), 0)
    : (Array.isArray(candidate?.feedbacks) ? candidate.feedbacks.length : Array.isArray(candidate?.feedback) ? candidate.feedback.length : 0);

  const handleGenerateAI = async () => {
    if (!candidate || completedScorecardsCount === 0) return;
    setLoading(true);
    setError('');
    setLoadingStepIndex(0);

    const interval = setInterval(() => {
      setLoadingStepIndex((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      const data = await aiService.evaluateInterviews(candidate.id);
      setEvaluation(data);
      if (onEvaluationGenerated) onEvaluationGenerated();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to generate AI interview process summary');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  if (!candidate) return null;

  const isPendingFeedback = evaluation?.recommendation === 'PENDING_INTERVIEW_FEEDBACK' || (completedScorecardsCount === 0 && !evaluation?.roundAnalysis);
  const isRecommended = evaluation?.recommendation?.toUpperCase().includes('YES');

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 540 },
          backgroundColor: '#0B0D10',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'none !important',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
    >
      {/* Panel Header */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 0.8, borderRadius: '6px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', display: 'flex' }}>
            <AiIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#F5F7FA', lineHeight: 1.2 }}>
              Interview Process AI Summary
            </Typography>
            <Typography variant="caption" sx={{ color: '#626975', fontSize: '0.72rem' }}>
              {completedScorecardsCount === 0
                ? 'Scorecards Required for AI Summary'
                : completedScorecardsCount < 4
                ? `Synthesized from ${completedScorecardsCount} completed interview scorecard(s)`
                : 'Synthesized from scorecards across all 4 interview steps'}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#626975', '&:hover': { color: '#F5F7FA' } }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Panel Body */}
      <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
        {/* Candidate Info Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} p={1.5} sx={{ backgroundColor: '#151920', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ color: '#F5F7FA' }}>
              {candidate.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#626975' }}>
              Target Role: {candidate.job?.title || 'General Opening'}
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={loading ? <CircularProgress size={12} sx={{ color: '#818cf8' }} /> : <RefreshIcon sx={{ fontSize: 14 }} />}
            onClick={handleGenerateAI}
            disabled={loading || completedScorecardsCount === 0}
            sx={{ borderRadius: '6px', fontSize: '0.72rem', color: '#818cf8', borderColor: 'rgba(129, 140, 248, 0.3)' }}
          >
            {loading ? 'Synthesizing...' : (evaluation ? 'Regenerate Summary' : 'Generate AI Summary')}
          </Button>
        </Box>

        {error && (
          <Paper sx={{ p: 2, mb: 3, backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', color: '#f43f5e', fontSize: '0.8rem' }}>
            {error}
          </Paper>
        )}

        {/* Loading State */}
        {loading && (
          <Box textAlign="center" py={6} className="ai-pulse-loading">
            <AiIcon sx={{ fontSize: 36, color: '#818cf8', mb: 1.5 }} />
            <Typography variant="body2" fontWeight={600} sx={{ color: '#818cf8' }} className="font-mono">
              {loadingSteps[loadingStepIndex]}
            </Typography>
            <Typography variant="caption" sx={{ color: '#626975', display: 'block', mt: 0.8 }}>
              Analyzing scorecards from Technical, HR, Managerial, and Cultural rounds...
            </Typography>
          </Box>
        )}

        {/* Empty State / 0 Scorecards */}
        {!evaluation && !loading && (
          <Box textAlign="center" py={5}>
            <AiIcon sx={{ fontSize: 36, color: completedScorecardsCount === 0 ? '#f59e0b' : '#626975', mb: 1.5 }} />
            <Typography variant="body2" color="#969DAA" mb={1}>
              {completedScorecardsCount === 0
                ? `No interview scorecards submitted yet for ${candidate.name}.`
                : `No AI evaluation summary generated yet for ${candidate.name}.`}
            </Typography>
            <Typography variant="caption" sx={{ color: '#626975', display: 'block', mb: 2, maxWidth: 400, mx: 'auto' }}>
              {completedScorecardsCount === 0
                ? 'An AI Interview Summary can only be synthesized after at least one interview scorecard is submitted by an interviewer.'
                : 'Click below to synthesize all submitted interview scorecards into an executive process summary.'}
            </Typography>
            {completedScorecardsCount > 0 && (
              <Button
                variant="contained"
                startIcon={<AiIcon sx={{ fontSize: 14 }} />}
                onClick={handleGenerateAI}
                sx={{ backgroundColor: '#6366f1', borderRadius: '6px', fontSize: '0.78rem' }}
              >
                Generate AI Summary
              </Button>
            )}
          </Box>
        )}

        {/* Generated Evaluation Report */}
        {evaluation && !loading && (
          <Box>
            {/* Recommendation Banner */}
            <Box
              p={2}
              mb={3}
              sx={{
                borderRadius: '8px',
                backgroundColor: isPendingFeedback
                  ? 'rgba(99, 102, 241, 0.1)'
                  : isRecommended
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(244, 63, 94, 0.1)',
                border: isPendingFeedback
                  ? '1px solid rgba(99, 102, 241, 0.25)'
                  : isRecommended
                  ? '1px solid rgba(16, 185, 129, 0.25)'
                  : '1px solid rgba(244, 63, 94, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Typography variant="caption" sx={{ color: '#969DAA', fontWeight: 600 }}>
                {completedScorecardsCount === 0
                  ? 'Pre-Interview Screening Recommendation'
                  : completedScorecardsCount < 4
                  ? `In-Progress Evaluation (${completedScorecardsCount}/4 Rounds Completed)`
                  : '4-Round Synthesized Recommendation'}
              </Typography>
              <Chip
                label={isPendingFeedback ? 'PENDING INTERVIEW SCORECARDS' : evaluation.recommendation}
                sx={{
                  height: 24,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: isPendingFeedback ? '#6366f1' : isRecommended ? '#10b981' : '#f43f5e',
                  color: '#ffffff',
                }}
                className="font-mono"
              />
            </Box>

            {/* Executive Summary */}
            <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.8, display: 'block' }}>
              {completedScorecardsCount === 0 ? 'Pre-Interview Candidate Assessment' : 'Executive Interview Process Summary'}
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: '#151920', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', mb: 3 }}>
              <Typography variant="body2" sx={{ color: '#969DAA', lineHeight: 1.6, fontSize: '0.84rem' }}>
                {evaluation.summary}
              </Typography>
            </Paper>

            {/* 4-Step Round Takeaways Breakdown */}
            {evaluation.roundAnalysis && (
              <>
                <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1, display: 'block' }}>
                  4-Step Round Breakdown & Takeaways
                </Typography>

                <Grid container spacing={1.5} mb={3}>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 1.5, backgroundColor: '#151920', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px' }}>
                      <Box display="flex" alignItems="center" gap={0.8} mb={0.5}>
                        <RoundIcon sx={{ fontSize: 14, color: '#6366f1' }} />
                        <Typography variant="caption" fontWeight={700} sx={{ color: '#F5F7FA' }}>
                          1. Technical Evaluation
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#969DAA', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        {evaluation.roundAnalysis.technical || 'Pending evaluation'}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 1.5, backgroundColor: '#151920', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px' }}>
                      <Box display="flex" alignItems="center" gap={0.8} mb={0.5}>
                        <RoundIcon sx={{ fontSize: 14, color: '#06b6d4' }} />
                        <Typography variant="caption" fontWeight={700} sx={{ color: '#F5F7FA' }}>
                          2. HR & Screening
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#969DAA', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        {evaluation.roundAnalysis.hr || 'Pending evaluation'}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 1.5, backgroundColor: '#151920', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px' }}>
                      <Box display="flex" alignItems="center" gap={0.8} mb={0.5}>
                        <RoundIcon sx={{ fontSize: 14, color: '#818cf8' }} />
                        <Typography variant="caption" fontWeight={700} sx={{ color: '#F5F7FA' }}>
                          3. Managerial Round
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#969DAA', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        {evaluation.roundAnalysis.managerial || 'Pending evaluation'}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 1.5, backgroundColor: '#151920', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px' }}>
                      <Box display="flex" alignItems="center" gap={0.8} mb={0.5}>
                        <RoundIcon sx={{ fontSize: 14, color: '#10b981' }} />
                        <Typography variant="caption" fontWeight={700} sx={{ color: '#F5F7FA' }}>
                          4. Cultural Fit
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#969DAA', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        {evaluation.roundAnalysis.cultural || 'Pending evaluation'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </>
            )}

            {/* Strengths & Weaknesses */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" fontWeight={600} sx={{ color: '#10b981', display: 'block', mb: 0.8 }}>
                  ✓ Interviewer Verified Strengths
                </Typography>
                <Paper sx={{ p: 1.5, backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '6px' }}>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#969DAA', fontSize: '0.78rem', lineHeight: 1.5 }}>
                    {evaluation.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" fontWeight={600} sx={{ color: '#f43f5e', display: 'block', mb: 0.8 }}>
                  ⚠ Red Flags & Risk Areas
                </Typography>
                <Paper sx={{ p: 1.5, backgroundColor: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.15)', borderRadius: '6px' }}>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#969DAA', fontSize: '0.78rem', lineHeight: 1.5 }}>
                    {evaluation.weaknesses?.map((w: string, i: number) => <li key={i}>{w}</li>)}
                  </ul>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={onClose} variant="outlined" size="medium" sx={{ borderRadius: '6px' }}>
          Close Panel
        </Button>
      </Box>
    </Drawer>
  );
};

export default ViewAiSummaryModal;
