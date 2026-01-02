
import prisma from './utils/prisma';

async function assignInstructors() {
    // ID from the debug output (Ms. Kentt Fawla)
    const staffId = '965560fb-1fc8-432e-86db-4425146a3804';

    console.log(`Assigning Staff (${staffId}) to orphan courses...`);

    const result = await prisma.course.updateMany({
        where: {
            instructorId: null
        },
        data: {
            instructorId: staffId
        }
    });

    console.log(`Updated ${result.count} courses.`);
}

assignInstructors()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
