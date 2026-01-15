
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUsers() {
    const password = await bcrypt.hash('password123', 10);

    const users = [
        { username: 'TEST_ADMIN', email: 'test_admin@example.com', role: 'ADMIN', name: 'Test Admin' },
        { username: 'TEST_STAFF', email: 'test_staff@example.com', role: 'STAFF', name: 'Test Staff' },
        { username: 'TEST_STUDENT', email: 'test_student@example.com', role: 'STUDENT', name: 'Test Student' }
    ];

    for (const u of users) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: { password, role: u.role }, // Ensure role is correct
            create: {
                username: u.username,
                email: u.email,
                password,
                name: u.name,
                role: u.role
            }
        });
        console.log(`User ${u.username} ready.`);
    }
}

createUsers()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
