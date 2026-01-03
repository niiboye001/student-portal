import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { sendGradeNotification } from '../services/email.service';
import { updateEnrollmentStats } from '../utils/enrollment-stats';

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

export const getAssignmentSubmissions = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.userId;
        const { id, assignmentId } = req.params;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Verify ownership
        const course = await prisma.course.findFirst({
            where: { id, instructorId: userId }
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found or unauthorized' });
        }

        // Fetch submissions including student info
        const submissions = await prisma.submission.findMany({
            where: { assignmentId },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { submittedAt: 'desc' }
        });

        // Also fetch all students to show who hasn't submitted yet
        const enrollments = await prisma.enrollment.findMany({
            where: { courseId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { user: { name: 'asc' } }
        });

        // Combine data
        const studentSubmissions = enrollments.map(enrollment => {
            const submission = submissions.find(s => s.studentId === enrollment.userId);
            return {
                student: enrollment.user,
                submission: submission || null,
                status: submission ? (submission.grade ? 'GRADED' : 'SUBMITTED') : 'MISSING' // Simple missing logic for now
            };
        });

        res.json(studentSubmissions);

    } catch (error) {
        console.error('Get submissions error:', error);
        res.status(500).json({ message: 'Error fetching submissions' });
    }
};

export const gradeSubmission = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.userId;
        const { id, assignmentId, submissionId } = req.params; // submissionId is actually studentId in our schema logic or the actual submission id.
        // Wait, schema says @@id([assignmentId, studentId]). 
        // But we probably want to pass studentId to identify the submission if we don't have a single PK.
        // Actually, let's check schema/previous code. 
        // upsert uses assignmentId_studentId.
        // The submission list returns the submission object which has createdAt etc.
        // But since it is a compound key, passing studentId is cleaner if we don't expose a generated ID.
        // Howerver, standard practice might be simpler.
        // Let's look at getAssignmentSubmissions response. It returns `submission: { ... }`.
        // Let's pass `studentId` in the body or params to identify strictly.
        // Actually, let's use the route: /:assignmentId/submissions/:studentId/grade 
        // Because one student one submission per assignment usually.

        const { grade, feedback } = req.body;
        const studentId = req.params.studentId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Verify ownership of course
        const course = await prisma.course.findFirst({
            where: { id, instructorId: userId }
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found or unauthorized' });
        }

        // Update Submission
        const submission = await prisma.submission.update({
            where: {
                assignmentId_studentId: {
                    assignmentId,
                    studentId
                }
            },
            data: {
                grade,
                feedback
            },
            include: {
                student: true,
                assignment: true
            }
        });

        // Send Email Notification
        if (submission.student.email) {
            // Import dynamically or at top if possible, but for minimal diff we can use dynamic or ensuring import at top
            // Better to add import at top in next step or now if replace allows.
            // Using dynamic import for safety in this chunk or assume I'll add import.
            // Let's rely on the IDE to help or just add the import at the top in a separate call.
            // Actually, I'll add the logic here and then add the import.

            // Wait, I can't use dynamic import easily in TS without configuration sometimes. 
            // I'll add the call here and add the import in the next tool call.
        }

        // We need the email service. 
        // Let's modify the response to include sending email.

        try {
            await sendGradeNotification(submission.student.email, submission.assignment.title, grade, feedback);
            // Update enrollment stats (grade and progress)
            await updateEnrollmentStats(submission.studentId, submission.assignment.courseId);
        } catch (emailError) {
            console.error('Failed to send email notification or update stats', emailError);
            // Don't fail the request if email/stats fails
        }

        res.json(submission);

    } catch (error) {
        console.error('Grade submission error:', error);
        res.status(500).json({ message: 'Error grading submission' });
    }
};
