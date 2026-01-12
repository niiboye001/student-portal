
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DEBUG UNREAD POSTS ---');

    // 1. Find the student
    const student = await prisma.user.findUnique({
        where: { username: 'STD-37928' }
    });

    if (!student) {
        console.log('Student not found');
        return;
    }

    console.log(`Student: ${student.username} (${student.id})`);

    // 2. Find enrollments for this student
    const enrollments = await prisma.enrollment.findMany({
        where: { userId: student.id },
        include: { course: true }
    });

    console.log(`Found ${enrollments.length} enrollments.`);

    for (const enrollment of enrollments) {
        console.log(`\nCourse: ${enrollment.course.name} (${enrollment.course.code})`);
        console.log(`Enrollment ID: ${enrollment.id}`);
        console.log(`Last Viewed At: ${enrollment.lastViewedDiscussionsAt}`);

        // 3. Count unread posts logic
        const unreadCount = await prisma.discussion.count({
            where: {
                courseId: enrollment.courseId,
                createdAt: {
                    gt: enrollment.lastViewedDiscussionsAt
                }
            }
        });

        console.log(`Calculated Unread Count: ${unreadCount}`);

        // 4. List recent posts
        const recentPosts = await prisma.discussion.findMany({
            where: { courseId: enrollment.courseId },
            orderBy: { createdAt: 'desc' },
            take: 3
        });

        if (recentPosts.length > 0) {
            console.log('Recent Posts:');
            recentPosts.forEach(p => {
                const isUnread = p.createdAt > enrollment.lastViewedDiscussionsAt;
                console.log(` - [${isUnread ? 'UNREAD' : 'READ'}] ${p.createdAt.toISOString()} | ${p.content}`);
            });
        } else {
            console.log('No posts in this course.');
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
