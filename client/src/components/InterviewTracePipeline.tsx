import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Chip, Paper, IconButton, Tooltip, TextField, MenuItem } from '@mui/material';
import {
  CheckCircle as CheckIcon,
  LockOutlined as LockIcon,
  Event as EventIcon,
  EditOutlined as EditIcon,
  DeleteOutline as DeleteIcon,
  RateReviewOutlined as CommentIcon,
  OpenInNew as LinkIcon,
  ChevronRight as ChevronIcon,
  VisibilityOutlined as ViewIcon,
  AutoAwesome as AiIcon
} from '@mui/icons-material';
import apiClient from '../api/client';
import { interviewService } from '../api/interview.service';
import { useAuth } from '../contexts/AuthContext';

export interface RoundDef {
  type: 'TECHNICAL' | 'HR' | 'MANAGERIAL' | 'CULTURAL';
  title: string;
  subtitle: string;
  step: number;
}

const ROUNDS: RoundDef[] = [
  { step: 1, type: 'TECHNICAL', title: '1. Technical', subtitle: 'Architecture & Coding' },
  { step: 2, type: 'HR', title: '2. HR & Culture', subtitle: 'Background & Culture' },
  { step: 3, type: 'MANAGERIAL', title: '3. Managerial', subtitle: 'Leadership & Execution' },
  { step: 4, type: 'CULTURAL', title: '4. Cultural Fit', subtitle: 'Values Alignment' },
];

interface Props {
  interviews: any[];
  onSchedule: (type: 'TECHNICAL' | 'HR' | 'MANAGERIAL' | 'CULTURAL') => void;
  onEdit: (interview: any) => void;
  onSubmitFeedback: (interview: any) => void;
  onViewScorecard: (interview: any) => void;
  onMarkCompleted: (interviewId: string) => void;
  onRefresh: () => void;
}

