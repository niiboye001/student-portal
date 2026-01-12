import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { logAudit } from '../services/audit.service';
import { updateEnrollmentStats } from '../utils/enrollment-stats';
import { AuthRequest } from '../middleware/auth.middleware';

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

        const activeEnrollments = user?.enrollments.length || 0;

        const totalProgress = user?.enrollments.reduce((acc, curr) => acc + curr.progress, 0) || 0;
        const avgProgress = activeEnrollments > 0 ? Math.round(totalProgress / activeEnrollments) : 0;

        const stats = {
            gpa: gpa,
            activeCourses: activeEnrollments,
            avgProgress: avgProgress,
            credits: totalEarnedCredits,
            standing: parseFloat(gpa) >= 3.0 ? "Good" : "Probation",
            completedCourses: completedCoursesCount,
            upcomingAssignments: upcomingAssignmentsIcon
        };

        // Get upcoming classes (Next 7 days)
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayIndex = todayDate.getDay();
        const currentTime = todayDate.getHours() * 60 + todayDate.getMinutes(); // Minutes from midnight

        const allSchedules = await prisma.classSchedule.findMany({
            where: {
                course: {
                    enrollments: {
                        some: { userId }
                    }
                }
            },
            include: { course: true }
        });

        const upcomingClasses = allSchedules
            .map(schedule => {
                const scheduleDayIndex = days.indexOf(schedule.day);
                let daysUntil = scheduleDayIndex - currentDayIndex;

                // Convert start time to minutes
                const [hours, minutes] = schedule.startTime.split(':').map(Number);
                const scheduleTimeMinutes = hours * 60 + minutes;

                if (daysUntil < 0) {
                    daysUntil += 7; // Next week
                } else if (daysUntil === 0) {
                    if (scheduleTimeMinutes < currentTime) {
                        daysUntil += 7; // Already passed today, so next week
                    }
                }

                return {
                    ...schedule,
                    daysUntil,
                    timeMinutes: scheduleTimeMinutes
                };
            })
            .sort((a, b) => {
                if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
                return a.timeMinutes - b.timeMinutes;
            })
            .slice(0, 5) // Take top 5
            .map(c => ({
                id: c.id,
                name: c.course.name,
                time: c.startTime,
                room: c.room,
                day: c.day,
                isToday: c.daysUntil === 0
            }));

        // Get real announcements
        // Get real announcements
        const now = new Date();
        const enrolledCourseIds = user?.enrollments.map(e => e.courseId) || [];

        const rawAnnouncements = await prisma.announcement.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gt: now } }
                        ]
                    },
                    {
                        OR: [
                            // 1. System Announcements (No Course)
                            {
                                courseId: null,
                                OR: [
                                    { targetRole: null },
                                    { targetRole: 'STUDENT' }
                                ]
                            },
                            // 2. Course Announcements (Enrolled Courses)
                            {
                                courseId: { in: enrolledCourseIds },
                                OR: [
                                    { targetRole: null },
                                    { targetRole: 'STUDENT' }
                                ]
                            }
                        ]
                    }
                ]
            },
            take: 5,
            include: { course: true },
            orderBy: { createdAt: 'desc' }
        });

        const announcements = rawAnnouncements.map(a => ({
            id: a.id,
            title: a.title,
            content: a.content,
            date: a.createdAt.toISOString().split('T')[0], // YYYY-MM-DD
            type: a.type,
            courseName: a.course?.name || 'System Announcement'
        }));

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
            include: { course: { include: { instructor: true } } }
        });

        const courses = enrollments.map(en => ({
            id: en.course.id,
            name: en.course.name,
            code: en.course.code,
            instructor: en.course.instructor?.name || 'Unixsigned',
            level: en.course.level,
            semester: en.course.semester,
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
                        instructor: true,
                        assignments: {
                            include: {
                                submissions: {
                                    where: { studentId: userId }
                                }
                            },
                            orderBy: { dueDate: 'asc' }
                        },
                        modules: {
                            include: { items: { orderBy: { order: 'asc' } } },
                            orderBy: { order: 'asc' }
                        },
                        announcements: {
                            orderBy: { createdAt: 'desc' }
                        },
                        _count: {
                            select: { discussions: true }
                        }
                    }
                }
            }
        });

        if (!enrollment) {
            return res.status(404).json({ message: 'Course enrollment not found' });
        }

        const unreadCount = await prisma.discussion.count({
            where: {
                courseId: id,
                createdAt: {
                    gt: enrollment.lastViewedDiscussionsAt
                }
            }
        });

        const detailedCourse = {
            ...enrollment.course,
            grade: enrollment.grade,
            progress: enrollment.progress,
            unreadDiscussionsCount: unreadCount,
        };

        res.json(detailedCourse);
    } catch (error) {
        console.error('Error fetching course details:', error);
        res.status(500).json({ message: 'Error fetching course details' });
    }
};

