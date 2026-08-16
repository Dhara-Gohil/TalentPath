import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Alert,
  Grid,
  Divider,
  Avatar,
  Chip,
  InputAdornment,
  Paper,
  CircularProgress,
  Select,
  FormControl
} from '@mui/material';
import {
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  VideoCameraFront as VideoIcon,
  Code as CodeIcon,
  Group as HRIcon,
  Psychology as ManagerIcon,
  AutoAwesome as CultureIcon,
  AutoAwesome as SparklesIcon
} from '@mui/icons-material';
import apiClient from '../api/client';
import { showToast } from '../utils/toast';

const interviewSchema = z.object({
  interviewerId: z.string().min(1, 'Please select an interviewer'),
  scheduledAt: z.string().min(1, 'Date and time are required').refine((val) => {
    return !val || new Date(val) > new Date(Date.now() - 5 * 60 * 1000);
  }, { message: 'Interview date and time must be in the future' }),
  duration: z.coerce.number().min(15, 'Minimum 15 minutes').max(240, 'Maximum 240 minutes (4 hours)'),
  type: z.enum(['TECHNICAL', 'HR', 'MANAGERIAL', 'CULTURAL']),
  meetingLink: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, { message: 'Must be a valid URL (e.g. https://meet.google.com/abc)' }),
});

type InterviewForm = z.infer<typeof interviewSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  candidateId: string;
  defaultType?: 'TECHNICAL' | 'HR' | 'MANAGERIAL' | 'CULTURAL';
  editingInterview?: any;
  onInterviewScheduled: () => void;
}

const ROUND_CONFIGS: Record<string, { label: string; icon: any; gradient: string; color: string; border: string }> = {
  TECHNICAL: {
    label: 'Technical Coding Round',
    icon: CodeIcon,
    gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(129, 140, 248, 0.05) 100%)',
    color: '#818cf8',
    border: 'rgba(99, 102, 241, 0.3)',
  },
  HR: {
    label: 'HR & Screening Round',
    icon: HRIcon,
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(52, 211, 153, 0.05) 100%)',
    color: '#34d399',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  MANAGERIAL: {
    label: 'Managerial & System Design',
    icon: ManagerIcon,
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(251, 191, 36, 0.05) 100%)',
    color: '#fbbf24',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  CULTURAL: {
    label: 'Culture Fit & Leadership',
    icon: CultureIcon,
    gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(192, 132, 252, 0.05) 100%)',
    color: '#c084fc',
    border: 'rgba(168, 85, 247, 0.3)',
  },
};

const DURATION_PRESETS = [30, 45, 60, 90];

