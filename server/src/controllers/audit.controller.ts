import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const { limit = '50', offset = '0', action, userId } = req.query;

        const where: any = {};
        if (action) where.action = { contains: String(action) };
        if (userId) where.userId = String(userId);

        const logs = await prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: { name: true, email: true, role: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            skip: Number(offset)
        });

        const total = await prisma.auditLog.count({ where });

        res.json({ logs, total });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Error fetching audit logs' });
    }
};

export const getAuditStats = async (req: Request, res: Response) => {
    try {
        // Simple aggregate stats for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const stats = await prisma.auditLog.groupBy({
            by: ['action'],
            where: {
                createdAt: { gte: thirtyDaysAgo }
            },
            _count: {
                action: true
            }
        });

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching audit stats' });
    }
};
