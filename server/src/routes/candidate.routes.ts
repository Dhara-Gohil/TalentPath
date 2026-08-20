import { Router } from 'express';
import { getCandidates, getCandidateById, createCandidate, updateCandidate, changeStatus, deleteCandidate } from '../controllers/candidate.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);
router.use(authorize(['ADMIN', 'RECRUITER', 'INTERVIEWER']) as any);

router.get('/', getCandidates as any);
router.get('/:id', getCandidateById as any);
router.post('/', createCandidate as any);
router.put('/:id', updateCandidate as any);
router.patch('/:id/status', changeStatus as any);
router.delete('/:id', deleteCandidate as any);

export default router;
