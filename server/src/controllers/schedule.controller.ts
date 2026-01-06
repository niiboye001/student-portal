
import { Request, Response } from 'express';
import { getSchedule as getStudentSchedule } from './student.controller';
import { getMySchedule as getStaffSchedule } from './staff.controller';

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const getUnifiedSchedule = async (req: AuthRequest, res: Response) => {
    try {
        const role = req.user?.role?.toUpperCase();

        if (!role) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (role === 'STUDENT') {
            return getStudentSchedule(req, res);
        }

        if (['STAFF', 'TUTOR', 'ADMIN'].includes(role)) {
            return getStaffSchedule(req, res);
        }

        return res.status(403).json({ message: 'Insufficient permissions' });
    } catch (error) {
        console.error('Unified schedule error', error);
        res.status(500).json({ message: 'Error fetching schedule' });
    }
};
