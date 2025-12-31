// Set DATABASE_URL explicitly before loading Prisma
process.env.DATABASE_URL = 'file:./dev.db';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
    try {
        console.log('Starting seed...');

        // Clean up ALL data in correct order (children first)
        await prisma.assignment.deleteMany({});
        await prisma.refreshToken.deleteMany({});
        await prisma.enrollment.deleteMany({});
        await prisma.classSchedule.deleteMany({});
        await prisma.profile.deleteMany({});
        await prisma.course.deleteMany({});
        await prisma.user.deleteMany({});
        console.log('Database cleaned');

        // Hash password
        const password = await bcrypt.hash('password123', 12);
        console.log('Password hashed');

        // Create Admin user
        const admin = await prisma.user.create({
            data: {
                email: 'admin@university.edu',
                name: 'System Admin',
                password: password,
                role: 'ADMIN'
            }
        });
        console.log('Admin created:', admin.email);

        // Create student user
        const user = await prisma.user.create({
            data: {
                email: 'sharp.brain@gmail.com',
                name: 'Sharp Brain',
                password: password,
                role: 'STUDENT'
            }
        });
        console.log('Student created:', user.email);

        // Create profile
        await prisma.profile.create({
            data: {
                userId: user.id,
                bio: 'CS Student',
                phone: '(555) 123-4567',
                address: '123 Campus Dr'
            }
        });
        console.log('Profile created');

        // Create courses
        const dsCourse = await prisma.course.create({
            data: {
                code: 'CS101',
                name: 'Data Structures',
                credits: 4,
                instructor: 'Dr. Alan Turing',
                description: 'Fundamental data structures and algorithms.'
            }
        });

        const webCourse = await prisma.course.create({
            data: {
                code: 'CS202',
                name: 'Web Development',
                credits: 3,
                instructor: 'Prof. Tim Berners-Lee',
                description: 'Modern web technologies and frameworks.'
            }
        });

        const mathCourse = await prisma.course.create({
            data: {
                code: 'MATH101',
                name: 'Linear Algebra',
                credits: 3,
                instructor: 'Dr. Gilbert Strang',
                description: 'Systems of linear equations and vector spaces.'
            }
        });

        const dbCourse = await prisma.course.create({
            data: {
                code: 'CS303',
                name: 'Database Systems',
                credits: 3,
                instructor: 'Dr. Edgar Codd',
                description: 'Relational database design and SQL.'
            }
        });

        // Enroll student in all courses with varied grades
        await prisma.enrollment.createMany({
            data: [
                { userId: user.id, courseId: dsCourse.id, grade: 'A', progress: 100 },
                { userId: user.id, courseId: webCourse.id, grade: 'B+', progress: 100 },
                { userId: user.id, courseId: mathCourse.id, grade: 'A-', progress: 100 },
                { userId: user.id, courseId: dbCourse.id, grade: null, progress: 45 }
            ]
        });

        // Create some Class Schedules
        await prisma.classSchedule.createMany({
            data: [
                { courseId: dsCourse.id, day: 'Monday', startTime: '10:00 AM', endTime: '12:00 PM', room: 'CS-101', type: 'Lecture' },
                { courseId: dsCourse.id, day: 'Wednesday', startTime: '10:00 AM', endTime: '11:00 AM', room: 'LAB-1', type: 'Lab' },
                { courseId: webCourse.id, day: 'Tuesday', startTime: '01:00 PM', endTime: '03:00 PM', room: 'LAB-3', type: 'Lecture' },
                { courseId: dbCourse.id, day: 'Thursday', startTime: '02:30 PM', endTime: '04:00 PM', room: 'CS-202', type: 'Lecture' }
            ]
        });

        // Create some Assignments
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        await prisma.assignment.createMany({
            data: [
                { title: 'Red-Black Tree Implementation', dueDate: nextWeek, courseId: dsCourse.id, status: 'PENDING' },
                { title: 'React Portfolio Design', dueDate: tomorrow, courseId: webCourse.id, status: 'SUBMITTED' },
                { title: 'Normal Forms Exercise', dueDate: nextWeek, courseId: dbCourse.id, status: 'PENDING' }
            ]
        });

        console.log('Courses, Enrollments, Schedules, and Assignments created');

        console.log('\n✅ Seed completed successfully!');
        console.log('\nLogin credentials:');
        console.log('Email: sharp.brain@gmail.com');
        console.log('Password: Password1123');

    } catch (error) {
        console.error('Seed error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
