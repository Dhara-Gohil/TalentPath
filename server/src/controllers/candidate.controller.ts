import { Response } from 'express';
import { candidateService } from '../services/candidate.service';
import { createCandidateSchema, updateCandidateSchema, updateCandidateStatusSchema } from '../schemas/candidate.schema';
import { AuthRequest } from '../middleware/auth.middleware';

export const getCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const filters = {
      ...req.query,
      userRole: req.user?.role,
      userId: req.user?.id,
    };
    const result = await candidateService.getCandidates(filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching candidates' });
  }
};

export const getCandidateById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const candidate = await candidateService.getCandidateById(id, req.user?.role, req.user?.id);
    res.json(candidate);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Error fetching candidate' });
  }
};

export const createCandidate = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'INTERVIEWER') {
      return res.status(403).json({ error: 'Forbidden: Interviewers cannot create candidate records' });
    }
    const data = createCandidateSchema.parse(req.body);
    const candidate = await candidateService.createCandidate(data);
    res.status(201).json(candidate);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error.errors) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(400).json({ error: error.message || 'Error creating candidate' });
  }
};

export const updateCandidate = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'INTERVIEWER') {
      return res.status(403).json({ error: 'Forbidden: Interviewers cannot update candidate details' });
    }
    const { id } = req.params;
    const data = updateCandidateSchema.parse(req.body);
    const candidate = await candidateService.updateCandidate(id, data);
    res.json(candidate);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error.errors) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(400).json({ error: error.message || 'Error updating candidate' });
  }
};

export const changeStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'INTERVIEWER') {
      return res.status(403).json({ error: 'Forbidden: Interviewers cannot change candidate pipeline stage' });
    }
    const { id } = req.params;
    const { status } = updateCandidateStatusSchema.parse(req.body);
    const candidate = await candidateService.updateCandidateStatus(id, status);
    res.json(candidate);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error.errors) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(400).json({ error: error.message || 'Error changing candidate status' });
  }
};

export const deleteCandidate = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'INTERVIEWER') {
      return res.status(403).json({ error: 'Forbidden: Interviewers cannot delete candidate records' });
    }
    const { id } = req.params;
    const result = await candidateService.deleteCandidate(id);
    res.json(result);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Error deleting candidate' });
  }
};
