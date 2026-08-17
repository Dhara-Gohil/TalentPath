
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
  Grid,
  Alert,
  Divider,
  CircularProgress,
  Select,
  FormControl,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  PersonAddOutlined as AddIcon,
  EmailOutlined as MailIcon,
  PhoneOutlined as PhoneIcon,
  CardMembershipOutlined as SkillIcon,
  AutoAwesome as SparklesIcon
} from '@mui/icons-material';
import apiClient from '../api/client';
import { showToast } from '../utils/toast';

const candidateSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 characters'),
  experienceYears: z.coerce.number().min(0, 'Experience must be >= 0'),
  skills: z.string().min(2, 'Provide comma separated skills'),
  resumeText: z.string().min(10, 'Provide at least a brief resume text'),
  jobId: z.string().min(1, 'Please select a job opening'),
});

type CandidateForm = z.infer<typeof candidateSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  jobId?: string;
  onCandidateAdded: () => void;
}

const AddCandidateModal = ({ open, onClose, jobId, onCandidateAdded }: Props) => {
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);

  const { control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<CandidateForm>({
    resolver: zodResolver(candidateSchema),
    defaultValues: { jobId: jobId || '', experienceYears: 3 }
  });

  useEffect(() => {
    if (jobId) {
      setValue('jobId', jobId);
    } else if (open) {
      apiClient.get('/jobs?all=true').then(res => {
        const jobsList = Array.isArray(res.data) ? res.data : (res.data.data || res.data.jobs || []);
        setJobs(jobsList);
        if (jobsList.length > 0 && !jobId) {
          setValue('jobId', jobsList[0].id);
        }
      }).catch(() => { });
    }
  }, [open, jobId, setValue]);

  const onSubmit = async (data: CandidateForm) => {
    try {
      setError('');
      await apiClient.post('/candidates', data);
      showToast.success(`Candidate ${data.name} added successfully!`);
      reset();
      onCandidateAdded();
      onClose();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to add candidate';
      setError(errorMsg);
      showToast.apiError(err, 'Failed to add candidate');
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
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
      {/* Header */}
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
            <AddIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#F5F7FA', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
              Add Candidate Participant
            </Typography>
            <Typography variant="caption" sx={{ color: '#969DAA', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
              <SparklesIcon sx={{ fontSize: 13, color: '#06b6d4' }} />
              Register candidate into recruitment pipeline for AI analysis
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

      {/* Form Content */}
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

        <Grid container spacing={2.5}>
          {!jobId && (
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ color: '#F5F7FA', fontWeight: 600, mb: 1, fontSize: '0.86rem' }}>
                Target Job Opening <Typography component="span" sx={{ color: '#f43f5e' }}>*</Typography>
              </Typography>
              <Controller
                name="jobId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.jobId}>
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
                        }
                      }}
                      renderValue={(selected) => {
                        if (!selected) return <Typography sx={{ color: '#626975', fontSize: '0.88rem' }}>Select a job requisition...</Typography>;
                        const found = jobs.find(j => j.id === selected);
                        return found ? found.title : selected;
                      }}
                    >
                      {jobs.map(j => (
                        <MenuItem key={j.id} value={j.id} sx={{ py: 1, px: 1.5 }}>
                          {j.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          )}

          {/* Personal Info */}
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ color: '#F5F7FA', fontWeight: 600, mb: 1, fontSize: '0.86rem' }}>
              Full Name <Typography component="span" sx={{ color: '#f43f5e' }}>*</Typography>
            </Typography>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  placeholder="e.g. Sarah Jenkins"
                  size="small"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#12161F',
                      borderRadius: '10px',
                      color: '#F5F7FA',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(99, 102, 241, 0.4)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1', borderWidth: '1.5px' }
                    }
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ color: '#F5F7FA', fontWeight: 600, mb: 1, fontSize: '0.86rem' }}>
              Email Address <Typography component="span" sx={{ color: '#f43f5e' }}>*</Typography>
            </Typography>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="email"
                  placeholder="sarah@example.com"
                  size="small"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ color: '#818cf8', mr: 0.5 }}>
                        <MailIcon sx={{ fontSize: 16 }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#12161F',
                      borderRadius: '10px',
                      color: '#F5F7FA',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(99, 102, 241, 0.4)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1', borderWidth: '1.5px' }
                    }
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ color: '#F5F7FA', fontWeight: 600, mb: 1, fontSize: '0.86rem' }}>
              Phone Number <Typography component="span" sx={{ color: '#f43f5e' }}>*</Typography>
            </Typography>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  placeholder="+1 555 0192"
                  size="small"
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ color: '#06b6d4', mr: 0.5 }}>
                        <PhoneIcon sx={{ fontSize: 16 }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#12161F',
                      borderRadius: '10px',
                      color: '#F5F7FA',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(6, 182, 212, 0.4)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#06b6d4', borderWidth: '1.5px' }
                    }
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.06)' }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ color: '#F5F7FA', fontWeight: 600, mb: 1, fontSize: '0.86rem' }}>
              Experience <Typography component="span" sx={{ color: '#969DAA', fontWeight: 400 }}>(Years)</Typography>
            </Typography>
            <Controller
              name="experienceYears"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="number"
                  placeholder="5"
                  size="small"
                  error={!!errors.experienceYears}
                  helperText={errors.experienceYears?.message}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#12161F',
                      borderRadius: '10px',
                      color: '#F5F7FA',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(99, 102, 241, 0.4)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1', borderWidth: '1.5px' }
                    }
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ color: '#F5F7FA', fontWeight: 600, mb: 1, fontSize: '0.86rem' }}>
              Key Skills <Typography component="span" sx={{ color: '#f43f5e' }}>*</Typography>
            </Typography>
            <Controller
              name="skills"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  placeholder="React, Node.js, TypeScript"
                  size="small"
                  error={!!errors.skills}
                  helperText={errors.skills?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ color: '#34d399', mr: 0.5 }}>
                        <SkillIcon sx={{ fontSize: 16 }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#12161F',
                      borderRadius: '10px',
                      color: '#F5F7FA',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(52, 211, 153, 0.4)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#34d399', borderWidth: '1.5px' }
                    }
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" sx={{ color: '#F5F7FA', fontWeight: 600, mb: 1, fontSize: '0.86rem' }}>
              Raw Resume / Bio Text <Typography component="span" sx={{ color: '#f43f5e' }}>*</Typography>
            </Typography>
            <Controller
              name="resumeText"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={5}
                  placeholder="Paste full candidate resume text for automated AI intelligence parsing..."
                  error={!!errors.resumeText}
                  helperText={errors.resumeText?.message}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#12161F',
                      borderRadius: '10px',
                      color: '#F5F7FA',
                      fontSize: '0.88rem',
                      fontFamily: 'monospace',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(99, 102, 241, 0.4)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1', borderWidth: '1.5px' }
                    }
                  }}
                />
              )}
            />
          </Grid>
        </Grid>

        {/* Footer Actions */}
        <Box
          sx={{
            pt: 4,
            mt: 4,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            gap: 1.5,
            justify: 'flex-end',
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
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <AddIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: '10px',
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
            {isSubmitting ? 'Adding Candidate...' : 'Add Candidate'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default AddCandidateModal;
