import { Router } from 'express';
import { getJobs, getJobById, createJob, updateJob, deleteJob } from '../controllers/job.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Only authenticated users can access job routes
router.use(authenticate as any);

router.get('/', getJobs as any);
router.get('/:id', getJobById as any);
router.post('/', authorize(['RECRUITER', 'ADMIN']) as any, createJob as any);
router.put('/:id', authorize(['ADMIN']) as any, updateJob as any);
router.delete('/:id', authorize(['ADMIN']) as any, deleteJob as any);

export default router;
