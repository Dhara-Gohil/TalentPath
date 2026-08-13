import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { candidatePortalService } from '../services/candidatePortal.service';
import { upsertProfileSchema, applyJobSchema } from '../schemas/candidatePortal.schema';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const result = await candidatePortalService.getProfile(userId);
    res.json(result);
  } catch (error: any) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    res.status(500).json({ error: 'Failed to fetch candidate profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const data = upsertProfileSchema.parse(req.body);
    const updated = await candidatePortalService.upsertProfile(userId, data);
    res.json(updated);
  } catch (error: any) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    if (error.errors) return res.status(400).json({ error: 'Validation failed', details: error.errors });
    res.status(400).json({ error: error.message || 'Failed to update profile' });
  }
};

export const generateProfileSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const summary = await candidatePortalService.generateProfileSummary(userId);
    res.json(summary);
  } catch (error: any) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    res.status(500).json({ error: error.message || 'Failed to generate profile AI summary' });
  }
};

export const getSuitableJobs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const jobs = await candidatePortalService.getSuitableJobs(userId);
    res.json(jobs);
  } catch (error: any) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    res.status(500).json({ error: 'Failed to fetch suitable jobs' });
  }
};

export const applyForJob = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { jobId } = applyJobSchema.parse(req.body);
    const candidateRecord = await candidatePortalService.applyForJob(userId, jobId);
    res.status(201).json(candidateRecord);
  } catch (error: any) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    if (error.errors) return res.status(400).json({ error: 'Validation failed', details: error.errors });
    res.status(400).json({ error: error.message || 'Failed to apply for job' });
  }
};

export const getMyApplications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const applications = await candidatePortalService.getMyApplications(userId);
    res.json(applications);
  } catch (error: any) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};
