import request from 'supertest';
import app from '../src/app';
import prisma from '../src/utils/prisma';

// Mock Prisma
jest.mock('../src/utils/prisma', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
        },
        profile: { deleteMany: jest.fn() },
        course: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(), // Added for stats
        },
        enrollment: {
            deleteMany: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            delete: jest.fn()
        },
        classSchedule: { deleteMany: jest.fn() },
        assignment: { deleteMany: jest.fn() },
        refreshToken: { deleteMany: jest.fn() },
        $transaction: jest.fn(),
        $disconnect: jest.fn(),
    },
}));

// Mock Auth Middleware to bypass checks
jest.mock('../src/middleware/auth.middleware', () => ({
    authenticateToken: (req: any, res: any, next: any) => next(),
    authorize: (role: string) => (req: any, res: any, next: any) => next(),
}));

describe('POST /api/admin/students', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new student successfully', async () => {
        const mockStudent = {
            name: 'Test Student',
            email: 'test@student.com'
        };

        // Mock findUnique to return null (user doesn't exist)
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        // Mock create to return the new user
        (prisma.user.create as jest.Mock).mockResolvedValue({
            id: '123',
            name: mockStudent.name,
            email: mockStudent.email,
            role: 'STUDENT',
            createdAt: new Date(),
        });

        const res = await request(app)
            .post('/api/admin/students')
            .send(mockStudent);

        expect(res.status).toBe(201);
        expect(res.body.email).toBe(mockStudent.email);
        expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should return 400 if user already exists', async () => {
        const mockStudent = {
            name: 'Existing Student',
            email: 'exist@student.com'
        };

        // Mock findUnique to return existing user
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1' });

        const res = await request(app)
            .post('/api/admin/students')
            .send(mockStudent);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('User already exists with this email');
        expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should return 400 if fields are missing', async () => {
        const res = await request(app)
            .post('/api/admin/students')
            .send({ name: 'No Email' });

        expect(res.status).toBe(400);
    });
});

describe('DELETE /api/admin/students/:id', () => {
    it('should delete a student successfully', async () => {
        // Mock transaction
        (prisma.$transaction as jest.Mock).mockResolvedValue([
            { count: 1 }, // profile
            { count: 0 }, // enrollments
            { count: 0 }, // tokens
            { id: '123', name: 'Deleted' } // user
        ]);

        const res = await request(app).delete('/api/admin/students/123');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Student deleted successfully');
        expect(prisma.$transaction).toHaveBeenCalled();
    });
});

describe('PUT /api/admin/students/:id', () => {
    it('should update a student', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // No email conflict
        (prisma.user.update as jest.Mock).mockResolvedValue({ id: '123', name: 'Updated' });

        const res = await request(app)
            .put('/api/admin/students/123')
            .send({ name: 'Updated' });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Updated');
    });
});

describe('POST /api/admin/courses', () => {
    it('should create a course', async () => {
        (prisma.course.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.course.create as jest.Mock).mockResolvedValue({
            id: 'c1', name: 'Intro to AI', code: 'CS101', credits: 3
        });

        const res = await request(app)
            .post('/api/admin/courses')
            .send({ name: 'Intro to AI', code: 'CS101' });

        expect(res.status).toBe(201);
        expect(res.body.code).toBe('CS101');
    });
});

describe('PUT /api/admin/courses/:id', () => {
    it('should update a course', async () => {
        (prisma.course.update as jest.Mock).mockResolvedValue({
            id: 'c1', name: 'Advanced AI', code: 'CS101'
        });

        const res = await request(app)
            .put('/api/admin/courses/c1')
            .send({ name: 'Advanced AI' });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Advanced AI');
    });
});

describe('DELETE /api/admin/courses/:id', () => {
    it('should delete a course', async () => {
        (prisma.$transaction as jest.Mock).mockResolvedValue([
            { count: 0 }, // enrollments
            { count: 0 }, // schedules
            { count: 0 }, // assignments
            { id: 'c1' } // course
        ]);

        const res = await request(app).delete('/api/admin/courses/c1');

        expect(res.status).toBe(200);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Course deleted successfully');
    });
});

describe('POST /api/admin/enrollments', () => {
    it('should enroll a student', async () => {
        (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.enrollment.create as jest.Mock).mockResolvedValue({
            id: 'e1', userId: 'u1', courseId: 'c1'
        });

        const res = await request(app)
            .post('/api/admin/enrollments')
            .send({ userId: 'u1', courseId: 'c1' });

        expect(res.status).toBe(201);
        expect(res.body.id).toBe('e1');
    });

    it('should fail if already enrolled', async () => {
        (prisma.enrollment.findUnique as jest.Mock).mockResolvedValue({ id: 'e1' });

        const res = await request(app)
            .post('/api/admin/enrollments')
            .send({ userId: 'u1', courseId: 'c1' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Student already enrolled in this course');
    });
});

describe('POST /api/admin/staff', () => {
    it('should create a staff member', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.user.create as jest.Mock).mockResolvedValue({
            id: 's1', name: 'Dr. House', email: 'house@uni.edu', role: 'TUTOR'
        });

        const res = await request(app)
            .post('/api/admin/staff')
            .send({ name: 'Dr. House', email: 'house@uni.edu' });

        expect(res.status).toBe(201);
        expect(res.body.role).toBe('TUTOR');
    });
});
