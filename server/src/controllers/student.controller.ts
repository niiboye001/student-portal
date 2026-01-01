import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const getDashboardData = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Fetch user with enrollments and courses for stats
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                enrollments: {
                    include: { course: true }
                }
            }
        });

        // Calculate Stats
        const todayDate = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(todayDate.getDate() + 7);

        // Calculate Stats
        const gradeMap: { [key: string]: number } = {
            'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D': 1.0, 'F': 0.0
        };

        let totalGradePoints = 0;
        let totalCreditsWithGrades = 0;
        let totalEarnedCredits = 0;
        let completedCoursesCount = 0;

        user?.enrollments.forEach(en => {
            if (en.grade && gradeMap[en.grade] !== undefined) {
                totalGradePoints += gradeMap[en.grade] * en.course.credits;
                totalCreditsWithGrades += en.course.credits;
            }
            if (en.progress === 100) {
                totalEarnedCredits += en.course.credits;
                completedCoursesCount++;
            }
        });

        const gpa = totalCreditsWithGrades > 0
            ? (totalGradePoints / totalCreditsWithGrades).toFixed(2)
            : "0.00";

        // Count upcoming assignments
        const upcomingAssignmentsIcon = await prisma.assignment.count({
            where: {
                course: {
                    enrollments: {
                        some: { userId }
                    }
                },
                dueDate: {
                    gte: todayDate,
                    lte: nextWeek
                },
                status: 'PENDING'
            }
        });

        const stats = {
            gpa: gpa,
            attendance: "94%",
            credits: totalEarnedCredits,
            standing: parseFloat(gpa) >= 3.0 ? "Good" : "Probation",
            completedCourses: completedCoursesCount,
            upcomingAssignments: upcomingAssignmentsIcon
        };

        // Get today's classes from ClassSchedule
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[todayDate.getDay()];

        const todayClasses = await prisma.classSchedule.findMany({
            where: {
                day: today,
                course: {
                    enrollments: {
                        some: { userId }
                    }
                }
            },
            include: { course: true }
        });

        const upcomingClasses = todayClasses.map(c => ({
            id: c.id,
            name: c.course.name,
            time: c.startTime,
            room: c.room
        }));

        // Get announcements (link to a real model later if needed)
        const announcements = [
            { id: 1, title: "Midterm Schedule Released", date: "2 days ago", type: "academic" },
            { id: 2, title: "Campus WiFi Maintenance", date: "1 day ago", type: "system" }
        ];

        res.json({
            student: {
                name: user?.name,
                program: "Computer Science",
                id: "STU-2024-" + user?.id.substring(0, 4).toUpperCase()
            },
            stats,
            upcomingClasses,
            announcements
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
};

export const getCourses = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const enrollments = await prisma.enrollment.findMany({
            where: { userId },
            include: { course: true }
        });

        const courses = enrollments.map(en => ({
            id: en.course.id,
            name: en.course.name,
            code: en.course.code,
            grade: en.grade || 'N/A',
            progress: en.progress
        }));

        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching courses' });
    }
};

export const getCourseDetails = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        const enrollment = await prisma.enrollment.findFirst({
            where: {
                userId,
                courseId: id
            },
            include: {
                course: {
                    include: {
                        assignments: {
                            orderBy: { dueDate: 'asc' }
                        }
                    }
                }
            }
        });

        if (!enrollment) {
            return res.status(404).json({ message: 'Course enrollment not found' });
        }

        const detailedCourse = {
            ...enrollment.course,
            grade: enrollment.grade,
            progress: enrollment.progress,
            // Keep syllabus as mock for now as it's not in schema
            syllabus: [
                "Module 1: Introduction and Core Concepts",
                "Module 2: Intermediate Techniques",
                "Module 3: Advanced Applications",
                "Module 4: Final Project and Review"
            ],
            upcomingAssignments: enrollment.course.assignments.map(a => ({
                id: a.id,
                title: a.title,
                dueDate: new Date(a.dueDate).toLocaleDateString(),
                status: a.status
            }))
        };

        res.json(detailedCourse);
    } catch (error) {
        console.error('Error fetching course details:', error);
        res.status(500).json({ message: 'Error fetching course details' });
    }
};

export const submitProject = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        // Verify enrollment
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                userId,
                courseId: id
            }
        });

        if (!enrollment) {
            return res.status(404).json({ message: 'Course enrollment not found' });
        }

        // Simulate file processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log(`[SUBMISSION] User ${userId} submitted project for Course ${id}`);

        // In a real app, you'd save the file reference or update the enrollment status
        res.json({ message: 'Project submitted successfully!' });
    } catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({ message: 'Failed to submit project' });
    }
};

export const getSchedule = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

        const schedule = await Promise.all(days.map(async (day) => {
            const classes = await prisma.classSchedule.findMany({
                where: {
                    day: day,
                    course: {
                        enrollments: {
                            some: { userId }
                        }
                    }
                },
                include: { course: true }
            });

            return {
                day,
                classes: classes.map(c => ({
                    name: c.course.name,
                    time: `${c.startTime} - ${c.endTime}`,
                    room: c.room,
                    type: c.type
                }))
            };
        }));

        res.json(schedule);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching schedule' });
    }
};

export const getAssignments = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const assignments = await prisma.assignment.findMany({
            where: {
                course: {
                    enrollments: {
                        some: { userId }
                    }
                }
            },
            include: { course: true },
            orderBy: { dueDate: 'asc' }
        });

        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching assignments' });
    }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true }
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            fullName: user.name,
            email: user.email,
            // In a real app we wouldn't send passwords back, but frontend form expects fields
            // We'll handle password updates via a separate endpoint
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { fullName, email, newPassword } = req.body;

        const requestData: any = {
            name: fullName,
            email: email
        };

        if (newPassword) {
            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            requestData.password = hashedPassword;
        }

        await prisma.user.update({
            where: { id: userId },
            data: requestData
        });

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile' });
    }
};
