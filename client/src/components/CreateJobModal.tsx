import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Drawer, Box, Typography, IconButton, Button, TextField, MenuItem, Alert, Grid, Divider, Paper, ToggleButtonGroup, ToggleButton, CircularProgress, Select, FormControl, Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  WorkOutline as AddJobIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  Title as HeadingIcon,
  FormatListBulleted as ListIcon,
  VisibilityOutlined as PreviewIcon,
  EditOutlined as EditIcon,
  AutoAwesome as SparklesIcon
} from '@mui/icons-material';
import apiClient from '../api/client';
import { renderFormattedText } from '../utils/textFormatter';
import { showToast } from '../utils/toast';

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

const CreateJobModal = ({ open, onClose, onJobCreated, editingJob }: Props) => {
  const [error, setError] = useState('');
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');

  const { control, register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<JobForm>({
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

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const descriptionValue = watch('description') || '';
  const { ref: descriptionRef, ...descriptionRegister } = register('description');

  const handleFormatInsert = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    const currentText = descriptionValue;

    if (!textarea) {
      setValue('description', currentText + `${prefix}formatted text${suffix}`, { shouldValidate: true, shouldDirty: true });
      return;
    }

    let start = textarea.selectionStart;
    let end = textarea.selectionEnd;
    let selectedText = currentText.substring(start, end);

    let updatedText = '';
    let newCursorStart = start;
    let newCursorEnd = end;

    const isBold = prefix === '**';
    const isItalic = prefix === '*';
    const isHeading = prefix === '## ';
    const isList = prefix === '* ';

    if (selectedText) {
      if (isBold) {
        if (selectedText.startsWith('**') && selectedText.endsWith('**')) {
          const unformatted = selectedText.slice(2, -2);
          updatedText = currentText.substring(0, start) + unformatted + currentText.substring(end);
          newCursorStart = start;
          newCursorEnd = start + unformatted.length;
        } else {
          const replacement = `**${selectedText}**`;
          updatedText = currentText.substring(0, start) + replacement + currentText.substring(end);
          newCursorStart = start;
          newCursorEnd = start + replacement.length;
        }
      } else if (isItalic) {
        if (selectedText.startsWith('*') && selectedText.endsWith('*') && !selectedText.startsWith('**')) {
          const unformatted = selectedText.slice(1, -1);
          updatedText = currentText.substring(0, start) + unformatted + currentText.substring(end);
          newCursorStart = start;
          newCursorEnd = start + unformatted.length;
        } else {
          const replacement = `*${selectedText}*`;
          updatedText = currentText.substring(0, start) + replacement + currentText.substring(end);
          newCursorStart = start;
          newCursorEnd = start + replacement.length;
        }
      } else if (isHeading) {
        if (/^(#{1,6}\s*)/.test(selectedText)) {
          const innerText = selectedText.replace(/^(#{1,6}\s*)/, '');
          updatedText = currentText.substring(0, start) + innerText + currentText.substring(end);
          newCursorStart = start;
          newCursorEnd = start + innerText.length;
        } else {
          const replacement = `\n## ${selectedText}`;
          updatedText = currentText.substring(0, start) + replacement + currentText.substring(end);
          newCursorStart = start;
          newCursorEnd = start + replacement.length;
        }
      } else if (isList) {
        const lines = selectedText.split('\n');
        const hasListFormatting = lines.some((l) => /^\s*\*\s+/.test(l));

        if (hasListFormatting) {
          const unformatted = lines.map((l) => l.replace(/^\s*\*\s+/, '')).join('\n');
          updatedText = currentText.substring(0, start) + unformatted + currentText.substring(end);
          newCursorStart = start;
          newCursorEnd = start + unformatted.length;
        } else {
          const formattedLines = lines.map((line) => (line.trim() ? `* ${line}` : line)).join('\n');
          const replacement = `\n${formattedLines}\n`;
          updatedText = currentText.substring(0, start) + replacement + currentText.substring(end);
          newCursorStart = start;
          newCursorEnd = start + replacement.length;
        }
      } else {
        const replacement = `${prefix}${selectedText}${suffix}`;
        updatedText = currentText.substring(0, start) + replacement + currentText.substring(end);
        newCursorStart = start;
        newCursorEnd = start + replacement.length;
      }
    } else {
      const placeholder = 'formatted text';
      const replacement = `${prefix}${placeholder}${suffix}`;
      updatedText = currentText.substring(0, start) + replacement + currentText.substring(end);
      newCursorStart = start + prefix.length;
      newCursorEnd = newCursorStart + placeholder.length;
    }

    setValue('description', updatedText, { shouldValidate: true, shouldDirty: true });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    }, 0);
  };

  const onSubmit = async (data: JobForm) => {
    try {
      setError('');
      if (editingJob) {
        await apiClient.put(`/jobs/${editingJob.id}`, data);
        showToast.success('Job position updated successfully!');
      } else {
        await apiClient.post('/jobs', { ...data, status: 'OPEN' });
        showToast.success('Job position created successfully!');
      }
      reset();
      onJobCreated();
      onClose();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to process job position';
      setError(errorMsg);
      showToast.apiError(err, 'Failed to process job position');
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
            <AddJobIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#F5F7FA', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
              {editingJob ? 'Edit Job Requisition' : 'Create Job Opening'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#969DAA', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
              <SparklesIcon sx={{ fontSize: 13, color: '#06b6d4' }} />
              {editingJob ? 'Update requisition parameters & description' : 'Publish a new requisition to collect & evaluate candidates'}
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
          <Grid item xs={12}>
            <Typography variant="caption" sx={{ color: '#969DAA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.8, display: 'block' }}>
              Job Title <Typography component="span" sx={{ color: '#f43f5e' }}>*</Typography>
            </Typography>
            <TextField
              fullWidth
              placeholder="e.g. Senior Full Stack Engineer"
              {...register('title')}
              error={!!errors.title}
              helperText={errors.title?.message}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0B0D10',
                  borderRadius: '8px',
                  color: '#F5F7FA',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(99, 102, 241, 0.4)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1', borderWidth: '1.5px' }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ color: '#969DAA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.8, display: 'block' }}>
              Department <Typography component="span" sx={{ color: '#f43f5e' }}>*</Typography>
            </Typography>
            <TextField
              fullWidth
              placeholder="Engineering, Product..."
              {...register('department')}
              error={!!errors.department}
              helperText={errors.department?.message}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0B0D10',
                  borderRadius: '8px',
                  color: '#F5F7FA',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(99, 102, 241, 0.4)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1', borderWidth: '1.5px' }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ color: '#969DAA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.8, display: 'block' }}>
              Location <Typography component="span" sx={{ color: '#f43f5e' }}>*</Typography>
            </Typography>
            <TextField
              fullWidth
              placeholder="Remote / San Francisco, CA"
              {...register('location')}
              error={!!errors.location}
              helperText={errors.location?.message}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0B0D10',
                  borderRadius: '8px',
                  color: '#F5F7FA',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(99, 102, 241, 0.4)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1', borderWidth: '1.5px' }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ color: '#969DAA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.8, display: 'block' }}>
              Employment Type <Typography component="span" sx={{ color: '#f43f5e' }}>*</Typography>
            </Typography>
            <Controller
              name="employmentType"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.employmentType}>
                  <Select
                    {...field}
                    size="small"
                    sx={{
                      backgroundColor: '#0B0D10',
                      borderRadius: '8px',
                      color: '#F5F7FA',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(99, 102, 241, 0.4)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1', borderWidth: '1.5px' }
                    }}
                  >
                    <MenuItem value="FULL_TIME">Full Time</MenuItem>
                    <MenuItem value="PART_TIME">Part Time</MenuItem>
                    <MenuItem value="CONTRACT">Contract</MenuItem>
                    <MenuItem value="INTERNSHIP">Internship</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ color: '#969DAA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.8, display: 'block' }}>
              Experience Required <Typography component="span" sx={{ color: '#f43f5e' }}>*</Typography>
            </Typography>
            <TextField
              fullWidth
              placeholder="e.g. 3+ Years"
              {...register('experienceRequired')}
              error={!!errors.experienceRequired}
              helperText={errors.experienceRequired?.message}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0B0D10',
                  borderRadius: '8px',
                  color: '#F5F7FA',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(99, 102, 241, 0.4)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1', borderWidth: '1.5px' }
                }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="caption" sx={{ color: '#969DAA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.8, display: 'block' }}>
              Required Skills (comma separated) <Typography component="span" sx={{ color: '#f43f5e' }}>*</Typography>
            </Typography>
            <TextField
              fullWidth
              placeholder="React, Node.js, Express, PostgreSQL, TypeScript"
              {...register('requiredSkills')}
              error={!!errors.requiredSkills}
              helperText={errors.requiredSkills?.message}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0B0D10',
                  borderRadius: '8px',
                  color: '#F5F7FA',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(99, 102, 241, 0.4)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1', borderWidth: '1.5px' }
                }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.06)' }} />
          </Grid>

          {/* Job Description Rich Text Editor Section */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="caption" sx={{ color: '#969DAA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Job Description & Requirements <Typography component="span" sx={{ color: '#f43f5e' }}>*</Typography>
              </Typography>
              <ToggleButtonGroup
                value={previewTab}
                exclusive
                onChange={(_, val) => val && setPreviewTab(val)}
                size="small"
                sx={{
                  height: 26,
                  '& .MuiToggleButton-root': {
                    color: '#626975',
                    fontSize: '0.7rem',
                    px: 1.2,
                    py: 0,
                    borderColor: 'rgba(255,255,255,0.1)',
                    '&.Mui-selected': {
                      color: '#818cf8',
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    }
                  }
                }}
              >
                <ToggleButton value="edit">
                  <EditIcon sx={{ fontSize: 13, mr: 0.5 }} /> Write
                </ToggleButton>
                <ToggleButton value="preview">
                  <PreviewIcon sx={{ fontSize: 13, mr: 0.5 }} /> Preview
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {previewTab === 'edit' ? (
              <Paper
                elevation={0}
                sx={{
                  bgcolor: '#0B0D10',
                  border: errors.description ? '1px solid #f43f5e' : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  '&:focus-within': {
                    borderColor: '#6366f1',
                    borderWidth: '1.5px',
                  }
                }}
              >
                {/* Markdown Formatting Toolbar */}
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.8,
                    bgcolor: 'rgba(255, 255, 255, 0.02)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
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
                  <Tooltip title="Heading (## Title)">
                    <IconButton size="small" onClick={() => handleFormatInsert('## ')} sx={{ color: '#969DAA', p: 0.5 }}>
                      <HeadingIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Bulleted List (* Item)">
                    <IconButton size="small" onClick={() => handleFormatInsert('* ')} sx={{ color: '#969DAA', p: 0.5 }}>
                      <ListIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <textarea
                  {...descriptionRegister}
                  ref={(e) => {
                    descriptionRef(e);
                    textareaRef.current = e;
                  }}
                  rows={9}
                  placeholder="Provide structured job details, responsibilities, and requirements..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px',
                    backgroundColor: 'transparent',
                    color: '#F5F7FA',
                    border: 'none',
                    outline: 'none',
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '0.86rem',
                    lineHeight: 1.5,
                    resize: 'vertical',
                  }}
                />
              </Paper>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: '#0B0D10',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  minHeight: 220,
                  maxHeight: 320,
                  overflowY: 'auto',
                  fontSize: '0.86rem',
                  color: '#F5F7FA'
                }}
              >
                {descriptionValue ? renderFormattedText(descriptionValue) : <Typography variant="caption" color="#626975">Nothing to preview yet.</Typography>}
              </Paper>
            )}
            {errors.description && (
              <Typography variant="caption" sx={{ color: '#f43f5e', mt: 0.5, ml: 0.5, display: 'block', fontSize: '0.74rem' }}>
                {errors.description.message}
              </Typography>
            )}
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
            justifyContent: 'flex-end',
          }}
        >
          <Button
            onClick={onClose}
            variant="outlined"
            size="medium"
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
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <AddJobIcon sx={{ fontSize: 16 }} />}
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
            {isSubmitting ? 'Saving Position...' : (editingJob ? 'Update Position' : 'Create Job Opening')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default CreateJobModal;
