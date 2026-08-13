import { Response } from 'express';
import { jobService } from '../services/job.service';
import { createJobSchema, updateJobSchema } from '../schemas/job.schema';
import { AuthRequest } from '../middleware/auth.middleware';

export const getJobs = async (req: AuthRequest, res: Response) => {
  try {
    const result = await jobService.getJobs(req.query);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching jobs' });
  }
};

export const getJobById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const job = await jobService.getJobById(id);
    res.json(job);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Error fetching job' });
  }
};

export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const data = createJobSchema.parse(req.body);
    const job = await jobService.createJob(data, req.user.id);
    res.status(201).json(job);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error.errors) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(400).json({ error: error.message || 'Error creating job' });
  }
};

export const updateJob = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only admins are authorized to edit or update job requisitions' });
    }

    const { id } = req.params;
    const data = updateJobSchema.parse(req.body);
    const job = await jobService.updateJob(id, data);
    res.json(job);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error.errors) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(400).json({ error: error.message || 'Error updating job' });
  }
};

export const deleteJob = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only admins are authorized to delete job requisitions' });
    }

    const { id } = req.params;
    const result = await jobService.deleteJob(id);
    res.json(result);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Error deleting job' });
  }
};
