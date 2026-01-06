import { Router } from 'express';
import { getMyCourses, getStaffStats, getCourseDetails, getMySchedule, addClassSchedule, removeClassSchedule, createAssignment, deleteAssignment, getAssignmentSubmissions, gradeSubmission, createModule, updateModule, deleteModule, createModuleItem, deleteModuleItem } from '../controllers/staff.controller';
import { authenticateToken, authorize } from '../middleware/auth.middleware';

const router = Router();

// Retrieve all courses assigned to the logged-in staff
router.get('/courses', authenticateToken, authorize('STAFF', 'TUTOR', 'ADMIN'), getMyCourses);

// Retrieve specific course details (with roster)
router.get('/courses/:id', authenticateToken, authorize('STAFF', 'TUTOR', 'ADMIN'), getCourseDetails);

// Add class to course schedule
router.post('/courses/:id/schedule', authenticateToken, authorize('STAFF', 'TUTOR', 'ADMIN'), addClassSchedule);

// Remove class from course schedule
router.delete('/courses/:id/schedule/:scheduleId', authenticateToken, authorize('STAFF', 'TUTOR', 'ADMIN'), removeClassSchedule);

// Retrieve staff dashboard stats
router.get('/stats', authenticateToken, authorize('STAFF', 'TUTOR', 'ADMIN'), getStaffStats);

// Retrieve staff schedule
router.get('/schedule', authenticateToken, authorize('STAFF', 'TUTOR', 'ADMIN'), getMySchedule);

// Create assignment
router.post('/courses/:id/assignments', authenticateToken, authorize('STAFF', 'TUTOR', 'ADMIN'), createAssignment);

// Delete assignment
router.delete('/courses/:id/assignments/:assignmentId', authenticateToken, authorize('STAFF', 'TUTOR', 'ADMIN'), deleteAssignment);

// Get assignment submissions
router.get('/courses/:id/assignments/:assignmentId/submissions', authenticateToken, authorize('STAFF', 'TUTOR', 'ADMIN'), getAssignmentSubmissions);

// Grade a submission
// Grade a submission
router.post('/courses/:id/assignments/:assignmentId/submissions/:studentId/grade', authenticateToken, authorize('STAFF', 'TUTOR', 'ADMIN'), gradeSubmission);

// Modules
router.post('/modules', authenticateToken, authorize('STAFF', 'TUTOR', 'ADMIN'), createModule);
router.put('/modules/:id', authenticateToken, authorize('STAFF', 'TUTOR', 'ADMIN'), updateModule);
router.delete('/modules/:id', authenticateToken, authorize('STAFF', 'TUTOR', 'ADMIN'), deleteModule);
router.post('/modules/items', authenticateToken, authorize('STAFF', 'TUTOR', 'ADMIN'), createModuleItem);
router.delete('/modules/items/:id', authenticateToken, authorize('STAFF', 'TUTOR', 'ADMIN'), deleteModuleItem);


export default router;
