import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';

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

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
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
                role: true,
                createdAt: true
            }
        });

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
                }
            }
        });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching courses' });
    }
};
