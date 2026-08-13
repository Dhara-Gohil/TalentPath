import { Router } from 'express';
import { register, login, getMe, getAllUsers, addUser, updateUserRole, updateUser, deleteUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register as any);
router.post('/login', login as any);
router.get('/me', authenticate as any, getMe as any);
router.get('/users', authenticate as any, getAllUsers as any);
router.post('/users', authenticate as any, addUser as any);
router.put('/users/:id', authenticate as any, updateUser as any);
router.patch('/users/:id/role', authenticate as any, updateUserRole as any);
router.delete('/users/:id', authenticate as any, deleteUser as any);

export default router;
