import request from 'supertest';
import app from '../src/app';
import prisma from '../src/utils/prisma';

jest.mock('../src/utils/prisma', () => ({
    __esModule: true,
    default: {
        user: { findUnique: jest.fn() },
        classSchedule: { findMany: jest.fn() },
        assignment: { count: jest.fn() },
        $disconnect: jest.fn(),
    },
}));

jest.mock('../src/middleware/auth.middleware', () => ({
    authenticateToken: (req: any, res: any, next: any) => {
        req.user = { userId: 'student-123', role: 'STUDENT' };
        next();
    },
}));

describe('GET /api/student/dashboard', () => {
    it('should return 200 and mocked data', async () => {
        // Mock user
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'student-123',
            name: 'Test Student',
            enrollments: [
                {
                    grade: 'A',
                    progress: 100,
                    course: { credits: 3 }
                }
            ]
        });

        // Mock class schedule
        (prisma.classSchedule.findMany as jest.Mock).mockResolvedValue([]);

        // Mock assignment count
        (prisma.assignment.count as jest.Mock).mockResolvedValue(5);

        const res = await request(app).get('/api/student/dashboard');

        expect(res.status).toBe(200);
        expect(res.body.student.name).toBe('Test Student');
        expect(res.body.stats.upcomingAssignments).toBe(5);
        expect(res.body.stats.completedCourses).toBe(1);
    });
});
