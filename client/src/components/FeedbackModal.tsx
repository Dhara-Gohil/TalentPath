import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Drawer, Box, Typography, IconButton, Button, TextField, MenuItem, Alert, Grid, Rating, Divider } from '@mui/material';
import { Close as CloseIcon, RateReviewOutlined as ReviewIcon, HelpOutline as HelpIcon } from '@mui/icons-material';
import apiClient from '../api/client';
import { ROUND_SCORECARD_CONFIG } from './ScorecardConfig';
import { showToast } from '../utils/toast';

const feedbackSchema = z.object({
  technicalRating: z.coerce.number().min(1, 'Rating required').max(10),
  communicationRating: z.coerce.number().min(1, 'Rating required').max(10),
  problemSolvingRating: z.coerce.number().min(1, 'Rating required').max(10),
  cultureFitRating: z.coerce.number().min(1, 'Rating required').max(10),
  strengths: z.string().min(5, 'Provide at least 5 characters for strengths'),
  weaknesses: z.string().min(5, 'Provide at least 5 characters for weaknesses'),
  comments: z.string().optional(),
  recommendation: z.enum(['STRONG_YES', 'YES', 'MAYBE', 'NO', 'STRONG_NO']),
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  interviewId: string;
  roundType?: 'TECHNICAL' | 'HR' | 'MANAGERIAL' | 'CULTURAL' | string;
  onFeedbackSubmitted: () => void;
}

const FeedbackModal = ({ open, onClose, interviewId, roundType = 'TECHNICAL', onFeedbackSubmitted }: Props) => {
  const [error, setError] = useState('');
  const config = ROUND_SCORECARD_CONFIG[roundType] || ROUND_SCORECARD_CONFIG.TECHNICAL;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { recommendation: 'MAYBE', technicalRating: 7, communicationRating: 7, problemSolvingRating: 7, cultureFitRating: 7 }
  });

  const onSubmit = async (data: FeedbackForm) => {
    try {
      await apiClient.post(`/interviews/${interviewId}/feedback`, data);
      showToast.success('Scorecard feedback submitted successfully!');
      reset();
      onFeedbackSubmitted();
      onClose();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to submit feedback';
      setError(errorMsg);
      showToast.apiError(err, 'Failed to submit feedback');
    }
  };

  const renderRating = (categoryKey: keyof FeedbackForm, label: string) => (
    <Grid item xs={12} sm={6} key={categoryKey}>
      <Typography variant="caption" sx={{ color: '#969DAA', fontWeight: 600, mb: 0.5, display: 'block' }}>
        {label} ({Number(watch(categoryKey)) || 0}/10)
      </Typography>
      <Rating
        max={10}
        value={Number(watch(categoryKey)) || 0}
        onChange={(_, newValue) => setValue(categoryKey, newValue as any)}
        size="small"
        sx={{
          color: '#818cf8',
          '& .MuiRating-iconEmpty': { color: 'rgba(255,255,255,0.1)' }
        }}
      />
      {errors[categoryKey] && <Typography variant="caption" color="error" display="block">{errors[categoryKey]?.message}</Typography>}
    </Grid>
  );

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
          <Box sx={{ p: 0.8, borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex' }}>
            <ReviewIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#F5F7FA', lineHeight: 1.2 }}>
              {config.title}
            </Typography>
            <Typography variant="caption" sx={{ color: '#626975', fontSize: '0.72rem' }}>
              {config.subtitle}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#626975', '&:hover': { color: '#F5F7FA' } }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Form Content */}
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '6px' }}>{error}</Alert>}

        {/* Round Evaluation Prompts & Questions */}
        <Box sx={{ backgroundColor: '#151920', p: 2, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', mb: 3 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <HelpIcon sx={{ fontSize: 16, color: '#818cf8' }} />
            <Typography variant="caption" fontWeight={700} sx={{ color: '#F5F7FA', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Round Focus Prompts & Questions
            </Typography>
          </Box>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#969DAA', fontSize: '0.78rem', lineHeight: 1.5 }}>
            {config.questions.map((q, idx) => (
              <li key={idx}>{q}</li>
            ))}
          </ul>
        </Box>

        <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5, display: 'block' }}>
          Round Specific Ratings (1-10)
        </Typography>

        <Grid container spacing={2.5} mb={3}>
          {config.ratings.map(r => renderRating(r.key, r.label))}
        </Grid>

        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.06)' }} />

        <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5, display: 'block' }}>
          Qualitative Assessment
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth multiline rows={3} label="Key Strengths" placeholder="Demonstrated strong system architecture knowledge..." {...register('strengths')} error={!!errors.strengths} helperText={errors.strengths?.message} size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth multiline rows={3} label="Areas for Growth / Weaknesses" placeholder="Struggled slightly with edge-case handling..." {...register('weaknesses')} error={!!errors.weaknesses} helperText={errors.weaknesses?.message} size="small" />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={3} label="Detailed Evaluator Comments" placeholder="Overall notes from the interview session..." {...register('comments')} error={!!errors.comments} helperText={errors.comments?.message} size="small" />
          </Grid>
          <Grid item xs={12}>
            <TextField select fullWidth label="Hiring Recommendation" defaultValue="MAYBE" inputProps={register('recommendation')} error={!!errors.recommendation} helperText={errors.recommendation?.message} size="small">
              <MenuItem value="STRONG_YES">Strong Hire (Strong Yes)</MenuItem>
              <MenuItem value="YES">Hire (Yes)</MenuItem>
              <MenuItem value="MAYBE">Borderline (Maybe)</MenuItem>
              <MenuItem value="NO">Do Not Hire (No)</MenuItem>
              <MenuItem value="STRONG_NO">Strong Reject (Strong No)</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {/* Footer Actions */}
        <Box sx={{ pt: 4, display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} variant="outlined" size="medium" sx={{ borderRadius: '6px' }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting} size="medium" sx={{ borderRadius: '6px', backgroundColor: '#10b981' }}>
            {isSubmitting ? 'Submitting...' : 'Submit Round Scorecard'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default FeedbackModal;
