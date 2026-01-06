
import { Router } from 'express';
import { getUnifiedSchedule } from '../controllers/schedule.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, getUnifiedSchedule);

export default router;
