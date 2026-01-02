import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';
import { logAudit } from '../services/audit.service';
import { generateUserId } from '../utils/id.utils';

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const createStudent = async (req: Request, res: Response) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Default password: Student123!
        const hashedPassword = await bcrypt.hash('Student123!', 10);
        const username = await generateUserId('STUDENT');

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                username,
                password: hashedPassword,
                role: 'STUDENT',
                profile: {
                    create: {} // Create empty profile
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                role: true,
                createdAt: true
            }
        });

        // Log Audit
        if ((req as AuthRequest).user) {
            await logAudit((req as AuthRequest).user!.userId, 'CREATE_STUDENT', 'USER', { studentId: newUser.id, email: newUser.email }, req.ip);
        }

        res.status(201).json(newUser);
    } catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({ message: 'Error creating student' });
    }
};

export const getAdminStats = async (req: Request, res: Response) => {
    try {
        const studentCount = await prisma.user.count({ where: { role: 'STUDENT' } });
        const courseCount = await prisma.course.count();
        const enrollmentCount = await prisma.enrollment.count();

        // New Students in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentRegistrations = await prisma.user.count({
            where: {
                role: 'STUDENT',
                createdAt: { gte: sevenDaysAgo }
            }
        });

        // 6 Month Trend
        const registrationTrend = [];
        for (let i = 5; i >= 0; i--) {
            const startOfMonth = new Date();
            startOfMonth.setMonth(startOfMonth.getMonth() - i);
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const endOfMonth = new Date(startOfMonth);
            endOfMonth.setMonth(endOfMonth.getMonth() + 1);

            const count = await prisma.user.count({
                where: {
                    role: 'STUDENT',
                    createdAt: {
                        gte: startOfMonth,
                        lt: endOfMonth
                    }
                }
            });

            registrationTrend.push({
                month: startOfMonth.toLocaleString('default', { month: 'short' }),
                count: count
            });
        }

        // Average Class Size
        const averageClassSize = courseCount > 0
            ? Math.round(enrollmentCount / courseCount)
            : 0;

        res.json({
            stats: {
                totalStudents: studentCount,
                totalCourses: courseCount,
                totalEnrollments: enrollmentCount,
                recentRegistrations: recentRegistrations,
                registrationTrend: registrationTrend,
                averageClassSize: averageClassSize
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching admin stats' });
    }
};

export const deleteStudent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Use transaction to delete related records first if cascade isn't set in DB
        await prisma.$transaction([
            prisma.profile.deleteMany({ where: { userId: id } }),
            prisma.enrollment.deleteMany({ where: { userId: id } }),
            prisma.refreshToken.deleteMany({ where: { userId: id } }),
            prisma.user.delete({ where: { id } })
        ]);

        res.json({ message: 'Student deleted successfully' });

        // Log Audit
        if ((req as AuthRequest).user) {
            await logAudit((req as AuthRequest).user!.userId, 'DELETE_STUDENT', 'USER', { studentId: id }, req.ip);
        }
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ message: 'Error deleting student' });
    }
};

export const updateStudent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        if (email) {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing && existing.id !== id) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        const student = await prisma.user.update({
            where: { id },
            data: { name, email }
        });

        res.json(student);
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ message: 'Error updating student' });
    }
};

export const getAllStudents = async (req: Request, res: Response) => {
    try {
        const students = await prisma.user.findMany({
            where: { role: 'STUDENT' },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
            }
        });
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students' });
    }
};

export const getAllCourses = async (req: Request, res: Response) => {
    try {
        const courses = await prisma.course.findMany({
            include: {
                _count: {
                    select: { enrollments: true }
                },
                instructor: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching courses' });
    }
};

export const createCourse = async (req: Request, res: Response) => {
    try {
        const { name, code, description, credits, instructorId, level, semester } = req.body;

        if (!name || !code) {
            return res.status(400).json({ message: 'Name and code are required' });
        }

        const existingCourse = await prisma.course.findUnique({ where: { code } });
        if (existingCourse) {
            return res.status(400).json({ message: 'Course code already exists' });
        }

        const course = await prisma.course.create({
            data: {
                name,
                code,
                description,
                instructorId: instructorId || null,
                level: level || 100,
                semester: semester || 1,
                credits: credits || 3
            }
        });

        res.status(201).json(course);

        // Log Audit
        if ((req as AuthRequest).user) {
            await logAudit((req as AuthRequest).user!.userId, 'CREATE_COURSE', 'COURSE', { courseId: course.id, code: course.code }, req.ip);
        }
    } catch (error: any) {
        console.error('Create course error:', error);
        res.status(500).json({ message: `Error creating course: ${error.message}` });
    }
};

export const updateCourse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, code, description, credits, instructorId, level, semester } = req.body;

        if (code) {
            const existing = await prisma.course.findUnique({ where: { code } });
            if (existing && existing.id !== id) {
                return res.status(400).json({ message: 'Course code already in use' });
            }
        }

        const course = await prisma.course.update({
            where: { id },
            data: { name, code, description, credits, instructorId, level, semester }
        });

        res.json(course);
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ message: 'Error updating course' });
    }
};

