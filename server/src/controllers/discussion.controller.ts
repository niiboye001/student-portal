import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

export const getCourseDiscussions = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const userId = req.user?.userId;

        // Verify enrollment (optional, but good for privacy)
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: userId!,
                    courseId
                }
            }
        });

        // Also allow instructors/admins
        if (!enrollment && req.user?.role === 'STUDENT') {
            return res.status(403).json({ message: 'Not enrolled in this course' });
        }

        const discussions = await prisma.discussion.findMany({
            where: {
                courseId,
                parentId: null // Only top-level posts
            },
            include: {
                user: {
                    select: { id: true, name: true, role: true }
                },
                replies: {
                    include: {
                        user: {
                            select: { id: true, name: true, role: true }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Update lastViewedDiscussionsAt for student
        if (enrollment) {
            await prisma.enrollment.update({
                where: { id: enrollment.id },
                data: { lastViewedDiscussionsAt: new Date() }
            });
        }

        res.json(discussions);
    } catch (error) {
        console.error('Error fetching discussions:', error);
        res.status(500).json({ message: 'Failed to fetch discussions' });
    }
};

export const createPost = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const { content, parentId } = req.body;
        const userId = req.user?.userId;

        // Verify enrollment
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: userId!,
                    courseId
                }
            }
        });

        if (!enrollment && req.user?.role === 'STUDENT') {
            return res.status(403).json({ message: 'Not enrolled in this course' });
        }

        if (!content && !req.file) {
            return res.status(400).json({ message: 'Content or image is required' });
        }

        let attachmentUrl = null;
        if (req.file) {
            // Convert backslashes to forward slashes for URL
            attachmentUrl = `/uploads/discussions/${req.file.filename}`;
        }

        const post = await prisma.discussion.create({
            data: {
                content: content || '',
                attachmentUrl,
                courseId,
                userId: userId!,
                parentId: parentId || null
            },
            include: {
                user: {
                    select: { id: true, name: true, role: true }
                }
            }
        });

        res.json(post);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: 'Failed to create post' });
    }
};
