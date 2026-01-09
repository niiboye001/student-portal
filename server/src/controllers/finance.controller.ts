import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { logAudit } from '../services/audit.service';

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

// Schemas
const createFeeSchema = z.object({
    name: z.string().min(2),
    amount: z.number().positive(),
    type: z.string(),
    description: z.string().optional()
});

const assignFeeSchema = z.object({
    studentId: z.string().uuid(),
    feeId: z.string().uuid(),
    dueDate: z.string().transform(str => new Date(str)),
});

// --- Admin: Manage Fees ---

export const createFee = async (req: Request, res: Response) => {
    // @ts-ignore
    try {
        // @ts-ignore
        const { name, amount, type, description } = createFeeSchema.parse(req.body);

        // @ts-ignore
        const fee = await prisma.fee.create({
            data: { name, amount, type, description }
        });

        await logAudit((req as AuthRequest).user!.userId, 'CREATE_FEE', 'FEE', { id: fee.id, name }, req.ip);
        res.status(201).json(fee);
    } catch (error: any) {
        console.error('Create fee error:', error);
        res.status(500).json({ message: error.message || 'Error creating fee' });
    }
};

export const getFees = async (req: Request, res: Response) => {
    // @ts-ignore
    try {
        // @ts-ignore
        const fees = await prisma.fee.findMany({ orderBy: { name: 'asc' } });
        res.json(fees);
    } catch (error) {
        console.error('Get fees error:', error);
        res.status(500).json({ message: 'Error fetching fees' });
    }
};

// --- Admin: View All Invoices ---

export const getAllInvoices = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const invoices = await prisma.invoice.findMany({
            include: {
                // @ts-ignore
                student: {
                    select: { id: true, name: true, email: true }
                },
                fee: true
            },
            orderBy: { dueDate: 'asc' }
        });
        res.json(invoices);
    } catch (error) {
        console.error('Get all invoices error:', error);
        res.status(500).json({ message: 'Error fetching invoices' });
    }
};

// --- Admin: Assign Fee (Create Invoice) ---

export const createInvoice = async (req: Request, res: Response) => {
    // @ts-ignore
    try {
        // @ts-ignore
        const { studentId, feeId, dueDate } = assignFeeSchema.parse(req.body);

        // Fetch fee to get amount
        // @ts-ignore
        const fee = await prisma.fee.findUnique({ where: { id: feeId } });
        if (!fee) return res.status(404).json({ message: 'Fee type not found' });

        // @ts-ignore
        const invoice = await prisma.invoice.create({
            data: {
                studentId,
                feeId,
                amount: fee.amount, // Snapshot of amount
                dueDate,
                status: 'PENDING'
            }
        });

        await logAudit((req as AuthRequest).user!.userId, 'CREATE_INVOICE', 'INVOICE', { id: invoice.id, studentId }, req.ip);
        res.status(201).json(invoice);
    } catch (error: any) {
        console.error('Create invoice error:', error);
        res.status(500).json({ message: error.message || 'Error creating invoice' });
    }
};

// --- Student: View Invoices & Pay ---

export const getStudentInvoices = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        // @ts-ignore
        const invoices = await prisma.invoice.findMany({
            where: { studentId: userId },
            include: { fee: true, payments: true },
            orderBy: { dueDate: 'asc' }
        });
        res.json(invoices);
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ message: 'Error fetching invoices' });
    }
};

export const payInvoice = async (req: AuthRequest, res: Response) => {
    // @ts-ignore
    try {
        const userId = req.user?.userId;
        const { invoiceId, amount, method } = req.body;

        // Verify invoice belongs to user
        // @ts-ignore
        const invoice = await prisma.invoice.findFirst({
            where: { id: invoiceId, studentId: userId }
        });

        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        if (invoice.status === 'PAID') return res.status(400).json({ message: 'Invoice already paid' });

        // Mock payment processing
        // @ts-ignore
        const payment = await prisma.payment.create({
            data: {
                invoiceId,
                amount: parseFloat(amount),
                method: method || 'CARD',
                status: 'COMPLETED'
            }
        });

        // Check if fully paid
        // @ts-ignore
        const allPayments = await prisma.payment.findMany({ where: { invoiceId } });
        const totalPaid = allPayments.reduce((acc: number, p: any) => acc + p.amount, 0);

        if (totalPaid >= invoice.amount) {
            // @ts-ignore
            await prisma.invoice.update({
                where: { id: invoiceId },
                data: { status: 'PAID' }
            });
        } else {
            // @ts-ignore
            await prisma.invoice.update({
                where: { id: invoiceId },
                data: { status: 'PARTIAL' }
            });
        }

        await logAudit(userId!, 'PAY_INVOICE', 'PAYMENT', { invoiceId, amount }, req.ip);

        res.json({ message: 'Payment successful', payment });
    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ message: 'Error processing payment' });
    }
};
