import { Router } from 'express';
import { getAdminStats, getAllStudents, getAllCourses, createStudent, deleteStudent, updateStudent } from '../controllers/admin.controller';
import { authenticateToken, authorize } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticateToken);
router.use(authorize('ADMIN'));

router.get('/stats', getAdminStats);
router.get('/students', getAllStudents);
router.post('/students', createStudent);
router.put('/students/:id', updateStudent);
router.get('/courses', getAllCourses);
router.delete('/students/:id', deleteStudent);

export default router;
