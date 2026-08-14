import { z } from 'zod';

export const scheduleInterviewSchema = z.object({
  candidateId: z.string().min(1, 'Candidate ID is required'),
  interviewerId: z.string().min(1, 'Interviewer ID is required'),
  scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid scheduled date time format',
  }),
  duration: z.number().min(15, 'Duration must be at least 15 minutes').max(240, 'Duration cannot exceed 240 minutes'),
  type: z.enum(['TECHNICAL', 'HR', 'MANAGERIAL', 'CULTURAL']),
  meetingLink: z.string().url('Invalid meeting link URL').optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable().or(z.literal('')),
});

export const updateInterviewSchema = scheduleInterviewSchema.partial();

export const updateInterviewStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']),
});

export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>;
export type UpdateInterviewStatusInput = z.infer<typeof updateInterviewStatusSchema>;
