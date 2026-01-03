import { Router } from 'express';
import { getMyCourses, getStaffStats, getCourseDetails, getMySchedule, addClassSchedule, removeClassSchedule, createAssignment, deleteAssignment, getAssignmentSubmissions, gradeSubmission } from '../controllers/staff.controller';
import { authenticateToken, authorize } from '../middleware/auth.middleware';

const router = Router();

// Retrieve all courses assigned to the logged-in staff
router.get('/courses', authenticateToken, authorize('TUTOR', 'ADMIN'), getMyCourses);

// Retrieve specific course details (with roster)
router.get('/courses/:id', authenticateToken, authorize('TUTOR', 'ADMIN'), getCourseDetails);

// Add class to course schedule
router.post('/courses/:id/schedule', authenticateToken, authorize('TUTOR', 'ADMIN'), addClassSchedule);

// Remove class from course schedule
router.delete('/courses/:id/schedule/:scheduleId', authenticateToken, authorize('TUTOR', 'ADMIN'), removeClassSchedule);

// Retrieve staff dashboard stats
router.get('/stats', authenticateToken, authorize('TUTOR', 'ADMIN'), getStaffStats);

// Retrieve staff schedule
router.get('/schedule', authenticateToken, authorize('TUTOR', 'ADMIN'), getMySchedule);

// Create assignment
router.post('/courses/:id/assignments', authenticateToken, authorize('TUTOR', 'ADMIN'), createAssignment);

// Delete assignment
router.delete('/courses/:id/assignments/:assignmentId', authenticateToken, authorize('TUTOR', 'ADMIN'), deleteAssignment);

// Get assignment submissions
router.get('/courses/:id/assignments/:assignmentId/submissions', authenticateToken, authorize('TUTOR', 'ADMIN'), getAssignmentSubmissions);

// Grade a submission
router.post('/courses/:id/assignments/:assignmentId/submissions/:studentId/grade', authenticateToken, authorize('TUTOR', 'ADMIN'), gradeSubmission);

export default router;
