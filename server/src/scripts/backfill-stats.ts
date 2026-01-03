import prisma from '../utils/prisma';
import { updateEnrollmentStats } from '../utils/enrollment-stats';

const backfillStats = async () => {
    console.log('Starting stats backfill...');
    try {
        const enrollments = await prisma.enrollment.findMany();
        console.log(`Found ${enrollments.length} enrollments to update.`);

        for (const enrollment of enrollments) {
            await updateEnrollmentStats(enrollment.userId, enrollment.courseId);
        }

        console.log('Backfill complete!');
    } catch (error) {
        console.error('Backfill error:', error);
    } finally {
        await prisma.$disconnect();
    }
};

backfillStats();
