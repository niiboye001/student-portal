import { Router } from 'express';
import { register, login, logout, refresh, me, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', authenticateToken, me); // Protected
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
