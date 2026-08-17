import { z } from 'zod';

export const upsertProfileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone number is required'),
  experienceYears: z.number().min(0, 'Experience years must be 0 or positive'),
  skills: z.string().min(2, 'Skills are required'),
  resumeText: z.string().min(10, 'Resume or bio summary must be at least 10 characters'),
});

export const applyJobSchema = z.object({
  jobId: z.string().uuid('Invalid Job ID'),
  resumeText: z.string().min(10, 'Resume or bio summary must be at least 10 characters').optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  experienceYears: z.number().min(0).optional(),
  skills: z.string().optional(),
  updateProfileResume: z.boolean().optional(),
});

export type UpsertProfileInput = z.infer<typeof upsertProfileSchema>;
export type ApplyJobInput = z.infer<typeof applyJobSchema>;

