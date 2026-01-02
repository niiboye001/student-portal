import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const getMyCourses = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const courses = await prisma.course.findMany({
            where: {
                instructorId: userId
            },
            include: {
                _count: {
                    select: { enrollments: true }
                },
                schedule: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json(courses);
    } catch (error) {
        console.error('Get my courses error:', error);
        res.status(500).json({ message: 'Error fetching staff courses' });
    }
};

export const getStaffStats = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // 1. Count courses taught by this staff
        const courseCount = await prisma.course.count({
            where: { instructorId: userId }
        });

        // 2. Count unique students enrolled in these courses
        const students = await prisma.enrollment.findMany({
            where: {
                course: {
                    instructorId: userId
                }
            },
            select: {
                userId: true
            },
            distinct: ['userId']
        });

        // 3. Count upcoming classes (basic count of all schedules for now)
        const upcomingClasses = await prisma.classSchedule.count({
            where: {
                course: {
                    instructorId: userId
                }
            }
        });

        res.json({
            courses: courseCount,
            students: students.length,
            upcomingClasses: upcomingClasses
        });

    } catch (error) {
        console.error('Get staff stats error:', error);
        res.status(500).json({ message: 'Error fetching staff stats' });
    }
};

export const getCourseDetails = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const course = await prisma.course.findFirst({
            where: {
                id,
                instructorId: userId
            },
            include: {
                enrollments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                createdAt: true
                            }
                        }
                    },
                    orderBy: {
                        user: {
                            name: 'asc'
                        }
                    }
                },
                schedule: true,
                assignments: {
                    orderBy: {
                        dueDate: 'asc'
                    }
                },
                _count: {
                    select: { enrollments: true, assignments: true }
                }
            }
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found or you are not the instructor' });
        }

        res.json(course);
    } catch (error) {
        console.error('Get course details error:', error);
        res.status(500).json({ message: 'Error fetching course details' });
    }
};

export const getMySchedule = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const schedules = await prisma.classSchedule.findMany({
            where: {
                course: {
                    instructorId: userId
                }
            },
            include: {
                course: {
                    select: {
                        name: true,
                        code: true
                    }
                }
            }
        });

        // Group by day
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const weeklySchedule = days.map(day => {
            const dayClasses = schedules
                .filter(s => s.day === day)
                .map(s => ({
                    name: `${s.course.code} - ${s.course.name}`,
                    time: `${s.startTime} - ${s.endTime}`,
                    room: s.room,
                    type: s.type
                }))
                .sort((a, b) => a.time.localeCompare(b.time));

            return {
                day,
                classes: dayClasses
            };
        });

        res.json(weeklySchedule);

    } catch (error) {
        console.error('Get staff schedule error:', error);
        res.status(500).json({ message: 'Error fetching staff schedule' });
    }
};

export const addClassSchedule = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.userId;
        const { id } = req.params; // courseId
        const { day, startTime, endTime, room, type } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const course = await prisma.course.findFirst({
            where: { id, instructorId: userId }
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found or unauthorized' });
        }

        const schedule = await prisma.classSchedule.create({
            data: {
                courseId: id,
                day,
                startTime,
                endTime,
                room,
                type: type || 'Lecture'
            }
        });

        res.status(201).json(schedule);
    } catch (error) {
        console.error('Add class schedule error:', error);
        res.status(500).json({ message: 'Error adding class schedule' });
    }
};

export const removeClassSchedule = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.userId;
        const { id, scheduleId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Verify ownership via course
        const schedule = await prisma.classSchedule.findFirst({
            where: {
                id: scheduleId,
                course: {
                    instructorId: userId
                }
            }
        });

        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found or unauthorized' });
        }

        await prisma.classSchedule.delete({
            where: { id: scheduleId }
        });

        res.json({ message: 'Schedule removed successfully' });
    } catch (error) {
        console.error('Remove class schedule error:', error);
        res.status(500).json({ message: 'Error removing class schedule' });
    }
};

export const createAssignment = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.userId;
        const { id } = req.params; // courseId
        const { title, description, dueDate, status } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const course = await prisma.course.findFirst({
            where: { id, instructorId: userId }
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found or unauthorized' });
        }

        const assignment = await prisma.assignment.create({
            data: {
                courseId: id,
                title,
                description,
                dueDate: new Date(dueDate),
                status: status || 'PENDING'
            }
        });

        res.status(201).json(assignment);
    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ message: 'Error creating assignment' });
    }
};

export const deleteAssignment = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.userId;
        const { id, assignmentId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Verify ownership via course
        const assignment = await prisma.assignment.findFirst({
            where: {
                id: assignmentId,
                course: {
                    instructorId: userId
                }
            }
        });

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found or unauthorized' });
        }

        await prisma.assignment.delete({
            where: { id: assignmentId }
        });

        res.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({ message: 'Error deleting assignment' });
    }
};
