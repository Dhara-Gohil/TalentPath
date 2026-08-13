import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Drawer, Box, Typography, IconButton, Button, TextField, MenuItem, Alert, Grid, Divider, Paper, ToggleButtonGroup, ToggleButton, Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  WorkOutline as AddJobIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  Title as HeadingIcon,
  FormatListBulleted as ListIcon,
  VisibilityOutlined as PreviewIcon,
  EditOutlined as EditIcon
} from '@mui/icons-material';
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

interface Props {
  open: boolean;
  onClose: () => void;
  onJobCreated: () => void;
  editingJob?: any;
}

const parseInlineFormatting = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} style={{ color: '#F5F7FA', fontWeight: 600 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} style={{ color: '#969DAA' }}>
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

export const renderFormattedText = (text: string) => {
  if (!text) return <Typography variant="caption" color="#626975" fontStyle="italic">No description provided yet...</Typography>;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<Box key={idx} sx={{ height: 6 }} />);
      return;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <Typography key={idx} variant="subtitle2" fontWeight={700} sx={{ color: '#F5F7FA', mt: 1.5, mb: 0.5 }}>
          {parseInlineFormatting(trimmed.replace('### ', ''))}
        </Typography>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <Typography key={idx} variant="subtitle1" fontWeight={700} sx={{ color: '#818cf8', mt: 2, mb: 0.5 }}>
          {parseInlineFormatting(trimmed.replace('## ', ''))}
        </Typography>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <Typography key={idx} variant="h6" fontWeight={700} sx={{ color: '#F5F7FA', mt: 2, mb: 0.5 }}>
          {parseInlineFormatting(trimmed.replace('# ', ''))}
        </Typography>
      );
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      elements.push(
        <Box key={idx} display="flex" alignItems="flex-start" gap={1} sx={{ ml: 1, my: 0.3 }}>
          <Typography variant="body2" sx={{ color: '#818cf8', lineHeight: 1.5, fontWeight: 700 }}>•</Typography>
          <Typography variant="body2" sx={{ color: '#969DAA', lineHeight: 1.5, fontSize: '0.82rem' }}>
            {parseInlineFormatting(trimmed.replace(/^[*|-]\s+/, ''))}
          </Typography>
        </Box>
      );
    } else {
      elements.push(
        <Typography key={idx} variant="body2" sx={{ color: '#969DAA', lineHeight: 1.6, fontSize: '0.82rem', mb: 0.5 }}>
          {parseInlineFormatting(line)}
        </Typography>
      );
    }
  });

  return <Box>{elements}</Box>;
};

