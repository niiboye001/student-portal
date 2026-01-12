
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debugAttendance() {
    try {
        console.log('Fetching first course...');
        const course = await prisma.course.findFirst({
            include: { _count: { select: { enrollments: true } } }
        });

        if (!course) {
            console.log('No courses found.');
            return;
        }

        console.log(`Checking Course: ${course.name} (${course.id})`);
        console.log(`Enrollment Count (via _count): ${course._count.enrollments}`);

        const enrollments = await prisma.enrollment.findMany({
            where: { courseId: course.id },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        console.log(`Enrollments fetched: ${enrollments.length}`);
        if (enrollments.length > 0) {
            console.log('First student:', enrollments[0].user);
        } else {
            console.log('No enrollments fetched via findMany.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debugAttendance();
