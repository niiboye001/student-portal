
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';
import { z } from 'zod';

const markAttendanceSchema = z.object({
    date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
    studentId: z.string().uuid(),
    courseId: z.string().uuid()
});

export const getStudentAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const studentId = req.query.studentId as string || req.user?.userId;

        // Security: Students can only view their own attendance
        if (req.user?.role === 'STUDENT' && studentId !== req.user.userId) {
            return res.status(403).json({ message: 'Cannot view attendance of other students' });
        }

        const attendance = await prisma.attendance.findMany({
            where: {
                courseId,
                studentId
            },
            orderBy: { date: 'desc' }
        });

        // Calculate statistics
        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
        const percentage = total > 0 ? (present / total) * 100 : 0;

        res.json({
            records: attendance,
            stats: {
                total,
                present,
                percentage: Math.round(percentage)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch attendance' });
    }
};

export const markAttendance = async (req: AuthRequest, res: Response) => {
    try {
        // Validation
        const result = markAttendanceSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ errors: result.error.format() });
        }

        const { date, status, studentId, courseId } = result.data;

        // RBAC: Only Instructors/Admins can mark attendance
        if (req.user?.role === 'STUDENT') {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        // Check if course exists and user is authorized (e.g. is the instructor) - Optional enhancement
        // For now, consistent with other controllers, we assume Instructor/Admin role is sufficient.

        const record = await prisma.attendance.upsert({
            where: {
                studentId_courseId_date: {
                    studentId,
                    courseId,
                    date: new Date(date)
                }
            },
            update: {
                status,
                markedById: req.user!.userId
            },
            create: {
                date: new Date(date),
                status,
                studentId,
                courseId,
                markedById: req.user!.userId
            }
        });

        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark attendance' });
    }
};

// Bulk attendance schema
const bulkAttendanceSchema = z.object({
    date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    courseId: z.string().uuid(),
    records: z.array(z.object({
        studentId: z.string().uuid(),
        status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'])
    }))
});

export const getCourseAttendanceByDate = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const { date } = req.query;

        // RBAC: Only Instructors/Admins
        if (req.user?.role === 'STUDENT') {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        if (!date || typeof date !== 'string') {
            return res.status(400).json({ message: 'Date parameter is required' });
        }

        const targetDate = new Date(date);

        // 1. Get all enrolled students
        const enrollments = await prisma.enrollment.findMany({
            where: { courseId },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { user: { name: 'asc' } }
        });

        // 2. Get existing attendance for this date
        // Use a range for the whole day to be safe locally
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                courseId,
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        // 3. Merge data
        const roster = enrollments.map(enrollment => {
            const record = attendanceRecords.find(r => r.studentId === enrollment.user.id);
            return {
                student: enrollment.user,
                status: record?.status || null, // null means not marked yet
                recordId: record?.id
            };
        });

        res.json({ date: targetDate, roster });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch course attendance' });
    }
};

export const markBulkAttendance = async (req: AuthRequest, res: Response) => {
    try {
        // Validation
        const result = bulkAttendanceSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ errors: result.error.format() });
        }

        const { date, courseId, records } = result.data;

        // RBAC
        if (req.user?.role === 'STUDENT') {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        const targetDate = new Date(date);

        // Transaction for atomicity
        await prisma.$transaction(
            records.map(record =>
                prisma.attendance.upsert({
                    where: {
                        studentId_courseId_date: {
                            studentId: record.studentId,
                            courseId,
                            date: targetDate
                        }
                    },
                    update: {
                        status: record.status,
                        markedById: req.user!.userId
                    },
                    create: {
                        date: targetDate,
                        status: record.status,
                        studentId: record.studentId,
                        courseId,
                        markedById: req.user!.userId
                    }
                })
            )
        );

        res.json({ message: 'Attendance updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update attendance' });
    }
};
