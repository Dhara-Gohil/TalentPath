import { Router } from 'express';
import { scheduleInterview, updateInterview, updateStatus, getInterviews, getInterviewById, submitFeedback, deleteInterview } from '../controllers/interview.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.get('/', getInterviews as any);
router.get('/:id', getInterviewById as any);
router.post('/', scheduleInterview as any);
router.put('/:id', updateInterview as any);
router.patch('/:id/status', updateStatus as any);
router.post('/:interviewId/feedback', submitFeedback as any);
router.delete('/:id', deleteInterview as any);

export default router;
