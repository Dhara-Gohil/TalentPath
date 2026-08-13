import { Response } from 'express';
import { interviewService } from '../services/interview.service';
import { feedbackService } from '../services/feedback.service';
import { scheduleInterviewSchema, updateInterviewSchema, updateInterviewStatusSchema } from '../schemas/interview.schema';
import { submitFeedbackSchema } from '../schemas/feedback.schema';
import { AuthRequest } from '../middleware/auth.middleware';

export const scheduleInterview = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'INTERVIEWER') {
      return res.status(403).json({ error: 'Forbidden: Interviewers are not authorized to schedule interviews' });
    }
    const data = scheduleInterviewSchema.parse(req.body);
    const interview = await interviewService.scheduleInterview(data);
    res.status(201).json(interview);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error.errors) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(400).json({ error: error.message || 'Error scheduling interview' });
  }
};

export const updateInterview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateInterviewSchema.parse(req.body);
    const interview = await interviewService.updateInterview(id, data, req.user?.role, req.user?.id);
    res.json(interview);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error.errors) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(400).json({ error: error.message || 'Error updating interview' });
  }
};

export const updateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateInterviewStatusSchema.parse(req.body);
    const interview = await interviewService.updateInterviewStatus(id, data, req.user?.role, req.user?.id);
    res.json(interview);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error.errors) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(400).json({ error: error.message || 'Error updating interview status' });
  }
};

export const getInterviews = async (req: AuthRequest, res: Response) => {
  try {
    const interviews = await interviewService.getInterviews(req.query);
    res.json(interviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching interviews' });
  }
};

export const getInterviewById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const interview = await interviewService.getInterviewById(id);
    res.json(interview);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Error fetching interview' });
  }
};

export const submitFeedback = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { interviewId } = req.params;
    const data = submitFeedbackSchema.parse(req.body);
    const feedback = await feedbackService.submitFeedback(interviewId, data, req.user.id, req.user.role);
    res.status(201).json(feedback);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error.errors) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(400).json({ error: error.message || 'Error submitting feedback' });
  }
};

export const deleteInterview = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'INTERVIEWER') {
      return res.status(403).json({ error: 'Forbidden: Interviewers are not authorized to delete interview sessions' });
    }
    const { id } = req.params;
    const result = await interviewService.deleteInterview(id);
    res.json(result);
  } catch (error: any) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Error deleting interview' });
  }
};
