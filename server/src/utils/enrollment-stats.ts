import prisma from './prisma';

const gradePoints: { [key: string]: number } = {
    'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D': 1.0, 'F': 0.0
};

export const updateEnrollmentStats = async (userId: string, courseId: string) => {
    try {
        // 1. Calculate Progress
        // Count total assignments for the course
        const totalAssignments = await prisma.assignment.count({
            where: { courseId }
        });

        // Count submissions made by the student for this course
        const submittedAssignments = await prisma.submission.count({
            where: {
                assignment: { courseId },
                studentId: userId,
            }
        });

        const progress = totalAssignments > 0
            ? Math.round((submittedAssignments / totalAssignments) * 100)
            : 0;

        // 2. Calculate Grade
        // Fetch all assignments that have been graded for this student in this course
        const gradedSubmissions = await prisma.submission.findMany({
            where: {
                assignment: { courseId },
                studentId: userId,
                grade: { not: null }
            },
            select: { grade: true }
        });

        let newGrade = null;

        if (gradedSubmissions.length > 0) {
            let totalPoints = 0;
            let count = 0;

            for (const sub of gradedSubmissions) {
                // Ensure grade is valid letter grade
                if (sub.grade && gradePoints[sub.grade] !== undefined) {
                    totalPoints += gradePoints[sub.grade];
                    count++;
                }
            }

            if (count > 0) {
                const avgPoints = totalPoints / count;

                // Find closest letter grade
                let minDiff = 100;

                for (const [grade, point] of Object.entries(gradePoints)) {
                    const diff = Math.abs(point - avgPoints);
                    if (diff < minDiff) {
                        minDiff = diff;
                        newGrade = grade; // Set closest grade
                    }
                }
            }
        }

        // 3. Update Enrollment
        await prisma.enrollment.update({
            where: {
                userId_courseId: {
                    userId,
                    courseId
                }
            },
            data: {
                progress,
                ...(newGrade && { grade: newGrade })
            }
        });



    } catch (error) {
        console.error('Error updating enrollment stats:', error);
    }
};
