import { Router } from 'express';
import { evaluateCandidate } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.post('/evaluate/:candidateId', evaluateCandidate as any);

export default router;