export const submitAssignment = async (req: AuthRequest, res: Response) => {
    try {
        const { id, assignmentId } = req.params; // id is courseId (unused but keeps REST path), assignmentId
        const userId = req.user?.userId;
        const { content } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Check if assignment exists
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId }
        });

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check existing submission
        const existingSubmission = await prisma.submission.findUnique({
            where: {
                assignmentId_studentId: {
                    assignmentId,
                    studentId: userId
                }
            }
        });

        if (existingSubmission && existingSubmission.grade) {
            return res.status(400).json({ message: 'Cannot resubmit a graded assignment' });
        }

        // Create or Update Submission
        const submission = await prisma.submission.upsert({
            where: {
                assignmentId_studentId: {
                    assignmentId,
                    studentId: userId
                }
            },
            update: {
                content,
                submittedAt: new Date()
            },
            create: {
                assignmentId,
                studentId: userId,
                content
            }
        });

        // Update enrollment stats (progress)
        await updateEnrollmentStats(userId, assignment.courseId);

        res.json(submission);
    } catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({ message: 'Failed to submit assignment' });
    }
};

export const getSchedule = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
            include: {
                course: true,
                submissions: {
                    where: { studentId: userId }
                }
            },
            orderBy: { dueDate: 'asc' }
        });

        const assignmentsWithStatus = assignments.map(a => {
            const submission = a.submissions[0];
            let status = a.status; // Default (e.g., PENDING)
            const now = new Date();
            const due = new Date(a.dueDate);

            if (submission) {
                if (submission.grade) {
                    status = 'GRADED';
                } else if (new Date(submission.submittedAt) > due) {
                    status = 'LATE';
                } else {
                    status = 'SUBMITTED';
                }
            } else if (now > due) {
                status = 'MISSING';
            }

            return {
                id: a.id,
                title: a.title,
                description: a.description,
                dueDate: a.dueDate,
                status: status,
                course: a.course,
                courseId: a.courseId,
                grade: submission?.grade, // Include grade if available
                submission: submission || null,
                fileUrl: a.fileUrl // Return file URL
            };
        });

        res.json(assignmentsWithStatus);
    } catch (error) {
        console.error('Error fetching assignments:', error);
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

// --- Course Registration ---

export const getAvailableCourses = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        // Verify user has a program
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { programId: true }
        });

        if (!user?.programId) {
            return res.status(403).json({ message: 'You must be assigned to an academic program to register.' });
        }

        // Get IDs of courses user is already enrolled in
        const enrolled = await prisma.enrollment.findMany({
            where: { userId },
            select: { courseId: true }
        });
        const enrolledIds = enrolled.map(e => e.courseId);

        // Fetch courses NOT in that list AND belonging to student's program
        const availableCourses = await prisma.course.findMany({
            where: {
                id: { notIn: enrolledIds },
                programs: {
                    some: { id: user.programId }
                }
            },
            include: {
                instructor: { select: { name: true } },
                _count: { select: { enrollments: true } },
                department: true // Include department info
            },
            orderBy: { level: 'asc' }
        });

        res.json(availableCourses);
    } catch (error: any) {
        console.error('Get available courses error:', error);
        res.status(500).json({ message: error.message || 'Error fetching available courses' });
    }
};

export const enrollCourse = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { courseId } = req.body;

        if (!userId || !courseId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Verify user has a program
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { programId: true }
        });

        if (!user?.programId) {
            return res.status(403).json({ message: 'You must be assigned to an academic program to register.' });
        }

        const existing = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId
                }
            }
        });

        if (existing) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }

        await prisma.enrollment.create({
            data: {
                userId,
                courseId
            }
        });

        await logAudit(userId, 'ENROLL_COURSE', 'ENROLLMENT', { courseId }, req.ip);

        res.json({ message: 'Enrollment successful' });
    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({ message: 'Error enrolling in course' });
    }
};

export const getTranscript = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                program: { include: { department: true } },
                enrollments: {
                    include: {
                        course: true
                    },
                    orderBy: { course: { code: 'asc' } }
                }
            }
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Calculate GPA
        const gradeMap: { [key: string]: number } = {
            'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D': 1.0, 'F': 0.0
        };

        let totalPoints = 0;
        let totalCredits = 0;

        const transcriptCourses = user.enrollments.map(en => {
            const credits = en.course.credits;
            let points = 0;
            if (en.grade && gradeMap[en.grade] !== undefined) {
                points = gradeMap[en.grade] * credits;
                totalPoints += points;
                totalCredits += credits;
            }

            return {
                code: en.course.code,
                name: en.course.name,
                credits: credits,
                semester: en.course.semester,
                grade: en.grade || 'In Progress',
                points: points
            };
        });

        const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";

        res.json({
            fullName: user.name,
            studentId: "STU-" + user.id.substring(0, 4).toUpperCase(),
            program: user.program?.name || 'Unassigned',
            department: user.program?.department?.name || 'Unassigned',
            email: user.email,
            cgpa,
            courses: transcriptCourses,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('Get transcript error:', error);
        res.status(500).json({ message: 'Error fetching transcript' });
    }
};
