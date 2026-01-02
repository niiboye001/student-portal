import { Request, Response } from 'express';
import { parse } from 'csv-parse/sync';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { logAudit } from '../services/audit.service';

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

// Helper to parse CSV buffer
const parseCSV = (buffer: Buffer) => {
    return parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });
};

export const importStudents = async (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
        const records = parseCSV(req.file.buffer);
        let successCount = 0;
        let failCount = 0;
        const errors: any[] = [];

        const defaultPassword = await bcrypt.hash('Student123!', 10);

        for (const record of records as any[]) {
            const { name, email } = record;
            if (!name || !email) {
                failCount++;
                errors.push({ email, message: 'Missing name or email' });
                continue;
            }

            try {
                const existing = await prisma.user.findUnique({ where: { email } });
                if (existing) {
                    failCount++;
                    errors.push({ email, message: 'User already exists' });
                    continue;
                }

                await prisma.user.create({
                    data: {
                        name,
                        email,
                        password: defaultPassword,
                        role: 'STUDENT',
                        profile: { create: {} }
                    }
                });
                successCount++;
            } catch (err: any) {
                failCount++;
                errors.push({ email, message: err.message });
            }
        }

        if ((req as AuthRequest).user) {
            await logAudit((req as AuthRequest).user!.userId, 'IMPORT_STUDENTS', 'USER', { success: successCount, fail: failCount }, req.ip);
        }

        res.json({ message: 'Import completed', summary: { success: successCount, fail: failCount, errors } });

    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ message: 'Error processing CSV file' });
    }
};

export const importStaff = async (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
        const records = parseCSV(req.file.buffer);
        let successCount = 0;
        let failCount = 0;
        const errors: any[] = [];

        const defaultPassword = await bcrypt.hash('Staff123!', 10);

        for (const record of records as any[]) {
            const { name, email, role } = record;
            if (!name || !email) {
                failCount++;
                errors.push({ email, message: 'Missing name or email' });
                continue;
            }

            try {
                const existing = await prisma.user.findUnique({ where: { email } });
                if (existing) {
                    failCount++;
                    errors.push({ email, message: 'User already exists' });
                    continue;
                }

                // Default to TUTOR if not specified or invalid
                const userRole = (role === 'ADMIN' || role === 'TUTOR') ? role : 'TUTOR';

                await prisma.user.create({
                    data: {
                        name,
                        email,
                        password: defaultPassword,
                        role: userRole,
                        profile: { create: {} }
                    }
                });
                successCount++;
            } catch (err: any) {
                failCount++;
                errors.push({ email, message: err.message });
            }
        }

        if ((req as AuthRequest).user) {
            await logAudit((req as AuthRequest).user!.userId, 'IMPORT_STAFF', 'USER', { success: successCount, fail: failCount }, req.ip);
        }

        res.json({ message: 'Import completed', summary: { success: successCount, fail: failCount, errors } });

    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ message: 'Error processing CSV file' });
    }
};

export const importCourses = async (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
        const records = parseCSV(req.file.buffer);
        let successCount = 0;
        let failCount = 0;
        const errors: any[] = [];

        for (const record of records as any[]) {
            const { code, name, credits, description } = record;
            if (!code || !name) {
                failCount++;
                errors.push({ code, message: 'Missing code or name' });
                continue;
            }

            try {
                // Check if course code exists
                const existing = await prisma.course.findFirst({ where: { code } });
                if (existing) {
                    failCount++;
                    errors.push({ code, message: 'Course code already exists' });
                    continue;
                }

                await prisma.course.create({
                    data: {
                        code,
                        name,
                        credits: Number(credits) || 3,
                        description: description || ''
                    }
                });
                successCount++;
            } catch (err: any) {
                failCount++;
                errors.push({ code, message: err.message });
            }
        }

        if ((req as AuthRequest).user) {
            await logAudit((req as AuthRequest).user!.userId, 'IMPORT_COURSES', 'COURSE', { success: successCount, fail: failCount }, req.ip);
        }

        res.json({ message: 'Import completed', summary: { success: successCount, fail: failCount, errors } });

    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ message: 'Error processing CSV file' });
    }
};
