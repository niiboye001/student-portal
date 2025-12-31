import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAdminStats = async (req: Request, res: Response) => {
    try {
        const studentCount = await prisma.user.count({ where: { role: 'STUDENT' } });
        const courseCount = await prisma.course.count();
        const enrollmentCount = await prisma.enrollment.count();

        res.json({
            stats: {
                totalStudents: studentCount,
                totalCourses: courseCount,
                totalEnrollments: enrollmentCount
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching admin stats' });
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
