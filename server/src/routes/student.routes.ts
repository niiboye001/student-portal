import { Router } from 'express';
import { getDashboardData, getCourses, getSchedule, getProfile, updateProfile, getCourseDetails, submitAssignment, getAssignments, getAvailableCourses, enrollCourse } from '../controllers/student.controller';
import { getAnnouncements } from '../controllers/announcement.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes here require authentication
router.use(authenticateToken);

router.get('/dashboard', getDashboardData);
router.get('/courses/available', getAvailableCourses);
router.post('/courses/enroll', enrollCourse);
router.get('/courses', getCourses);
router.get('/courses/:id', getCourseDetails);
router.get('/assignments', getAssignments);
router.post('/courses/:id/assignments/:assignmentId/submit', submitAssignment);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