export const deleteCourse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Transaction to clean up dependent records
        await prisma.$transaction([
            prisma.enrollment.deleteMany({ where: { courseId: id } }),
            prisma.classSchedule.deleteMany({ where: { courseId: id } }),
            prisma.assignment.deleteMany({ where: { courseId: id } }),
            prisma.course.delete({ where: { id } })
        ]);

        res.json({ message: 'Course deleted successfully' });

        // Log Audit
        if ((req as AuthRequest).user) {
            await logAudit((req as AuthRequest).user!.userId, 'DELETE_COURSE', 'COURSE', { courseId: id }, req.ip);
        }
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ message: 'Error deleting course' });
    }
};

export const enrollStudent = async (req: Request, res: Response) => {
    try {
        const { courseId, userId } = req.body;

        const existing = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId
                }
            }
        });

        if (existing) {
            return res.status(400).json({ message: 'Student already enrolled in this course' });
        }

        const enrollment = await prisma.enrollment.create({
            data: {
                userId,
                courseId
            },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });

        res.status(201).json(enrollment);
    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({ message: 'Error enrolling student' });
    }
};

export const getCourseEnrollments = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const enrollments = await prisma.enrollment.findMany({
            where: { courseId: id },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching enrollments' });
    }
};

export const deleteEnrollment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // Enrollment ID
        await prisma.enrollment.delete({ where: { id } });
        res.json({ message: 'Enrollment removed' });
    } catch (error) {
        res.status(500).json({ message: 'Error removing enrollment' });
    }
};

export const createStaff = async (req: Request, res: Response) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const hashedPassword = await bcrypt.hash('Staff123!', 10);
        const username = await generateUserId('STAFF');

        const newStaff = await prisma.user.create({
            data: {
                username,
                name,
                email,
                password: hashedPassword,
                role: 'TUTOR',
                profile: { create: {} }
            },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                role: true,
                createdAt: true
            }
        });

        res.status(201).json(newStaff);

        // Log Audit
        if ((req as AuthRequest).user) {
            await logAudit((req as AuthRequest).user!.userId, 'CREATE_STAFF', 'USER', { staffId: newStaff.id, email: newStaff.email }, req.ip);
        }
    } catch (error) {
        console.error('Create staff error:', error);
        res.status(500).json({ message: 'Error creating staff' });
    }
};

export const getAllStaff = async (req: Request, res: Response) => {
    try {
        const staff = await prisma.user.findMany({
            where: { role: 'TUTOR' },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
            }
        });
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching staff' });
    }
};

export const updateStaff = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        if (email) {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing && existing.id !== id) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        const staff = await prisma.user.update({
            where: { id },
            data: { name, email },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });

        res.json(staff);
    } catch (error) {
        console.error('Update staff error:', error);
        res.status(500).json({ message: 'Error updating staff' });
    }
};

export const deleteStaff = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Ensure we are deleting a TUTOR, not an ADMIN or STUDENT (though admin likely can delete generic users, safety first)
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user || user.role !== 'TUTOR') {
            // If user doesn't exist or isn't a tutor, handle gracefully. 
            // Actually, admin might want to delete anyone, but let's stick to "Staff Management" context.
            if (user && user.role !== 'TUTOR') {
                return res.status(400).json({ message: 'Target user is not a staff member' });
            }
        }

        const staff = await prisma.user.findUnique({ where: { id } });

        await prisma.$transaction(async (tx) => {
            // Unlink from courses if staff exists
            if (staff) {
                await tx.course.updateMany({
                    where: { instructorId: staff.id },
                    data: { instructorId: null }
                });
            }

            await tx.profile.deleteMany({ where: { userId: id } });
            await tx.refreshToken.deleteMany({ where: { userId: id } });
            await tx.user.delete({ where: { id } });
        });

        res.json({ message: 'Staff member deleted' });

        // Log Audit
        if ((req as AuthRequest).user) {
            await logAudit((req as AuthRequest).user!.userId, 'DELETE_STAFF', 'USER', { staffId: id }, req.ip);
        }
    } catch (error) {
        console.error('Delete staff error:', error);
        res.status(500).json({ message: 'Error deleting staff' });
    }
};
