
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Attempting to create course...');
        const course = await prisma.course.create({
            data: {
                name: 'Debug Course ' + Date.now(),
                code: 'DBG' + Math.floor(Math.random() * 1000),
                credits: 3,
                level: 100,
                semester: 1,
                instructor: 'Test Instructor'
            }
        });
        console.log('Course created successfully:', course);
    } catch (error) {
        console.error('Failed to create course:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
