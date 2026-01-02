
import prisma from './utils/prisma';

async function checkCourses() {
    console.log('Checking courses and instructors...');
    const courses = await prisma.course.findMany({
        include: {
            instructor: true
        }
    });

    if (courses.length === 0) {
        console.log('No courses found.');
    } else {
        courses.forEach(c => {
            console.log(`Course: ${c.name} (${c.code})`);
            console.log(`- Instructor ID: ${c.instructorId}`);
            if (c.instructor) {
                console.log(`- Instructor Name: ${c.instructor.name}`);
            } else {
                console.log(`- Instructor: NULL (Not assigned or user deleted)`);
            }
            console.log('---');
        });
    }
}

checkCourses()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
