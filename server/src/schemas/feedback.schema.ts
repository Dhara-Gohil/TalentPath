import { z } from 'zod';

export const submitFeedbackSchema = z.object({
  technicalRating: z.number().int('Rating must be integer').min(1, 'Rating must be 1-10').max(10, 'Rating must be 1-10'),
  communicationRating: z.number().int('Rating must be integer').min(1, 'Rating must be 1-10').max(10, 'Rating must be 1-10'),
  problemSolvingRating: z.number().int('Rating must be integer').min(1, 'Rating must be 1-10').max(10, 'Rating must be 1-10'),
  cultureFitRating: z.number().int('Rating must be integer').min(1, 'Rating must be 1-10').max(10, 'Rating must be 1-10'),
  strengths: z.string().min(5, 'Strengths must be at least 5 characters'),
  weaknesses: z.string().min(5, 'Weaknesses must be at least 5 characters'),
  comments: z.string().min(1, 'Comments are required'),
  recommendation: z.enum(['STRONG_YES', 'YES', 'MAYBE', 'NO', 'STRONG_NO']),
});

export const updateFeedbackSchema = submitFeedbackSchema.partial();

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
