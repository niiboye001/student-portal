import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // 1. Create Users
    const password = await bcrypt.hash('password123', 12);

    const alex = await prisma.user.upsert({
        where: { email: 'alex.johnson@university.edu' },
        update: {},
        create: {
            email: 'alex.johnson@university.edu',
            name: 'Alex Johnson',
            password,
            role: 'STUDENT',
            profile: {
                create: {
                    bio: 'CS Student',
                    phone: '(555) 123-4567',
                    address: '123 Campus Dr'
                }
            }
        },
    });

    console.log({ alex });

    // 2. Create Courses
    const coursesData = [
        { name: "Data Structures", code: "CS201", credits: 4 },
        { name: "Web Development", code: "CS205", credits: 3 },
        { name: "Linear Algebra", code: "MATH204", credits: 3 },
        { name: "Database Systems", code: "CS203", credits: 3 }
    ];

    for (const c of coursesData) {
        const course = await prisma.course.upsert({
            where: { code: c.code },
            update: {},
            create: c,
        });

        // 3. Enroll Alex
        await prisma.enrollment.create({
            data: {
                userId: alex.id,
                courseId: course.id,
                grade: ['A', 'A-', 'B+', 'A'][Math.floor(Math.random() * 4)],
                progress: Math.floor(Math.random() * 50) + 50
            }
        }).catch(() => console.log(`Already enrolled in ${c.code}`));
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