const ScheduleInterviewModal = ({ open, onClose, candidateId, defaultType = 'TECHNICAL', editingInterview, onInterviewScheduled }: Props) => {
  const [error, setError] = useState('');
  const [interviewers, setInterviewers] = useState<any[]>([]);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<InterviewForm>({
    resolver: zodResolver(interviewSchema),
    defaultValues: { duration: 60, type: defaultType }
  });

  const selectedDuration = watch('duration');
  const selectedType = watch('type') || defaultType;
  const currentRoundConfig = ROUND_CONFIGS[selectedType] || ROUND_CONFIGS.TECHNICAL;
  const RoundIcon = currentRoundConfig.icon;

  useEffect(() => {
    const fetchInterviewers = async () => {
      try {
        const { data } = await apiClient.get('/auth/users');
        if (Array.isArray(data) && data.length > 0) {
          const staffOnly = data.filter((u: any) => u.role !== 'CANDIDATE');
          const list = staffOnly.length > 0 ? staffOnly : data;
          setInterviewers(list);
          if (!editingInterview && list.length > 0) {
            setValue('interviewerId', list[0].id);
          }
        } else {
          const { data: me } = await apiClient.get('/auth/me');
          setInterviewers([{ id: me.id, name: me.name, role: me.role }]);
          if (!editingInterview) {
            setValue('interviewerId', me.id);
          }
        }
      } catch (err) {
        try {
          const { data: me } = await apiClient.get('/auth/me');
          setInterviewers([{ id: me.id, name: me.name, role: me.role }]);
          if (!editingInterview) {
            setValue('interviewerId', me.id);
          }
        } catch (e) { }
      }
    };
    if (open) fetchInterviewers();
  }, [open, editingInterview, setValue]);

  useEffect(() => {
    if (editingInterview) {
      const scheduledLocal = editingInterview.scheduledAt
        ? new Date(editingInterview.scheduledAt).toISOString().slice(0, 16)
        : '';
      reset({
        type: editingInterview.type,
        interviewerId: editingInterview.interviewerId,
        scheduledAt: scheduledLocal,
        duration: editingInterview.duration || 60,
        meetingLink: editingInterview.meetingLink || '',
      });
    } else {
      reset({
        type: defaultType,
        duration: 60,
        meetingLink: '',
        scheduledAt: '',
      });
    }
  }, [editingInterview, defaultType, open, reset]);

  const onSubmit = async (data: InterviewForm) => {
    try {
      setError('');
      const payload = {
        ...data,
        candidateId,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        meetingLink: data.meetingLink?.trim() || undefined,
      };

      if (editingInterview) {
        await apiClient.put(`/interviews/${editingInterview.id}`, payload);
        showToast.success('Interview session updated successfully!');
      } else {
        await apiClient.post('/interviews', payload);
        showToast.success('Interview session scheduled successfully!');
      }

      reset();
      onInterviewScheduled();
      onClose();
    } catch (err: any) {
      const serverMsg = err.response?.data?.details?.[0]?.message || err.response?.data?.error || err.response?.data?.message;
      const finalErr = serverMsg || 'Failed to process interview session';
      setError(finalErr);
      showToast.apiError(err, 'Failed to process interview session');
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: false,
      }}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 480 },
          backgroundColor: '#0A0C10',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '-20px 0 50px rgba(0, 0, 0, 0.7) !important',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
    >
      {/* Header with Glassmorphic Glow */}
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
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
            }}
          >
            <CalendarIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#F5F7FA', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
              {editingInterview ? 'Reschedule Interview Session' : 'Schedule Interview Session'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#969DAA', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
              <SparklesIcon sx={{ fontSize: 13, color: '#06b6d4' }} />
              {editingInterview ? 'Update session timeline & assigned panelist' : 'Configure round session parameters and meeting access'}
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

      {/* Form Body */}
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
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

        <Grid container spacing={3}>
          {/* Active Round Info Badge Card */}
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ color: '#969DAA', fontWeight: 600, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.72rem' }}>
              Interview Round Target
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '12px',
                background: currentRoundConfig.gradient,
                border: `1px solid ${currentRoundConfig.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    color: currentRoundConfig.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <RoundIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#F5F7FA', fontSize: '0.9rem' }}>
                    {currentRoundConfig.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#969DAA', fontSize: '0.74rem' }}>
                    Standardized interview evaluation session
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={selectedType}
                size="small"
                sx={{
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  color: currentRoundConfig.color,
                  fontWeight: 700,
                  border: `1px solid ${currentRoundConfig.border}`,
                  fontSize: '0.7rem',
                  letterSpacing: '0.04em'
                }}
              />
            </Paper>
            <input type="hidden" value={selectedType} {...control.register('type')} />
          </Grid>

          {/* Assigned Interviewer Selection */}
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ color: '#F5F7FA', fontWeight: 600, mb: 1, fontSize: '0.86rem' }}>
              Assigned Interviewer <Typography component="span" sx={{ color: '#f43f5e' }}>*</Typography>
            </Typography>
            <Controller
              name="interviewerId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.interviewerId}>
                  <Select
                    {...field}
                    displayEmpty
                    size="small"
                    sx={{
                      backgroundColor: '#12161F',
                      borderRadius: '10px',
                      color: '#F5F7FA',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.12)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(99, 102, 241, 0.4)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1',
                        borderWidth: '1.5px',
                      },
                      '& .MuiSelect-select': {
                        py: 1.2,
                        px: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.2,
                      }
                    }}
                    renderValue={(selectedId) => {
                      if (!selectedId) {
                        return <Typography sx={{ color: '#626975', fontSize: '0.88rem' }}>Select an interviewer...</Typography>;
                      }
                      const interviewer = interviewers.find(i => i.id === selectedId);
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              backgroundColor: 'rgba(99, 102, 241, 0.2)',
                              color: '#818cf8',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                            }}
                          >
                            {getInitials(interviewer?.name)}
                          </Avatar>
                          <Typography variant="body2" sx={{ color: '#F5F7FA', fontWeight: 500 }}>
                            {interviewer?.name || 'Selected Interviewer'}
                          </Typography>
                          {interviewer?.role && (
                            <Chip
                              label={interviewer.role}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                color: '#969DAA',
                                ml: 'auto'
                              }}
                            />
                          )}
                        </Box>
                      );
                    }}
                  >
                    {interviewers.map((i) => (
                      <MenuItem
                        key={i.id}
                        value={i.id}
                        sx={{
                          py: 1.2,
                          px: 1.5,
                          borderRadius: '6px',
                          mx: 0.5,
                          my: 0.3,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          '&:hover': {
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                          },
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(99, 102, 241, 0.15) !important',
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Avatar
                            sx={{
                              width: 26,
                              height: 26,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: 'rgba(99, 102, 241, 0.2)',
                              color: '#818cf8',
                            }}
                          >
                            {getInitials(i.name)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ color: '#F5F7FA', fontWeight: 500 }}>
                              {i.name}
                            </Typography>
                            {i.email && (
                              <Typography variant="caption" sx={{ color: '#626975', fontSize: '0.72rem', display: 'block' }}>
                                {i.email}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        {i.role && (
                          <Chip
                            label={i.role}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.66rem',
                              fontWeight: 600,
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              color: '#969DAA'
                            }}
                          />
                        )}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.interviewerId && (
                    <Typography variant="caption" sx={{ color: '#f43f5e', mt: 0.5, ml: 0.5, fontSize: '0.74rem' }}>
                      {errors.interviewerId.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />
          </Grid>

          {/* Scheduled Date & Time */}
          <Grid item xs={12} sm={7}>
            <Typography variant="body2" sx={{ color: '#F5F7FA', fontWeight: 600, mb: 1, fontSize: '0.86rem' }}>
              Date & Time <Typography component="span" sx={{ color: '#f43f5e' }}>*</Typography>
            </Typography>
            <Controller
              name="scheduledAt"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="datetime-local"
                  size="small"
                  error={!!errors.scheduledAt}
                  helperText={errors.scheduledAt?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ color: '#818cf8', mr: 0.5 }}>
                        <TimeIcon sx={{ fontSize: 16 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#12161F',
                      borderRadius: '10px',
                      color: '#F5F7FA',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.12)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(99, 102, 241, 0.4)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1',
                        borderWidth: '1.5px',
                      },
                      '& input::-webkit-calendar-picker-indicator': {
                        filter: 'invert(0.8)',
                        cursor: 'pointer',
                      }
                    }
                  }}
                />
              )}
            />
          </Grid>

          {/* Duration in Minutes with Quick Presets */}
          <Grid item xs={12} sm={5}>
            <Typography variant="body2" sx={{ color: '#F5F7FA', fontWeight: 600, mb: 1, fontSize: '0.86rem' }}>
              Duration <Typography component="span" sx={{ color: '#969DAA', fontWeight: 400 }}>(Mins)</Typography>
            </Typography>
            <Controller
              name="duration"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="number"
                  placeholder="60"
                  size="small"
                  error={!!errors.duration}
                  helperText={errors.duration?.message}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#12161F',
                      borderRadius: '10px',
                      color: '#F5F7FA',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.12)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(99, 102, 241, 0.4)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1',
                        borderWidth: '1.5px',
                      }
                    }
                  }}
                />
              )}
            />
            {/* Quick Duration Presets */}
            <Box sx={{ display: 'flex', gap: 0.8, mt: 1 }}>
              {DURATION_PRESETS.map((preset) => (
                <Chip
                  key={preset}
                  label={`${preset}m`}
                  size="small"
                  onClick={() => setValue('duration', preset, { shouldValidate: true })}
                  sx={{
                    height: 22,
                    fontSize: '0.68rem',
                    fontWeight: selectedDuration === preset ? 700 : 500,
                    backgroundColor: selectedDuration === preset ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: selectedDuration === preset ? '#818cf8' : '#969DAA',
                    border: selectedDuration === preset ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      color: '#818cf8',
                    }
                  }}
                />
              ))}
            </Box>
          </Grid>

          {/* Meeting Link URL */}
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ color: '#F5F7FA', fontWeight: 600, mb: 1, fontSize: '0.86rem' }}>
              Meeting URL <Typography component="span" sx={{ color: '#969DAA', fontWeight: 400 }}>(Optional)</Typography>
            </Typography>
            <Controller
              name="meetingLink"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  placeholder="https://meet.google.com/abc-defg-hij or Zoom link"
                  size="small"
                  error={!!errors.meetingLink}
                  helperText={errors.meetingLink?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ color: '#06b6d4', mr: 0.5 }}>
                        <VideoIcon sx={{ fontSize: 16 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#12161F',
                      borderRadius: '10px',
                      color: '#F5F7FA',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.12)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(6, 182, 212, 0.4)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#06b6d4',
                        borderWidth: '1.5px',
                      }
                    }
                  }}
                />
              )}
            />
          </Grid>
        </Grid>

        {/* Footer Action Buttons */}
        <Box
          sx={{
            pt: 4,
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
            sx={{
              borderRadius: '10px',
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
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <CalendarIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: '10px',
              px: 3,
              py: 1,
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.88rem',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35) !important',
              transition: 'all 200ms ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #0891b2 100%)',
                boxShadow: '0 6px 20px rgba(99, 102, 241, 0.5) !important',
                transform: 'translateY(-1px)',
              },
              '&:disabled': {
                opacity: 0.7,
                color: '#FFFFFF',
              }
            }}
          >
            {isSubmitting ? 'Saving Session...' : (editingInterview ? 'Update Session' : 'Confirm & Schedule')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default ScheduleInterviewModal;
