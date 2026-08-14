import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Drawer, Box, Typography, IconButton, Button, TextField, MenuItem, Alert, Grid, Divider } from '@mui/material';
import { Close as CloseIcon, EventAvailableOutlined as ScheduleIcon } from '@mui/icons-material';
import apiClient from '../api/client';

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

const ScheduleInterviewModal = ({ open, onClose, candidateId, defaultType = 'TECHNICAL', editingInterview, onInterviewScheduled }: Props) => {
  const [error, setError] = useState('');
  const [interviewers, setInterviewers] = useState<any[]>([]);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<InterviewForm>({
    resolver: zodResolver(interviewSchema),
    defaultValues: { duration: 60, type: defaultType }
  });

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
      const payload = {
        ...data,
        candidateId,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        meetingLink: data.meetingLink?.trim() || undefined,
      };

      if (editingInterview) {
        await apiClient.put(`/interviews/${editingInterview.id}`, payload);
      } else {
        await apiClient.post('/interviews', payload);
      }

      reset();
      onInterviewScheduled();
      onClose();
    } catch (err: any) {
      const serverMsg = err.response?.data?.details?.[0]?.message || err.response?.data?.error || err.response?.data?.message;
      setError(serverMsg || 'Failed to process interview session');
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
          <Box sx={{ p: 0.8, borderRadius: '6px', backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', display: 'flex' }}>
            <ScheduleIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#F5F7FA', lineHeight: 1.2 }}>
              {editingInterview ? 'Reschedule Interview Session' : 'Schedule Interview Trace Point'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#626975', fontSize: '0.72rem' }}>
              {editingInterview ? 'Update session time or interviewer details' : 'Configure round session parameters and meeting links'}
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
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.8, display: 'block' }}>
              Interview Round
            </Typography>
            <Box
              sx={{
                height: 38,
                borderRadius: '8px',
                backgroundColor: '#151920',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                px: 1.5,
              }}
            >
              <Typography variant="body2" fontWeight={600} sx={{ color: '#818cf8', fontSize: '0.82rem' }}>
                ✦ {(editingInterview?.type || defaultType).replace('_', ' ')} ROUND
              </Typography>
            </Box>
            <input type="hidden" value={editingInterview?.type || defaultType} {...register('type')} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Assigned Interviewer"
              inputProps={register('interviewerId')}
              error={!!errors.interviewerId}
              helperText={errors.interviewerId?.message}
              size="small"
            >
              {interviewers.map(i => (
                <MenuItem key={i.id} value={i.id}>
                  {i.name} {i.role ? `(${i.role})` : ''}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.06)' }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date & Time (Future)"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              {...register('scheduledAt')}
              error={!!errors.scheduledAt}
              helperText={errors.scheduledAt?.message}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Duration (minutes)"
              type="number"
              placeholder="60"
              {...register('duration')}
              error={!!errors.duration}
              helperText={errors.duration?.message}
              size="small"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Meeting URL (Google Meet / Zoom)"
              placeholder="https://meet.google.com/..."
              {...register('meetingLink')}
              error={!!errors.meetingLink}
              helperText={errors.meetingLink?.message}
              size="small"
            />
          </Grid>
        </Grid>

        {/* Footer Actions */}
        <Box sx={{ pt: 4, display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} variant="outlined" size="medium" sx={{ borderRadius: '6px' }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting} size="medium" sx={{ borderRadius: '6px', backgroundColor: '#06b6d4' }}>
            {isSubmitting ? 'Saving Session...' : (editingInterview ? 'Update & Reschedule' : 'Confirm & Schedule')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default ScheduleInterviewModal;
