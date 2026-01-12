// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- SIMULATING INCOMING MESSAGE ---');

    // 1. Find the student enrollment to get the course ID
    const student = await prisma.user.findUnique({ where: { username: 'STD-37928' } });
    if (!student) throw new Error('Student STD-37928 not found');

    const enrollment = await prisma.enrollment.findFirst({
        where: { userId: student.id },
        include: { course: true }
    });

    if (!enrollment) throw new Error('No enrollment found for student');

    console.log(`Target Course: ${enrollment.course.name}`);
    console.log(`Student Last Viewed: ${enrollment.lastViewedDiscussionsAt.toISOString()}`);

    // 2. Find an Instructor (or create a dummy one if needed, or use Admin)
    // We'll use the instructor of the course, or the first admin
    let instructorId = enrollment.course.instructorId;

    if (!instructorId) {
        // Fallback to any admin
        const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        instructorId = admin?.id;
    }

    if (!instructorId) {
        // Create a dummy sender if needed, but for now we skip
        console.log("No instructor/admin found. Cannot post.");
        return;
    }

    // 3. Create a post (Backdated? No, current time is fine, as long as it is > lastViewed)
    // Wait, if lastViewed is NOW (because user just checked), we need to make sure this post is NOW + 1ms
    // Or just create it. The previous lastViewed was set when the user last checked.
    // If we run this script, it happens *after* the user's last check (hopefully).

    const newPost = await prisma.discussion.create({
        data: {
            content: "📢 IMPORTANT: Mid-term exam topics have been released! details in the assignments tab.",
            courseId: enrollment.courseId,
            userId: instructorId
        }
    });

    console.log(`\n✅ Created Post ID: ${newPost.id}`);
    console.log(`Timestamp: ${newPost.createdAt.toISOString()}`);
    console.log(`Content: "${newPost.content}"`);
    console.log(`\nIf the student refreshes the Course Details page, they should see an UNREAD badge.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
