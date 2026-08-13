import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, Button, TextField, Typography, Card, MenuItem, Alert, Grid, Divider } from '@mui/material';
import { ArrowBack as ArrowBackIcon, WorkOutline as AddJobIcon } from '@mui/icons-material';
import apiClient from '../api/client';

const jobSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  department: z.string().min(2, 'Department is required'),
  location: z.string().min(2, 'Location is required'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']),
  experienceRequired: z.string().min(1, 'Experience required is needed'),
  requiredSkills: z.string().min(2, 'Required skills are needed (comma separated)'),
  description: z.string().min(10, 'Detailed description is required'),
});

type JobForm = z.infer<typeof jobSchema>;

const JobCreate = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      employmentType: 'FULL_TIME',
    }
  });

  const onSubmit = async (data: JobForm) => {
    try {
      await apiClient.post('/jobs', { ...data, status: 'OPEN' });
      navigate('/jobs');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create job');
    }
  };

  return (
    <Box maxWidth="780px" mx="auto">
      <Button
        startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
        onClick={() => navigate('/jobs')}
        sx={{ mb: 3, color: '#969DAA', '&:hover': { color: '#F5F7FA' } }}
        size="small"
      >
        Back to Job Openings
      </Button>

      <Card sx={{ p: 4, backgroundColor: '#101318', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
          <Box sx={{ p: 1, borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', display: 'flex' }}>
            <AddJobIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: '#F5F7FA', letterSpacing: '-0.02em' }}>
              Create Job Opening
            </Typography>
            <Typography variant="body2" sx={{ color: '#626975', fontSize: '0.82rem' }}>
              Publish a new position to start collecting and evaluating candidate resumes
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.06)' }} />

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '6px' }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.8, display: 'block' }}>
                Job Title
              </Typography>
              <TextField
                fullWidth
                placeholder="e.g. Senior Frontend Engineer"
                {...register('title')}
                error={!!errors.title}
                helperText={errors.title?.message}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.8, display: 'block' }}>
                Department
              </Typography>
              <TextField
                fullWidth
                placeholder="Engineering, Product, Sales..."
                {...register('department')}
                error={!!errors.department}
                helperText={errors.department?.message}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.8, display: 'block' }}>
                Location
              </Typography>
              <TextField
                fullWidth
                placeholder="Remote / San Francisco, CA"
                {...register('location')}
                error={!!errors.location}
                helperText={errors.location?.message}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.8, display: 'block' }}>
                Employment Type
              </Typography>
              <TextField
                select
                fullWidth
                defaultValue="FULL_TIME"
                inputProps={register('employmentType')}
                error={!!errors.employmentType}
                helperText={errors.employmentType?.message}
                size="small"
              >
                <MenuItem value="FULL_TIME">Full Time</MenuItem>
                <MenuItem value="PART_TIME">Part Time</MenuItem>
                <MenuItem value="CONTRACT">Contract</MenuItem>
                <MenuItem value="INTERNSHIP">Internship</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.8, display: 'block' }}>
                Experience Required
              </Typography>
              <TextField
                fullWidth
                placeholder="e.g. 3+ years"
                {...register('experienceRequired')}
                error={!!errors.experienceRequired}
                helperText={errors.experienceRequired?.message}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.8, display: 'block' }}>
                Required Skills (comma separated)
              </Typography>
              <TextField
                fullWidth
                placeholder="React, TypeScript, GraphQL"
                {...register('requiredSkills')}
                error={!!errors.requiredSkills}
                helperText={errors.requiredSkills?.message}
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.8, display: 'block' }}>
                Detailed Description & Requirements
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={5}
                placeholder="Describe role responsibilities, team goals, and specific tech stack requirements..."
                {...register('description')}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            </Grid>

            <Grid item xs={12} display="flex" justifyContent="flex-end" gap={1.5} pt={2}>
              <Button
                variant="outlined"
                onClick={() => navigate('/jobs')}
                size="medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                size="medium"
                sx={{ backgroundColor: '#6366f1', '&:hover': { backgroundColor: '#4f46e5' } }}
              >
                {isSubmitting ? 'Publishing...' : 'Publish Job Opening'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Card>
    </Box>
  );
};

export default JobCreate;
