import express from 'express';
import { authenticateToken, authorize } from '../middleware/auth.middleware';
import {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getPrograms,
    createProgram,
    updateProgram,
    deleteProgram
} from '../controllers/academic.controller';

const router = express.Router();

// Departments
router.get('/departments', authenticateToken, getDepartments); // Public enough for authenticated users? Yes.
router.post('/departments', authenticateToken, authorize('ADMIN'), createDepartment);
router.put('/departments/:id', authenticateToken, authorize('ADMIN'), updateDepartment);
router.delete('/departments/:id', authenticateToken, authorize('ADMIN'), deleteDepartment);

// Programs
router.get('/programs', authenticateToken, getPrograms);
router.post('/programs', authenticateToken, authorize('ADMIN'), createProgram);
router.put('/programs/:id', authenticateToken, authorize('ADMIN'), updateProgram);
router.delete('/programs/:id', authenticateToken, authorize('ADMIN'), deleteProgram);

export default router;
