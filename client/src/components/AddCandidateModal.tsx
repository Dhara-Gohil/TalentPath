import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Drawer, Box, Typography, IconButton, Button, TextField, MenuItem, Grid, Alert, Divider } from '@mui/material';
import { Close as CloseIcon, PersonAddOutlined as AddIcon } from '@mui/icons-material';
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

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<CandidateForm>({
    resolver: zodResolver(candidateSchema),
    defaultValues: { jobId: jobId || '' }
  });

  useEffect(() => {
    if (jobId) {
      setValue('jobId', jobId);
    } else if (open) {
      apiClient.get('/jobs?all=true').then(res => {
        const jobsList = Array.isArray(res.data) ? res.data : (res.data.data || res.data.jobs || []);
        setJobs(jobsList);
      }).catch(() => { });
    }
  }, [open, jobId, setValue]);

  const onSubmit = async (data: CandidateForm) => {
    try {
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
          width: { xs: '100%', sm: 460 },
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
            <AddIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#F5F7FA', lineHeight: 1.2 }}>
              Add Candidate Participant
            </Typography>
            <Typography variant="caption" sx={{ color: '#626975', fontSize: '0.72rem' }}>
              Register candidate into the recruitment pipeline
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

        <Grid container spacing={2.5}>
          {!jobId && (
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1, display: 'block' }}>
                Job Vacancy
              </Typography>
              <TextField
                select
                fullWidth
                label="Target Job Opening"
                inputProps={register('jobId')}
                error={!!errors.jobId}
                helperText={errors.jobId?.message}
                size="small"
              >
                {jobs.map(j => <MenuItem key={j.id} value={j.id}>{j.title}</MenuItem>)}
              </TextField>
            </Grid>
          )}

          <Grid item xs={12}>
            <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1, display: 'block' }}>
              Personal Info
            </Typography>
            <TextField fullWidth label="Full Name" placeholder="e.g. Sarah Jenkins" {...register('name')} error={!!errors.name} helperText={errors.name?.message} size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Email Address" placeholder="sarah@example.com" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Phone Number" placeholder="+1 555 0192" {...register('phone')} error={!!errors.phone} helperText={errors.phone?.message} size="small" />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.06)' }} />
            <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1, display: 'block' }}>
              Qualifications & Resume
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Years of Experience" type="number" placeholder="5" {...register('experienceYears')} error={!!errors.experienceYears} helperText={errors.experienceYears?.message} size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Key Skills (comma separated)" placeholder="React, Node.js, SQL" {...register('skills')} error={!!errors.skills} helperText={errors.skills?.message} size="small" />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={6} label="Raw Resume Text" placeholder="Paste full resume text for AI processing..." {...register('resumeText')} error={!!errors.resumeText} helperText={errors.resumeText?.message} />
          </Grid>
        </Grid>

        {/* Footer Actions */}
        <Box sx={{ pt: 4, display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} variant="outlined" size="medium" sx={{ borderRadius: '6px' }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting} size="medium" sx={{ borderRadius: '6px' }}>
            {isSubmitting ? 'Adding Candidate...' : 'Add Candidate'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default AddCandidateModal;
