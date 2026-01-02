import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('password123', 12);

    // 1. Create Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@university.edu' },
        update: {},
        create: {
            username: 'ADM-00001',
            email: 'admin@university.edu',
            name: 'System Admin',
            password,
            role: 'ADMIN',
            profile: { create: { bio: 'System Administrator' } }
        },
    });
    console.log(`Created Admin: ADM-00001`);

    // 2. Create Student
    const student = await prisma.user.upsert({
        where: { email: 'alex.johnson@university.edu' },
        update: {},
        create: {
            username: 'STD-12345',
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
    console.log(`Created Student: STD-12345`);

    // 3. Create Staff / Tutor
    const staff = await prisma.user.upsert({
        where: { email: 'sarah.connor@university.edu' },
        update: {},
        create: {
            username: 'STF-54321',
            email: 'sarah.connor@university.edu',
            name: 'Sarah Connor',
            password,
            role: 'TUTOR', // Using TUTOR as per schema default role logic update
            profile: { create: { bio: 'Professor of Computer Science' } }
        },
    });
    console.log(`Created Staff: STF-54321`);

    // 4. Create Courses
    const coursesData = [
        { name: "Data Structures", code: "CS201", credits: 4, instructorId: staff.id }, // Assign to staff
        { name: "Web Development", code: "CS205", credits: 3 },
        { name: "Linear Algebra", code: "MATH204", credits: 3 },
        { name: "Database Systems", code: "CS203", credits: 3 }
    ];

    for (const c of coursesData) {
        // Find existing to avoid errors or just use upsert
        const course = await prisma.course.upsert({
            where: { code: c.code },
            update: {
                instructorId: c.instructorId // Update instructor if exists
            },
            create: c,
        });

        // Enroll Student
        await prisma.enrollment.deleteMany({ where: { userId: student.id, courseId: course.id } }); // Clear existing for clean slate if re-running

        await prisma.enrollment.create({
            data: {
                userId: student.id,
                courseId: course.id,
                grade: ['A', 'A-', 'B+', 'A'][Math.floor(Math.random() * 4)],
                progress: Math.floor(Math.random() * 50) + 50
            }
        }).catch((e) => console.log(`Enrollment error for ${c.code}: ${e.message}`));
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
