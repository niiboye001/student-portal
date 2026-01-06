import { Router } from 'express';
import { authenticateToken, authorize } from '../middleware/auth.middleware';
import { createFee, getFees, createInvoice, getStudentInvoices, payInvoice } from '../controllers/finance.controller';

const router = Router();

// Admin Routes
router.post('/fees', authenticateToken, authorize('ADMIN'), createFee);
router.get('/fees', authenticateToken, authorize('ADMIN', 'STAFF'), getFees);
router.post('/invoices', authenticateToken, authorize('ADMIN'), createInvoice);

// Student Routes
router.get('/student/invoices', authenticateToken, getStudentInvoices);
router.post('/student/pay', authenticateToken, payInvoice);

export default router;
