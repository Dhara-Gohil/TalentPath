import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  generateProfileSummary,
  getSuitableJobs,
  applyForJob,
  getMyApplications,
  getSavedResumes,
  createSavedResume,
  updateSavedResume,
  deleteSavedResume,
  setDefaultResume,
} from '../controllers/candidatePortal.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.get('/profile', getProfile as any);
router.put('/profile', updateProfile as any);
router.post('/generate-summary', generateProfileSummary as any);
router.get('/suitable-jobs', getSuitableJobs as any);
router.post('/apply', applyForJob as any);
router.get('/applications', getMyApplications as any);

// Saved Resume Repository & History Routes
router.get('/resumes', getSavedResumes as any);
router.post('/resumes', createSavedResume as any);
router.put('/resumes/:id', updateSavedResume as any);
router.delete('/resumes/:id', deleteSavedResume as any);
router.post('/resumes/:id/set-default', setDefaultResume as any);

export default router;
