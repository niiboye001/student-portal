import prisma from '../utils/prisma';

export const logAudit = async (userId: string | null, action: string, resource: string, details?: any, ipAddress?: string, status: 'SUCCESS' | 'FAILURE' | 'WARNING' = 'SUCCESS') => {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                resource,
                details: details ? JSON.stringify(details) : null,
                ipAddress,
                status
            }
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't crash the app if audit fails, but definitely log it
    }
};