const InterviewTracePipeline = ({
  interviews,
  onSchedule,
  onEdit,
  onSubmitFeedback,
  onViewScorecard,
  onMarkCompleted,
  onRefresh
}: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isInterviewer = user?.role === 'INTERVIEWER';
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);

  useEffect(() => {
    if (!interviews || interviews.length === 0) return;

    // Find the index of the trace point assigned to the logged-in user
    const assignedIndex = ROUNDS.findIndex(round => {
      const interview = interviews.find(i => i.type === round.type);
      return interview && (interview.interviewerId === user?.id || interview.interviewer?.id === user?.id);
    });

    if (assignedIndex !== -1) {
      setSelectedStepIndex(assignedIndex);
    } else {
      // Fallback: select active/scheduled or pending feedback round
      const activeIndex = ROUNDS.findIndex(round => {
        const interview = interviews.find(i => i.type === round.type);
        return interview && (interview.status === 'SCHEDULED' || (interview.status === 'COMPLETED' && (!interview.feedback || interview.feedback.length === 0)));
      });
      if (activeIndex !== -1) {
        setSelectedStepIndex(activeIndex);
      }
    }
  }, [interviews, user?.id]);

  const handleDelete = async (interviewId: string) => {
    if (!window.confirm('Are you sure you want to cancel and delete this interview session?')) return;
    setDeletingId(interviewId);
    try {
      await apiClient.delete(`/interviews/${interviewId}`);
      onRefresh();
    } catch (err) {
      alert('Failed to delete interview session');
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartCopilot = async (interviewId: string) => {
    try {
      await interviewService.updateInterviewStatus(interviewId, 'IN_PROGRESS');
    } catch (err) {
      console.error('Failed to update interview status to IN_PROGRESS', err);
    }
    navigate(`/interviews/${interviewId}/copilot`);
  };

  const isRoundCompleted = (type: string) => {
    const existing = interviews.find(i => i.type === type);
    return existing && existing.status === 'COMPLETED' && existing.feedback && existing.feedback.length > 0;
  };

  const activeRoundDef = ROUNDS[selectedStepIndex] || ROUNDS[0];
  const activeInterview = interviews.find(i => i.type === activeRoundDef.type);
  const previousCompleted = selectedStepIndex === 0 || isRoundCompleted(ROUNDS[selectedStepIndex - 1].type);

  const isAssignedToMe = activeInterview && (activeInterview.interviewerId === user?.id || activeInterview.interviewer?.id === user?.id);
  const isOtherInterviewer = isInterviewer && activeInterview && !isAssignedToMe;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Mobile / Tablet Round Select Dropdown (< md) */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
        <TextField
          select
          fullWidth
          size="small"
          label="Select Active Interview Round"
          value={selectedStepIndex}
          onChange={(e) => setSelectedStepIndex(Number(e.target.value))}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#0B0D10',
              borderRadius: '8px',
              color: '#F5F7FA',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          {ROUNDS.map((round, idx) => {
            const interview = interviews.find(i => i.type === round.type);
            const isCompleted = interview && interview.status === 'COMPLETED' && interview.feedback && interview.feedback.length > 0;
            const isCompletedPending = interview && interview.status === 'COMPLETED' && (!interview.feedback || interview.feedback.length === 0);
            const isScheduled = interview && interview.status === 'SCHEDULED';
            const isPrevDone = idx === 0 || isRoundCompleted(ROUNDS[idx - 1].type);
            const isSchedulable = !interview && isPrevDone;
            const isLocked = !interview && !isPrevDone;

            const statusText = isCompleted
              ? '✓ Verified Scorecard'
              : isCompletedPending
                ? '⏱ Pending Scorecard'
                : isScheduled
                  ? '📅 Session Scheduled'
                  : isSchedulable
                    ? 'Schedulable'
                    : '🔒 Locked';

            return (
              <MenuItem key={round.type} value={idx} sx={{ fontSize: '0.82rem', py: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                  <Typography variant="body2" fontWeight={600} sx={{ color: isLocked ? '#969DAA' : '#F5F7FA' }}>
                    {round.title} ({round.subtitle})
                  </Typography>
                  <Typography variant="caption" sx={{ ml: 2, fontWeight: 600, color: isCompleted ? '#10b981' : isScheduled ? '#818cf8' : isCompletedPending ? '#f59e0b' : isLocked ? '#fb7185' : '#06b6d4' }}>
                    {statusText}
                  </Typography>
                </Box>
              </MenuItem>
            );
          })}
        </TextField>
      </Box>

      {/* Desktop Horizontal Connected Stepper Line (>= md) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justify: 'space-between',
          position: 'relative',
          px: 1,
          mb: 2.5,
          gap: 1
        }}
      >
        {ROUNDS.map((round, idx) => {
          const interview = interviews.find(i => i.type === round.type);
          const isCompleted = interview && interview.status === 'COMPLETED' && interview.feedback && interview.feedback.length > 0;
          const isCompletedPending = interview && interview.status === 'COMPLETED' && (!interview.feedback || interview.feedback.length === 0);
          const isScheduled = interview && interview.status === 'SCHEDULED';
          const isPrevDone = idx === 0 || isRoundCompleted(ROUNDS[idx - 1].type);
          const isSchedulable = !interview && isPrevDone;
          const isLocked = !interview && !isPrevDone;

          const isSelected = selectedStepIndex === idx;

          return (
            <Box key={round.type} sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              {/* Stepper Node Item */}
              <Paper
                onClick={() => setSelectedStepIndex(idx)}
                sx={{
                  flex: 1,
                  p: 1.2,
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : '#0B0D10',
                  border: isSelected
                    ? '1px solid #6366f1'
                    : isCompleted
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : isScheduled
                        ? '1px solid rgba(99, 102, 241, 0.3)'
                        : isSchedulable
                          ? '1px dashed rgba(129, 140, 248, 0.4)'
                          : '1px solid rgba(244, 63, 94, 0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2,
                  transition: 'all 180ms ease',
                  opacity: isLocked ? 0.6 : 1,
                  '&:hover': {
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.16)' : 'rgba(255, 255, 255, 0.02)',
                    borderColor: isSelected ? '#6366f1' : isLocked ? 'rgba(244, 63, 94, 0.3)' : 'rgba(255, 255, 255, 0.15)',
                  }
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: isCompleted
                      ? 'rgba(16, 185, 129, 0.2)'
                      : isScheduled
                        ? 'rgba(99, 102, 241, 0.2)'
                        : isLocked
                          ? 'rgba(244, 63, 94, 0.1)'
                          : 'rgba(255, 255, 255, 0.05)',
                    color: isCompleted
                      ? '#10b981'
                      : isScheduled
                        ? '#818cf8'
                        : isLocked
                          ? '#fb7185'
                          : '#626975',
                    border: isCompleted
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : isScheduled
                        ? '1px solid rgba(129, 140, 248, 0.4)'
                        : isLocked
                          ? '1px solid rgba(244, 63, 94, 0.3)'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                  className="font-mono"
                >
                  {isCompleted ? <CheckIcon sx={{ fontSize: 13 }} /> : isLocked ? <LockIcon sx={{ fontSize: 12 }} /> : round.step}
                </Box>

                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="body2" noWrap fontWeight={600} sx={{ color: isSelected ? '#F5F7FA' : '#969DAA', fontSize: '0.78rem' }}>
                    {round.title}
                  </Typography>
                  <Typography variant="caption" noWrap sx={{ color: isCompleted ? '#10b981' : isScheduled ? '#818cf8' : isCompletedPending ? '#f59e0b' : isLocked ? '#fb7185' : '#626975', fontSize: '0.68rem', fontWeight: 500, display: 'block' }}>
                    {isCompleted ? 'Scorecard Verified' : isCompletedPending ? 'Pending Scorecard' : isScheduled ? 'Session Set' : isSchedulable ? 'Schedulable' : 'Locked'}
                  </Typography>
                </Box>
              </Paper>

              {/* Connecting Connector Line */}
              {idx < ROUNDS.length - 1 && (
                <ChevronIcon sx={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.15)', mx: 0.5, flexShrink: 0 }} />
              )}
            </Box>
          );
        })}
      </Box>

      {/* Selected Trace Node Detail Bar */}
      <Paper
        sx={{
          p: 2,
          backgroundColor: '#0B0D10',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: activeInterview?.status === 'COMPLETED' ? '#10b981' : activeInterview ? '#818cf8' : previousCompleted ? '#06b6d4' : '#fb7185'
              }}
            />
            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ color: '#F5F7FA', fontSize: '0.82rem' }}>
                Trace Point {activeRoundDef.step}: {activeRoundDef.title}
              </Typography>
              <Typography variant="caption" sx={{ color: '#626975', fontSize: '0.72rem' }}>
                {activeRoundDef.subtitle}
              </Typography>
            </Box>
          </Box>

          {/* Contextual Trace Point Actions */}
          <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
            {/* Scheduled / In-Progress State Actions */}
            {activeInterview && (activeInterview.status === 'SCHEDULED' || activeInterview.status === 'RESCHEDULED' || activeInterview.status === 'IN_PROGRESS') && (
              isOtherInterviewer ? (
                <Chip
                  size="small"
                  label={`Assigned to ${activeInterview.interviewer?.name || 'Other Interviewer'} (Read Only)`}
                  sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#969DAA', fontSize: '0.72rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                />
              ) : (
                <>
                  <Tooltip title="Reschedule Session">
                    <IconButton size="small" onClick={() => onEdit(activeInterview)} sx={{ color: '#969DAA', '&:hover': { color: '#818cf8' } }}>
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>

                  {!isInterviewer && (
                    <Tooltip title="Cancel Session">
                      <IconButton size="small" onClick={() => handleDelete(activeInterview.id)} disabled={deletingId === activeInterview.id} sx={{ color: '#626975', '&:hover': { color: '#f43f5e' } }}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}

                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AiIcon sx={{ fontSize: 14 }} />}
                    onClick={() => handleStartCopilot(activeInterview.id)}
                    sx={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                      borderRadius: '6px',
                      py: 0.3,
                      px: 1.5,
                      boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #4f46e5 0%, #0891b2 100%)'
                      }
                    }}
                  >
                    {activeInterview.status === 'IN_PROGRESS' ? 'Join Active Copilot' : 'Start AI Copilot'}
                  </Button>

                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    onClick={() => onMarkCompleted(activeInterview.id)}
                    sx={{ borderRadius: '6px', fontSize: '0.72rem', py: 0.3, whiteSpace: 'nowrap' }}
                  >
                    Mark Completed
                  </Button>
                </>
              )
            )}

            {/* Completed Pending Feedback */}
            {activeInterview && activeInterview.status === 'COMPLETED' && (!activeInterview.feedback || activeInterview.feedback.length === 0) && (
              isOtherInterviewer ? (
                <Chip
                  size="small"
                  label={`Pending Scorecard by ${activeInterview.interviewer?.name || 'Assigned Interviewer'}`}
                  sx={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: '0.72rem', border: '1px solid rgba(245, 158, 11, 0.25)' }}
                />
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<CommentIcon sx={{ fontSize: 14 }} />}
                  onClick={() => onSubmitFeedback(activeInterview)}
                  sx={{ borderRadius: '6px', fontSize: '0.72rem', py: 0.3, backgroundColor: '#6366f1', whiteSpace: 'nowrap' }}
                >
                  Submit Scorecard
                </Button>
              )
            )}

            {/* Completed With Feedback -> View Scorecard Button (Visible to everyone!) */}
            {activeInterview && activeInterview.status === 'COMPLETED' && activeInterview.feedback && activeInterview.feedback.length > 0 && (
              <Button
                size="small"
                variant="contained"
                startIcon={<ViewIcon sx={{ fontSize: 14 }} />}
                onClick={() => onViewScorecard(activeInterview)}
                sx={{ borderRadius: '6px', fontSize: '0.75rem', py: 0.3, backgroundColor: '#10b981', whiteSpace: 'nowrap', '&:hover': { backgroundColor: '#059669' } }}
              >
                View Full Scorecard
              </Button>
            )}

            {/* Schedulable Trace Point Action */}
            {!activeInterview && previousCompleted && (
              isInterviewer ? (
                <Chip
                  size="small"
                  label="Scheduling restricted to Admins/Recruiters"
                  sx={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', color: '#626975', fontSize: '0.7rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                />
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<EventIcon sx={{ fontSize: 14 }} />}
                  onClick={() => onSchedule(activeRoundDef.type)}
                  sx={{ borderRadius: '6px', fontSize: '0.75rem', py: 0.4, backgroundColor: '#6366f1', whiteSpace: 'nowrap' }}
                >
                  Schedule {activeRoundDef.title}
                </Button>
              )
            )}

            {/* Locked Notice */}
            {!activeInterview && !previousCompleted && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.8,
                  px: 1.2,
                  py: 0.6,
                  borderRadius: '6px',
                  backgroundColor: 'rgba(244, 63, 94, 0.1)',
                  color: '#fb7185',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  maxWidth: '100%'
                }}
              >
                <LockIcon sx={{ fontSize: 13, color: '#fb7185', flexShrink: 0 }} />
                <Typography variant="caption" sx={{ color: '#fb7185', fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.72rem' }, lineHeight: 1.3 }}>
                  Locked — Complete {ROUNDS[selectedStepIndex - 1]?.title || 'Previous Round'} & Submit Scorecard
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Clean Meta Details Body */}
        {activeInterview && (
          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#626975', display: 'block' }}>
                Assigned Interviewer: <span style={{ color: '#F5F7FA', fontWeight: 600 }}>{activeInterview.interviewer?.name}</span>
              </Typography>
              <Typography variant="caption" sx={{ color: '#626975', display: 'block' }} className="font-mono">
                Session Date: {new Date(activeInterview.scheduledAt).toLocaleString()} ({activeInterview.duration} mins)
              </Typography>
              {activeInterview.meetingLink && (
                <Box display="flex" alignItems="center" gap={0.5} mt={0.3}>
                  <LinkIcon sx={{ fontSize: 12, color: '#06b6d4' }} />
                  <Typography component="a" href={activeInterview.meetingLink} target="_blank" variant="caption" sx={{ color: '#06b6d4', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    {activeInterview.meetingLink}
                  </Typography>
                </Box>
              )}
            </Box>

            {activeInterview.feedback && activeInterview.feedback.length > 0 && (
              <Box display="flex" alignItems="center" gap={1.5}>
                <Typography variant="caption" sx={{ color: '#969DAA', fontStyle: 'italic', maxWidth: 320 }} noWrap>
                  {activeInterview.feedback[0].comments}
                </Typography>
                <Chip
                  size="small"
                  label={activeInterview.feedback[0].recommendation}
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    backgroundColor: activeInterview.feedback[0].recommendation.includes('YES') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                    color: activeInterview.feedback[0].recommendation.includes('YES') ? '#10b981' : '#f43f5e',
                  }}
                />
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default InterviewTracePipeline;
