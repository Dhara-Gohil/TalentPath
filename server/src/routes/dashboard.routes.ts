import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);
router.use(authorize(['ADMIN', 'RECRUITER', 'INTERVIEWER']) as any);

router.get('/stats', getDashboardStats as any);

export default router;
