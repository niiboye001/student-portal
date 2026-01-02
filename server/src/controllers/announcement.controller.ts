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
        const { role } = req.query;

        const where: any = {};
        if (role) {
            // If requesting as a specific role (e.g. STUDENT), show public + role-specific logs
            where.OR = [
                { targetRole: null },
                { targetRole: String(role) }
            ];
        }

        // Only show valid (not expired) announcements for students
        if (role === 'STUDENT') {
            const now = new Date();
            where.AND = [
                {
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: now } }
                    ]
                }
            ];
        }

        const announcements = await prisma.announcement.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        res.json(announcements);
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
    expiresAt: z.string().nullable().optional().or(z.date().nullable().optional())
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

        const { title, content, type, targetRole, expiresAt } = validation.data;

        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                type,
                targetRole: targetRole || null,
                expiresAt: expiresAt ? new Date(expiresAt) : null
            }
        });

        if ((req as AuthRequest).user) {
            await logAudit((req as AuthRequest).user!.userId, 'CREATE_ANNOUNCEMENT', 'ANNOUNCEMENT', { id: announcement.id, title }, req.ip);
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

        await prisma.announcement.delete({ where: { id } });

        if ((req as AuthRequest).user) {
            await logAudit((req as AuthRequest).user!.userId, 'DELETE_ANNOUNCEMENT', 'ANNOUNCEMENT', { id }, req.ip);
        }

        res.json({ message: 'Announcement deleted' });
    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({ message: 'Error deleting announcement' });
    }
};
