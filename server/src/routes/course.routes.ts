import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { getCourseDiscussions, createPost } from '../controllers/discussion.controller';
import { getStudentAttendance, markAttendance, getCourseAttendanceByDate, markBulkAttendance } from '../controllers/attendance.controller';
import { getCourseGradebook, bulkUpdateGrades } from '../controllers/staff.controller';
import { upload } from '../middleware/upload.middleware';

const router = Router();


router.use(authenticateToken); // Shared by students and staff

router.get('/:courseId/discussions', getCourseDiscussions);
router.post('/:courseId/discussions', upload.single('image'), createPost);

// Attendance
router.get('/:courseId/attendance', getStudentAttendance);
router.post('/:courseId/attendance', markAttendance);
router.get('/:courseId/attendance/date', getCourseAttendanceByDate);
router.post('/:courseId/attendance/bulk', markBulkAttendance);

// Gradebook
router.get('/:courseId/gradebook', getCourseGradebook);
router.post('/:courseId/gradebook/bulk', bulkUpdateGrades);



export default router;
