
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugAssignments() {
    try {
        const students = await prisma.user.findMany({ where: { role: 'STUDENT' } });
        console.log(`Found ${students.length} students.`);

        for (const student of students) {
            // Dashboard Query
            const todayDate = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(todayDate.getDate() + 7);

            const dashboardCount = await prisma.assignment.count({
                where: {
                    course: {
                        enrollments: {
                            some: { userId: student.id }
                        }
                    },
                    dueDate: {
                        gte: todayDate,
                        lte: nextWeek
                    },
                    status: 'PENDING'
                }
            });

            // List Query
            const assignments = await prisma.assignment.findMany({
                where: {
                    course: {
                        enrollments: {
                            some: { userId: student.id }
                        }
                    }
                }
            });

            if (dashboardCount > 0 || assignments.length > 0) {
                console.log(`\nChecking Student: ${student.name} (${student.username})`);
                console.log(`  > Dashboard Count: ${dashboardCount}`);
                console.log(`  > API List Count: ${assignments.length}`);
                if (assignments.length > 0) {
                    console.log('  > Assignments Details:');
                    assignments.forEach(a => console.log(`     - ${a.title} (Status: ${a.status}, Due: ${a.dueDate})`));
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugAssignments();
