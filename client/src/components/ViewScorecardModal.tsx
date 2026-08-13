import { Drawer, Box, Typography, IconButton, Button, Chip, Grid, Divider, Paper } from '@mui/material';
import { Close as CloseIcon, RateReviewOutlined as ReviewIcon, PersonOutlined as PersonIcon, EventOutlined as DateIcon, CheckCircleOutline as StrengthIcon, ErrorOutline as WeaknessIcon } from '@mui/icons-material';
import { ROUND_SCORECARD_CONFIG } from './ScorecardConfig';

interface Props {
  open: boolean;
  onClose: () => void;
  interview: any;
}

const ViewScorecardModal = ({ open, onClose, interview }: Props) => {
  if (!interview || !interview.feedback || interview.feedback.length === 0) {
    return null;
  }

  const feedback = interview.feedback[0];
  const roundType = interview.type || 'TECHNICAL';
  const config = ROUND_SCORECARD_CONFIG[roundType] || ROUND_SCORECARD_CONFIG.TECHNICAL;

  const isRecommended = feedback.recommendation.includes('YES');

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
            <ReviewIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#F5F7FA', lineHeight: 1.2 }}>
              {config.title}
            </Typography>
            <Typography variant="caption" sx={{ color: '#626975', fontSize: '0.72rem' }}>
              Verified interviewer scorecard submission
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#626975', '&:hover': { color: '#F5F7FA' } }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Content Area */}
      <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
        {/* Recommendation Hero Banner */}
        <Box
          p={2}
          mb={3}
          sx={{
            borderRadius: '8px',
            backgroundColor: isRecommended ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            border: isRecommended ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(244, 63, 94, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="caption" sx={{ color: '#969DAA', fontWeight: 600 }}>
              Hiring Decision:
            </Typography>
            <Chip
              size="small"
              label={feedback.recommendation}
              sx={{
                height: 22,
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: isRecommended ? '#10b981' : '#f43f5e',
                color: '#ffffff',
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: '#626975' }} className="font-mono">
            Submitted {new Date(feedback.createdAt || interview.scheduledAt).toLocaleDateString()}
          </Typography>
        </Box>

        {/* Interviewer Meta */}
        <Box display="flex" justifyContent="space-between" mb={3} p={1.5} sx={{ backgroundColor: '#151920', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon sx={{ fontSize: 16, color: '#818cf8' }} />
            <Typography variant="caption" sx={{ color: '#626975' }}>
              Evaluator: <span style={{ color: '#F5F7FA', fontWeight: 600 }}>{interview.interviewer?.name}</span>
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <DateIcon sx={{ fontSize: 16, color: '#06b6d4' }} />
            <Typography variant="caption" sx={{ color: '#626975' }} className="font-mono">
              Duration: {interview.duration} mins
            </Typography>
          </Box>
        </Box>

        {/* Round Specific Ratings Grid */}
        <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5, display: 'block' }}>
          Round Specific Evaluation Metrics
        </Typography>

        <Grid container spacing={2} mb={3}>
          {config.ratings.map((cat) => {
            const val = feedback[cat.key] || 0;
            return (
              <Grid item xs={12} sm={6} key={cat.key}>
                <Paper sx={{ p: 1.5, backgroundColor: '#151920', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px' }}>
                  <Typography variant="caption" sx={{ color: '#969DAA', display: 'block', mb: 0.5 }}>
                    {cat.label}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: val >= 7 ? '#10b981' : val >= 5 ? '#f59e0b' : '#f43f5e' }} className="font-mono">
                    {val} / 10
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        <Divider sx={{ my: 2.5, borderColor: 'rgba(255,255,255,0.06)' }} />

        {/* Qualitative Comments */}
        <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1, display: 'block' }}>
          Detailed Evaluator Feedback
        </Typography>
        <Paper sx={{ p: 2, backgroundColor: '#151920', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', mb: 3 }}>
          <Typography variant="body2" sx={{ color: '#F5F7FA', lineHeight: 1.6, fontStyle: 'italic', fontSize: '0.84rem' }}>
            "{feedback.comments || 'No detailed comments provided.'}"
          </Typography>
        </Paper>

        {/* Strengths & Weaknesses */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" gap={0.8} mb={1}>
              <StrengthIcon sx={{ fontSize: 16, color: '#10b981' }} />
              <Typography variant="caption" fontWeight={600} sx={{ color: '#10b981' }}>
                Key Strengths
              </Typography>
            </Box>
            <Paper sx={{ p: 1.5, backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '6px' }}>
              <Typography variant="body2" sx={{ color: '#969DAA', fontSize: '0.8rem', lineHeight: 1.5 }}>
                {feedback.strengths || 'N/A'}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" gap={0.8} mb={1}>
              <WeaknessIcon sx={{ fontSize: 16, color: '#f43f5e' }} />
              <Typography variant="caption" fontWeight={600} sx={{ color: '#f43f5e' }}>
                Risk Areas / Weaknesses
              </Typography>
            </Box>
            <Paper sx={{ p: 1.5, backgroundColor: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.15)', borderRadius: '6px' }}>
              <Typography variant="body2" sx={{ color: '#969DAA', fontSize: '0.8rem', lineHeight: 1.5 }}>
                {feedback.weaknesses || 'N/A'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={onClose} variant="outlined" size="medium" sx={{ borderRadius: '6px' }}>
          Close Scorecard
        </Button>
      </Box>
    </Drawer>
  );
};

export default ViewScorecardModal;
