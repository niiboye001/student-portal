
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addFileUrl() {
    try {
        // List all students
        const students = await prisma.user.findMany({ where: { role: 'STUDENT' } });

        let assignment = null;

        for (const student of students) {
            assignment = await prisma.assignment.findFirst({
                where: {
                    course: {
                        enrollments: {
                            some: { userId: student.id }
                        }
                    }
                }
            });
            if (assignment) {
                console.log(`Found assignment for student ${student.name}`);
                break;
            }
        }

        if (!assignment) {
            console.log('No assignment found for any student');
            return;
        }

        console.log(`Updating Assignment: ${assignment.title} (${assignment.id})`);

        // Update with a dummy PDF URL
        await prisma.assignment.update({
            where: { id: assignment.id },
            data: {
                fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
            }
        });

        console.log('Updated with fileUrl');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addFileUrl();
