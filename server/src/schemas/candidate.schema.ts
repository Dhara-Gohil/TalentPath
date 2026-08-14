import { z } from 'zod';

export const createCandidateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  resumeText: z.string().min(10, 'Resume text must be at least 10 characters'),
  experienceYears: z.number().min(0, 'Experience years must be >= 0'),
  skills: z.string().min(1, 'Skills are required'),
  jobId: z.string().min(1, 'Job ID is required'),
});

export const updateCandidateSchema = createCandidateSchema.partial();

export const updateCandidateStatusSchema = z.object({
  status: z.enum(['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'REJECTED', 'HIRED']),
});

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>;
export type UpdateCandidateStatusInput = z.infer<typeof updateCandidateStatusSchema>;
