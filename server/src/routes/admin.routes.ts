import { Router } from 'express';
import { getAdminStats, getAllStudents, getAllCourses } from '../controllers/admin.controller';
import { authenticateToken, authorize } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticateToken);
router.use(authorize('ADMIN'));

router.get('/stats', getAdminStats);
router.get('/students', getAllStudents);
router.get('/courses', getAllCourses);

export default router;
