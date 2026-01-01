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
        enrollment: { deleteMany: jest.fn() },
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
