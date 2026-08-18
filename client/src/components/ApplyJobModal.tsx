import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Alert,
  Grid,
  Divider,
  Paper,
  Chip,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  Skeleton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  Description as ResumeIcon,
  CheckCircleOutline as CheckIcon,
  AutoAwesome as SparklesIcon,
  Bookmark as BookmarkIcon
} from '@mui/icons-material';
import type { SuitableJobItem, CandidateProfile, SavedResume } from '../api/types';
import { candidateService } from '../api/candidate.service';
import { renderFormattedText } from '../utils/textFormatter';
import { showToast } from '../utils/toast';

interface Props {
  open: boolean;
  onClose: () => void;
  job: SuitableJobItem | null;
  profile: CandidateProfile | null;
  onConfirmApply: (data: {
    jobId: string;
    resumeText: string;
    updateProfileResume: boolean;
  }) => Promise<void>;
}

const ApplyJobModal: React.FC<Props> = ({
  open,
  onClose,
  job,
  profile,
  onConfirmApply
}) => {
  const [resumeText, setResumeText] = useState('');
  const [updateProfile, setUpdateProfile] = useState(false);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (profile && profile.resumeText) {
        setResumeText(profile.resumeText);
      } else {
        setResumeText('');
      }
      setUpdateProfile(false);
      setError('');
      setSelectedResumeId('');

      // Fetch Saved Resumes History
      candidateService.getSavedResumes()
        .then((data) => setSavedResumes(data))
        .catch(() => setSavedResumes([]));
    }
  }, [open, profile]);

  const handleSelectSavedResume = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    if (!resumeId) {
      if (profile?.resumeText) setResumeText(profile.resumeText);
      return;
    }
    const found = savedResumes.find((r) => r.id === resumeId);
    if (found) {
      setResumeText(found.resumeText);
    }
  };

  if (!job) {
    return (
      <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 540 }, backgroundColor: '#0A0C10', p: 3 } }}>
        <Skeleton variant="text" width={220} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.06)', mb: 3 }} />
        <Skeleton variant="rounded" height={140} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: '12px', mb: 3 }} />
        <Skeleton variant="rounded" height={220} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: '12px' }} />
      </Drawer>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = resumeText ? resumeText.trim() : '';
    const lineCount = trimmed.split('\n').filter((l) => l.trim().length > 0).length;

    if (!trimmed || trimmed.length < 50 || lineCount < 3) {
      const msg = 'Please upload or provide a detailed resume (at least 3 lines) to submit your job application.';
      setError(msg);
      showToast.warning(msg);
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onConfirmApply({
        jobId: job.id,
        resumeText: resumeText.trim(),
        updateProfileResume: updateProfile
      });
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to submit application';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 540 },
          backgroundColor: '#0A0C10',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '-20px 0 50px rgba(0, 0, 0, 0.7) !important',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
    >
      {/* Drawer Header */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, rgba(10, 12, 16, 0) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SendIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#F5F7FA', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
              Confirm Job Application
            </Typography>
            <Typography variant="caption" sx={{ color: '#969DAA', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
              <SparklesIcon sx={{ fontSize: 13, color: '#06b6d4' }} />
              Review & confirm your application resume dossier
            </Typography>
          </Box>
        </Box>

        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: '#969DAA',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            transition: 'all 150ms ease',
            '&:hover': {
              color: '#F5F7FA',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderColor: 'rgba(255, 255, 255, 0.15)',
            }
          }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Drawer Body Form */}
      <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: '10px',
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              color: '#fb7185',
              '& .MuiAlert-icon': { color: '#fb7185' }
            }}
          >
            {error}
          </Alert>
        )}

        {/* Position Requisition Card Summary */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            backgroundColor: '#0F1219',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '12px',
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} mb={1}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#F5F7FA', fontSize: '1rem' }}>
              {job.title}
            </Typography>
            {job.matchScore > 0 && (
              <Chip
                label={`${job.matchScore}% AI Match`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  backgroundColor: job.matchScore >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: job.matchScore >= 80 ? '#34d399' : '#fbbf24',
                  border: job.matchScore >= 80 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                  ml: 'auto'
                }}
              />
            )}
          </Box>
          <Typography variant="caption" sx={{ color: '#969DAA', display: 'block', mb: 1.5 }}>
            {job.department} • {job.location} • {job.employmentType} (Req Exp: {job.experienceRequired})
          </Typography>
          {job.description && (
            <Box
              sx={{
                maxHeight: 130,
                overflowY: 'auto',
                my: 1.5,
                p: 1.2,
                backgroundColor: '#0B0D10',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '4px' },
              }}
            >
              {renderFormattedText(job.description)}
            </Box>
          )}
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)', my: 1 }} />
          <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
            Required Skills
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={0.5}>
            {job.requiredSkills.split(',').map((skill, idx) => (
              <Chip
                key={idx}
                label={skill.trim()}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  color: '#CBD5E1',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              />
            ))}
          </Box>
        </Paper>

        {/* Resume Preview & Customization Section */}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <ResumeIcon sx={{ color: '#818cf8', fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: '#F5F7FA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Application Resume Text
                </Typography>
              </Box>
              <Chip
                icon={<CheckIcon sx={{ fontSize: '13px !important', color: '#34d399' }} />}
                label={profile?.resumeText ? 'Pre-filled from Profile' : 'Empty Profile Resume'}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  backgroundColor: profile?.resumeText ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  color: profile?.resumeText ? '#34d399' : '#fbbf24',
                  border: profile?.resumeText ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                }}
              />
            </Box>

            <Typography variant="caption" sx={{ color: '#969DAA', display: 'block', mb: 1.2, fontSize: '0.78rem', lineHeight: 1.4 }}>
              This resume will be submitted for <strong>{job.title}</strong> and sent to recruiters. You can tailor or refine the text below before confirming.
            </Typography>

            {savedResumes.length > 0 && (
              <Box mb={2}>
                <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.6 }}>
                  <BookmarkIcon sx={{ fontSize: 14 }} /> Choose from your Saved Resume History:
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={selectedResumeId}
                    onChange={(e) => handleSelectSavedResume(e.target.value as string)}
                    displayEmpty
                    sx={{
                      backgroundColor: '#0F1219',
                      color: '#F5F7FA',
                      fontSize: '0.84rem',
                      borderRadius: '8px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(99, 102, 241, 0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#818cf8',
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Active Profile Default Resume</em>
                    </MenuItem>
                    {savedResumes.map((sr) => (
                      <MenuItem key={sr.id} value={sr.id}>
                        {sr.title} {sr.isDefault ? ' (⭐ Active Default)' : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            <TextField
              fullWidth
              multiline
              rows={10}
              placeholder="Paste or write your customized resume details for this position..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0F1219',
                  borderRadius: '10px',
                  color: '#F5F7FA',
                  fontSize: '0.86rem',
                  fontFamily: 'monospace',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(99, 102, 241, 0.4)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1', borderWidth: '1.5px' }
                }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={updateProfile}
                  onChange={(e) => setUpdateProfile(e.target.checked)}
                  size="small"
                  sx={{
                    color: '#818cf8',
                    '&.Mui-checked': { color: '#6366f1' }
                  }}
                />
              }
              label={
                <Typography variant="caption" sx={{ color: '#CBD5E1', fontSize: '0.82rem' }}>
                  Also update my default candidate profile resume with these changes
                </Typography>
              }
            />
          </Grid>
        </Grid>

        {/* Footer Action Buttons */}
        <Box
          sx={{
            pt: 3,
            mt: 4,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            gap: 1.5,
            justifyContent: 'flex-end',
          }}
        >
          <Button
            onClick={onClose}
            variant="outlined"
            size="medium"
            disabled={isSubmitting}
            sx={{
              borderRadius: '8px',
              px: 2.5,
              py: 1,
              borderColor: 'rgba(255, 255, 255, 0.12)',
              color: '#969DAA',
              fontWeight: 600,
              fontSize: '0.88rem',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.24)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                color: '#F5F7FA',
              }
            }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            variant="contained"
            size="medium"
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: '8px',
              px: 3,
              py: 1,
              backgroundColor: '#6366f1',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.88rem',
              boxShadow: 'none !important',
              '&:hover': {
                backgroundColor: '#4f46e5',
                boxShadow: 'none !important',
              },
              '&:disabled': {
                opacity: 0.7,
                color: '#FFFFFF',
              }
            }}
          >
            {isSubmitting ? 'Submitting Application...' : 'Confirm & Submit Application'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default ApplyJobModal;
