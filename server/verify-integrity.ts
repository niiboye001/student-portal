
import prisma from './src/utils/prisma';

async function main() {
    console.log('--- DB INTEGRITY CHECK ---');
    try {
        // 1. Check User Table
        console.log('Checking Users...');
        const userCount = await prisma.user.count();
        console.log(`User Count: ${userCount}`);
        const users = await prisma.user.findMany({ select: { email: true, role: true } });
        console.log('Users:', users);

        // 2. Check Course Table
        console.log('Checking Courses...');
        const courseCount = await prisma.course.count();
        console.log(`Course Count: ${courseCount}`);

        // 3. Try to Create a Course (Test Schema)
        console.log('Test: Creating a dummy course...');
        const testCourse = await prisma.course.create({
            data: {
                name: 'Integrity Test',
                code: 'INT' + Math.floor(Math.random() * 999),
                credits: 3,
                level: 100,
                semester: 1,
                instructor: 'System'
            }
        });
        console.log('Created:', testCourse);

        // Cleanup
        await prisma.course.delete({ where: { id: testCourse.id } });
        console.log('Cleanup successful.');

    } catch (error: any) {
        console.error('--- INTEGRITY CHECK FAILED ---');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