const CreateJobModal = ({ open, onClose, onJobCreated, editingJob }: Props) => {
  const [error, setError] = useState('');
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      employmentType: 'FULL_TIME',
    }
  });

  useEffect(() => {
    if (editingJob) {
      reset({
        title: editingJob.title || '',
        department: editingJob.department || '',
        location: editingJob.location || '',
        employmentType: editingJob.employmentType || 'FULL_TIME',
        experienceRequired: editingJob.experienceRequired || '',
        requiredSkills: editingJob.requiredSkills || '',
        description: editingJob.description || '',
      });
    } else {
      reset({
        title: '',
        department: '',
        location: '',
        employmentType: 'FULL_TIME',
        experienceRequired: '',
        requiredSkills: '',
        description: `## Job Summary\nWe are looking for a skilled professional to join our team...\n\n### Key Responsibilities\n* Develop and maintain scalable software services\n* Collaborate with cross-functional product teams\n\n### Requirements\n* **3+ years** of industry experience\n* Strong knowledge of modern engineering practices`
      });
    }
  }, [editingJob, open, reset]);

  const descriptionValue = watch('description') || '';

  const handleFormatInsert = (prefix: string, suffix: string = '') => {
    const current = descriptionValue;
    setValue('description', current + `${prefix}formatted text${suffix}`);
  };

  const onSubmit = async (data: JobForm) => {
    try {
      setError('');
      if (editingJob) {
        await apiClient.put(`/jobs/${editingJob.id}`, data);
      } else {
        await apiClient.post('/jobs', { ...data, status: 'OPEN' });
      }
      reset();
      onJobCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process job position');
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
          backgroundColor: '#0B0D10',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'none !important',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
    >
      {/* Drawer Header */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 0.8, borderRadius: '6px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', display: 'flex' }}>
            <AddJobIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#F5F7FA', lineHeight: 1.2 }}>
              {editingJob ? 'Edit Job Requisition' : 'Create Job Opening'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#626975', fontSize: '0.72rem' }}>
              {editingJob ? 'Update requisition parameters & description' : 'Publish a new requisition to collect & evaluate candidates'}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#626975', '&:hover': { color: '#F5F7FA' } }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Drawer Body Form */}
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
        {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: '6px' }}>{error}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.6, display: 'block' }}>
              Job Title
            </Typography>
            <TextField
              fullWidth
              placeholder="e.g. MERN Stack Developer"
              {...register('title')}
              error={!!errors.title}
              helperText={errors.title?.message}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.6, display: 'block' }}>
              Department
            </Typography>
            <TextField
              fullWidth
              placeholder="Engineering, Product..."
              {...register('department')}
              error={!!errors.department}
              helperText={errors.department?.message}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.6, display: 'block' }}>
              Location
            </Typography>
            <TextField
              fullWidth
              placeholder="Remote / New York, NY"
              {...register('location')}
              error={!!errors.location}
              helperText={errors.location?.message}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.6, display: 'block' }}>
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
            <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.6, display: 'block' }}>
              Experience Required
            </Typography>
            <TextField
              fullWidth
              placeholder="e.g. 2+ Years"
              {...register('experienceRequired')}
              error={!!errors.experienceRequired}
              helperText={errors.experienceRequired?.message}
              size="small"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.6, display: 'block' }}>
              Required Skills (comma separated)
            </Typography>
            <TextField
              fullWidth
              placeholder="React, Node.js, Express, MongoDB"
              {...register('requiredSkills')}
              error={!!errors.requiredSkills}
              helperText={errors.requiredSkills?.message}
              size="small"
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.06)' }} />
          </Grid>

          {/* Job Description Rich Text Editor Section */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="caption" sx={{ color: '#626975', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Job Description & Requirements
              </Typography>

              {/* Mode Toggle (Edit / Formatted Preview) */}
              <ToggleButtonGroup
                size="small"
                value={previewTab}
                exclusive
                onChange={(_, val) => val && setPreviewTab(val)}
                sx={{ height: 26 }}
              >
                <ToggleButton value="edit" sx={{ px: 1, fontSize: '0.7rem', color: '#969DAA' }}>
                  <EditIcon sx={{ fontSize: 13, mr: 0.5 }} /> Editor
                </ToggleButton>
                <ToggleButton value="preview" sx={{ px: 1, fontSize: '0.7rem', color: '#969DAA' }}>
                  <PreviewIcon sx={{ fontSize: 13, mr: 0.5 }} /> Preview
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {previewTab === 'edit' ? (
              <Box sx={{ border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#151920' }}>
                {/* Rich Format Controls Toolbar */}
                <Box display="flex" alignItems="center" gap={0.5} p={1} sx={{ backgroundColor: '#0B0D10', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <Tooltip title="Bold (**text**)">
                    <IconButton size="small" onClick={() => handleFormatInsert('**', '**')} sx={{ color: '#969DAA', p: 0.5 }}>
                      <BoldIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Italic (*text*)">
                    <IconButton size="small" onClick={() => handleFormatInsert('*', '*')} sx={{ color: '#969DAA', p: 0.5 }}>
                      <ItalicIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Section Heading (## Heading)">
                    <IconButton size="small" onClick={() => handleFormatInsert('\n## ')} sx={{ color: '#969DAA', p: 0.5 }}>
                      <HeadingIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Bullet List item (* Item)">
                    <IconButton size="small" onClick={() => handleFormatInsert('\n* ')} sx={{ color: '#969DAA', p: 0.5 }}>
                      <ListIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  placeholder="Type rich text description..."
                  {...register('description')}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '0.82rem',
                      '& fieldset': { border: 'none' }
                    }
                  }}
                />
              </Box>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  minHeight: 200,
                  maxHeight: 280,
                  overflowY: 'auto',
                  backgroundColor: '#0B0D10',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px'
                }}
              >
                {renderFormattedText(descriptionValue)}
              </Paper>
            )}
          </Grid>
        </Grid>

        {/* Footer Buttons */}
        <Box sx={{ pt: 3, display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} variant="outlined" size="medium" sx={{ borderRadius: '6px' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            size="medium"
            sx={{ borderRadius: '6px', backgroundColor: '#6366f1', '&:hover': { backgroundColor: '#4f46e5' } }}
          >
            {isSubmitting ? 'Saving...' : (editingJob ? 'Save & Update Job' : 'Publish Job Opening')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default CreateJobModal;
