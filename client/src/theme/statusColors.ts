import type { ChipProps } from '@mui/material/Chip';
import type { CandidateStatus, InterviewStatus, Recommendation, JobStatus } from '../api/types';

export const candidateStatusColor: Record<CandidateStatus, ChipProps['color']> = {
  APPLIED: 'default',
  SCREENING: 'info',
  INTERVIEW: 'primary',
  SHORTLISTED: 'secondary',
  HIRED: 'success',
  REJECTED: 'error',
};

export const interviewStatusColor: Record<InterviewStatus, ChipProps['color']> = {
  SCHEDULED: 'info',
  IN_PROGRESS: 'primary',
  PAUSED: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'error',
  RESCHEDULED: 'warning',
};

export const jobStatusColor: Record<JobStatus, ChipProps['color']> = {
  DRAFT: 'default',
  OPEN: 'success',
  CLOSED: 'error',
};

export const recommendationStatusColor: Record<Recommendation, ChipProps['color']> = {
  STRONG_YES: 'success',
  YES: 'success',
  MAYBE: 'warning',
  NO: 'error',
  STRONG_NO: 'error',
};
