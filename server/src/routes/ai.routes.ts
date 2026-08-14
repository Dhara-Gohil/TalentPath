import { Router } from 'express';
import { evaluateCandidateResume, evaluateCandidateInterviews } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.post('/evaluate-resume/:candidateId', evaluateCandidateResume as any);
router.post('/evaluate-interviews/:candidateId', evaluateCandidateInterviews as any);
router.post('/evaluate/:candidateId', evaluateCandidateResume as any);

export default router;
