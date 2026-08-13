import { Response } from 'express';
import { candidateService } from '../services/candidate.service';
import { aiService } from '../services/ai.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const evaluateCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const { candidateId } = req.params;

    const context = await candidateService.assembleCandidateAiContext(candidateId);

    const evaluation = await aiService.generateEvaluation(
      context.candidate,
      context.job,
      context.feedbacks
    );

    let newStatus = context.candidate.status;
    const rec = (evaluation.recommendation || '').toUpperCase();
    if (rec.includes('STRONG_YES') || rec.includes('YES')) {
      if (['APPLIED', 'SCREENING', 'INTERVIEW'].includes(context.candidate.status)) {
        newStatus = 'SHORTLISTED';
      }
    } else if (rec.includes('STRONG_NO') || rec.includes('NO')) {
      if (context.candidate.status !== 'HIRED') {
        newStatus = 'REJECTED';
      }
    } else if (rec.includes('MAYBE')) {
      if (context.candidate.status === 'APPLIED') {
        newStatus = 'SCREENING';
      }
    }

    await candidateService.saveAiEvaluation(candidateId, JSON.stringify(evaluation), newStatus);

    res.json({ ...evaluation, newStatus });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || 'Error evaluating candidate interview process' });
  }
};
