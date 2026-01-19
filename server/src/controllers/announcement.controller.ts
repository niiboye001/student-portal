import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logAudit } from '../services/audit.service';
import { z } from 'zod';

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const getAnnouncements = async (req: Request, res: Response) => {
    try {
        const { status = 'active' } = req.query; // status: 'active', 'archived', 'all'
        const user = (req as AuthRequest).user;
        const userId = user?.userId;
        const role = user?.role;

        if (!role) {
            return res.status(401).json({ message: 'Unauthorized: Role missing' });
        }


        const where: any = {};
        const now = new Date();

        // 1. Filter by Validity (Active vs Archived)
        if (status === 'active') {
            where.AND = [
                ...(where.AND || []),
                {
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: now } }
                    ]
                }
            ];
        } else if (status === 'archived') {
            where.AND = [
                ...(where.AND || []),
                { expiresAt: { lt: now } } // Strictly past
            ];
        }
        // if status === 'all', we don't add any expiry date filter

        // 2. Determine Scope (System vs Course)
        const scopeConditions: any[] = [];

        // A. System Announcements
        scopeConditions.push({
            courseId: null,
            OR: [
                { targetRole: null },
                { targetRole: String(role) }
            ]
        });

        // B. Course Announcements (Student Enrolled)
        if (role === 'STUDENT' && userId) {
            const enrollments = await prisma.enrollment.findMany({
                where: { userId },
                select: { courseId: true }
            });
            const courseIds = enrollments.map(e => e.courseId);

            if (courseIds.length > 0) {
                scopeConditions.push({
                    courseId: { in: courseIds },
                    OR: [
                        { targetRole: null },
                        { targetRole: 'STUDENT' }
                    ]
                });
            }
        }

        // C. Course Announcements (Staff/Tutor Teaching)
        if ((role === 'STAFF' || role === 'TUTOR') && userId) {
            const courses = await prisma.course.findMany({
                where: { instructorId: userId },
                select: { id: true }
            });
            const courseIds = courses.map(c => c.id);
            if (courseIds.length > 0) {
                // Staff see all announcements for their courses
                scopeConditions.push({ courseId: { in: courseIds } });
            }
        }

        // Apply Scope to WHERE
        // If we already have AND (from status filter), we push to it.
        // Actually, we must combine these scope conditions with OR because a user can see System OR Course announcements

        if (where.AND) {
            where.AND.push({ OR: scopeConditions });
        } else {
            where.OR = scopeConditions;
        }

        const announcements = await prisma.announcement.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                course: {
                    select: { name: true, code: true }
                }
            }
        });

        // Map response to include courseName for easier frontend display because we included course
        const formattedAnnouncements = announcements.map(ann => ({
            ...ann,
            courseName: ann.course ? `${ann.course.code} - ${ann.course.name}` : 'System'
        }));

        res.json(formattedAnnouncements);
    } catch (error) {
        console.error('Fetch announcements error:', error);
        res.status(500).json({ message: 'Error fetching announcements' });
    }
};

const createAnnouncementSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    type: z.enum(['academic', 'system', 'event']).default('academic'),
    targetRole: z.enum(['STUDENT', 'STAFF']).nullable().optional(),
    expiresAt: z.string().nullable().optional().or(z.date().nullable().optional()),
    courseId: z.string().uuid().optional()
});

export const createAnnouncement = async (req: Request, res: Response) => {
    try {
        const validation = createAnnouncementSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: validation.error.issues.map(e => e.message)
            });
        }

        const { title, content, type, targetRole, expiresAt, courseId } = validation.data;
        const user = (req as AuthRequest).user!;

        // Authorization check
        if (courseId) {
            // If courseId is provided, user must be instructor or admin
            if (user.role !== 'ADMIN') {
                const course = await prisma.course.findUnique({ where: { id: courseId } });

                if (!course) {
                    return res.status(404).json({ message: 'Course not found' });
                }

                if (course.instructorId !== user.userId) {
                    return res.status(403).json({ message: 'Not authorized to post announcements for this course' });
                }
            }
        } else {
            // Only Admin can create system-wide announcements
            if (user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Only Admins can create system-wide announcements' });
            }
        }

        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                type,
                targetRole: targetRole || null,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                courseId
            }
        });

        if (user) {
            const ip = req.ip || 'unknown';
            await logAudit(user.userId, 'CREATE_ANNOUNCEMENT', 'ANNOUNCEMENT', { id: announcement.id, title, courseId }, ip);
        }

        res.status(201).json(announcement);
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({ message: 'Error creating announcement' });
    }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user!;

        const announcement = await prisma.announcement.findUnique({
            where: { id },
            include: { course: true }
        });

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // Allow Admin
        if (user.role === 'ADMIN') {
            await prisma.announcement.delete({ where: { id } });
            await logAudit(user.userId, 'DELETE_ANNOUNCEMENT', 'ANNOUNCEMENT', { id }, req.ip);
            return res.json({ message: 'Announcement deleted' });
        }

        // Allow Staff if they own the course
        if (user.role === 'STAFF' || user.role === 'TUTOR') {
            if (announcement.courseId && announcement.course?.instructorId === user.userId) {
                await prisma.announcement.delete({ where: { id } });
                await logAudit(user.userId, 'DELETE_ANNOUNCEMENT', 'ANNOUNCEMENT', { id }, req.ip);
                return res.json({ message: 'Announcement deleted' });
            }
        }

        return res.status(403).json({ message: 'Not authorized to delete this announcement' });
    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({ message: 'Error deleting announcement' });
    }
};

export const archiveAnnouncement = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user!;

        const announcement = await prisma.announcement.findUnique({
            where: { id },
            include: { course: true }
        });

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // Authorization: Admin or Course Instructor
        let authorized = false;
        if (user.role === 'ADMIN') {
            authorized = true;
        } else if ((user.role === 'STAFF' || user.role === 'TUTOR') && announcement.courseId) {
            if (announcement.course?.instructorId === user.userId) {
                authorized = true;
            }
        }

        if (!authorized) {
            return res.status(403).json({ message: 'Not authorized to archive this announcement' });
        }

        const updated = await prisma.announcement.update({
            where: { id },
            data: { isArchived: true }
        });

        if (user) {
            const ip = req.ip || 'unknown';
            await logAudit(user.userId, 'ARCHIVE_ANNOUNCEMENT', 'ANNOUNCEMENT', { id }, ip);
        }

        res.json(updated);
    } catch (error) {
        console.error('Archive announcement error:', error);
        res.status(500).json({ message: 'Error archiving announcement' });
    }
};
