import { Router } from 'express';
import { getAdminStats, getAllStudents, getAllCourses, createStudent, deleteStudent, updateStudent, createCourse, updateCourse, deleteCourse, enrollStudent, getCourseEnrollments, deleteEnrollment, createStaff, getAllStaff, updateStaff, deleteStaff, resetUserPassword } from '../controllers/admin.controller';
import { getAuditLogs, getAuditStats } from '../controllers/audit.controller';
import { importStudents, importCourses, importStaff } from '../controllers/import.controller';
import { upload } from '../middleware/upload.middleware';
import { authenticateToken, authorize } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticateToken);
router.use(authorize('ADMIN'));

router.get('/stats', getAdminStats);
router.get('/students', getAllStudents);
router.post('/students', createStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

router.get('/courses', getAllCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Enrollment Management
router.post('/enrollments', enrollStudent);
router.delete('/enrollments/:id', deleteEnrollment);
router.get('/courses/:id/enrollments', getCourseEnrollments);

// Staff Management
router.get('/staff', getAllStaff);
router.post('/staff', createStaff);
router.put('/staff/:id', updateStaff);
router.delete('/staff/:id', deleteStaff);

// Audit Logs
router.get('/audit', getAuditLogs);
router.get('/audit', getAuditLogs);
router.get('/audit/stats', getAuditStats);

// Announcements



// Bulk Import
router.post('/import/students', upload.single('file'), importStudents);
router.post('/import/courses', upload.single('file'), importCourses);
router.post('/import/staff', upload.single('file'), importStaff);

export default router;
