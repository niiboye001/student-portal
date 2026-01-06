
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugSchedule() {
    try {
        console.log('--- Checking Class Schedules ---');
        const schedules = await prisma.classSchedule.findMany({
            include: { course: true }
        });

        if (schedules.length === 0) {
            console.log('NO SCHEDULES FOUND IN DB!');
        } else {
            console.log(`Found ${schedules.length} schedule items.`);
            schedules.forEach(s => {
                console.log(`[${s.day} ${s.startTime}-${s.endTime}] ${s.course.code} (${s.room})`);
            });
        }

        console.log('\n--- Checking Enrollments for the first course with schedule ---');
        if (schedules.length > 0) {
            const courseId = schedules[0].courseId;
            const enrollments = await prisma.enrollment.findMany({
                where: { courseId },
                include: { user: true }
            });
            console.log(`Course ${schedules[0].course.code} has ${enrollments.length} students enrolled.`);
            enrollments.forEach(e => {
                console.log(`- ${e.user.name} (${e.user.role}) - UserID: ${e.userId}`);
            });

            // Verify the Query Logic
            const sampleUserId = enrollments[0]?.userId;
            if (sampleUserId) {
                console.log(`\n--- Simulating Student Schedule Query for ${enrollments[0].user.name} ---`);
                const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                for (const day of days) {
                    const classes = await prisma.classSchedule.findMany({
                        where: {
                            day: day,
                            course: {
                                enrollments: {
                                    some: { userId: sampleUserId }
                                }
                            }
                        }
                    });
                    if (classes.length > 0) {
                        console.log(`Found ${classes.length} classes on ${day}`);
                    }
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugSchedule();
