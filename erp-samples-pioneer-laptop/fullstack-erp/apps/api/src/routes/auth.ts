import { Router } from 'express';
import { login, register, refreshToken, getMe, changePassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);
router.patch('/change-password', authenticate, changePassword);

export default router;
