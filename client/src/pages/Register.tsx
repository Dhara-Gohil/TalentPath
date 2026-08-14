import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, Button, TextField, Typography, Container, Card, Link, Alert, Grid, Paper } from '@mui/material';
import {
  ArrowForward as ArrowIcon,
  CheckCircleOutline as CheckIcon,
  TimelineOutlined as PipelineIcon,
  PsychologyOutlined as AiBrainIcon,
  ShieldOutlined as ShieldIcon,
} from '@mui/icons-material';
import { authService } from '../api/auth.service';
import SlicedWaves from '../components/SlicedWaves';
import { showToast } from '../utils/toast';

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterForm = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      await authService.register({ ...data, role: 'CANDIDATE' });
      showToast.success('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Registration failed';
      setError(errorMsg);
      showToast.apiError(err, 'Registration failed');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#07080A',
        position: 'relative',
        overflow: 'hidden',
        p: { xs: 2, md: 4 },
      }}
    >
      {/* Background Animated SlicedWaves */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <SlicedWaves
          color1="#6366f1"
          color2="#06b6d4"
          color3="#8b5cf6"
          columns={16}
          rows={10}
          barThickness={0.14}
          speed={0.8}
          travel={0.5}
          waveSpread={0.9}
          rowOffset={1}
          softness={0.12}
          glow={0}
          brightness={0.8}
          contrast={1.1}
          opacity={0.38}
          orientation="horizontal"
          alternate={false}
          mouseInteraction
          mouseStrength={1.2}
          mouseRadius={0.3}
          grain
          grainIntensity={0.06}
        />
      </Box>

      {/* Hero Layout Container Utilizing Screen Area */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4} alignItems="center" justifyContent="center">
          {/* Left Column: Platform Branding & Intelligence Feature Highlights */}
          <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ pr: 3 }}>
              <Typography
                variant="h3"
                fontWeight={800}
                sx={{
                  color: '#FFFFFF',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.15,
                  mb: 2,
                }}
              >
                Join the Candidate Career Portal
              </Typography>

              <Typography variant="body1" sx={{ color: '#969DAA', lineHeight: 1.6, mb: 4, fontSize: '0.98rem' }}>
                Create your candidate profile to submit your resume, unlock executive AI career summaries, match with suitable open positions, and track your interview progress in real-time.
              </Typography>

              {/* Feature Cards Grid */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      backgroundColor: 'rgba(16, 19, 25, 0.65)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1.2} mb={0.8}>
                      <AiBrainIcon sx={{ fontSize: 20, color: '#06b6d4' }} />
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#F5F7FA' }}>
                        Executive AI Summary
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#969DAA', lineHeight: 1.4, display: 'block' }}>
                      Generate dedicated AI profile analysis independent of individual job requisitions.
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      backgroundColor: 'rgba(16, 19, 25, 0.65)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1.2} mb={0.8}>
                      <PipelineIcon sx={{ fontSize: 20, color: '#818cf8' }} />
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#F5F7FA' }}>
                        Live Interview Pipeline
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#969DAA', lineHeight: 1.4, display: 'block' }}>
                      Track status transitions from Applied to Shortlisted & Hired with meeting links.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Trust Badges */}
              <Box display="flex" alignItems="center" gap={3} mt={4}>
                <Box display="flex" alignItems="center" gap={0.8}>
                  <CheckIcon sx={{ fontSize: 16, color: '#10b981' }} />
                  <Typography variant="caption" sx={{ color: '#C3C9D5', fontWeight: 600 }}>
                    Instant Account Activation
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.8}>
                  <ShieldIcon sx={{ fontSize: 16, color: '#10b981' }} />
                  <Typography variant="caption" sx={{ color: '#C3C9D5', fontWeight: 600 }}>
                    Enterprise Security
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Right Column: High-Visibility Glassmorphism Form Card */}
          <Grid item xs={12} sm={8} md={5}>
            <Card
              sx={{
                p: { xs: 3, sm: 4 },
                backgroundColor: 'rgba(15, 18, 25, 0.88)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '20px',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6), 0 0 24px rgba(99, 102, 241, 0.15)',
              }}
            >
              {/* Form Header */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={700} sx={{ color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  Candidate Registration
                </Typography>
                <Typography variant="body2" sx={{ color: '#969DAA', mt: 0.8, fontSize: '0.84rem' }}>
                  Sign up to browse open jobs, upload your resume, and track interviews.
                </Typography>
              </Box>

              {/* Staff Notice Banner */}
              <Alert severity="info" sx={{ mb: 2.5, borderRadius: '8px', fontSize: '0.78rem', backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                <strong>Staff Notice:</strong> Public registration is for Candidates only. Recruiters, Interviewers, and Admins are provisioned by System Admins.
              </Alert>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '8px', fontSize: '0.84rem', backgroundColor: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Box mb={2}>
                  <Typography variant="caption" sx={{ color: '#C3C9D5', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.8, display: 'block' }}>
                    Full Name
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Alex Morgan"
                    {...register('name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#0F1219',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                        '& input::placeholder': {
                          color: '#717A8C',
                          opacity: 1,
                        },
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.16)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#6366f1',
                          borderWidth: 1.5,
                          boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.2)',
                        },
                        '& .MuiOutlinedInput-input': {
                          '&:-webkit-autofill': {
                            WebkitBoxShadow: '0 0 0 1000px #0F1219 inset !important',
                            WebkitTextFillColor: '#FFFFFF !important',
                          },
                        },
                      },
                    }}
                  />
                </Box>

                <Box mb={2}>
                  <Typography variant="caption" sx={{ color: '#C3C9D5', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.8, display: 'block' }}>
                    Work Email
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="alex@company.com"
                    {...register('email')}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#0F1219',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                        '& input::placeholder': {
                          color: '#717A8C',
                          opacity: 1,
                        },
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.16)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#6366f1',
                          borderWidth: 1.5,
                          boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.2)',
                        },
                        '& .MuiOutlinedInput-input': {
                          '&:-webkit-autofill': {
                            WebkitBoxShadow: '0 0 0 1000px #0F1219 inset !important',
                            WebkitTextFillColor: '#FFFFFF !important',
                          },
                        },
                      },
                    }}
                  />
                </Box>

                <Box mb={3.5}>
                  <Typography variant="caption" sx={{ color: '#C3C9D5', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.8, display: 'block' }}>
                    Security Password
                  </Typography>
                  <TextField
                    fullWidth
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#0F1219',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                        '& input::placeholder': {
                          color: '#717A8C',
                          opacity: 1,
                        },
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.16)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#6366f1',
                          borderWidth: 1.5,
                          boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.2)',
                        },
                        '& .MuiOutlinedInput-input': {
                          '&:-webkit-autofill': {
                            WebkitBoxShadow: '0 0 0 1000px #0F1219 inset !important',
                            WebkitTextFillColor: '#FFFFFF !important',
                          },
                        },
                      },
                    }}
                  />
                </Box>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  endIcon={<ArrowIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    py: 1.3,
                    borderRadius: '8px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                    color: '#ffffff',
                    boxShadow: '0 4px 18px rgba(99, 102, 241, 0.45)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4f46e5 0%, #0891b2 100%)',
                      boxShadow: '0 6px 22px rgba(99, 102, 241, 0.55)',
                    },
                  }}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>
              </Box>

              <Box mt={3.5} pt={2.5} textAlign="center" borderTop="1px solid rgba(255, 255, 255, 0.1)">
                <Typography variant="body2" sx={{ color: '#969DAA', fontSize: '0.84rem' }}>
                  Already registered?{' '}
                  <Link
                    component={RouterLink}
                    to="/login"
                    sx={{
                      color: '#818cf8',
                      fontWeight: 700,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline', color: '#a5b4fc' },
                    }}
                  >
                    Sign in to workspace
                  </Link>
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Register;
