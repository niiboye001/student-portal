
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const users = [
        { id: 'STF-86690', pass: 'Staff123!', role: 'TUTOR', name: 'Restored Staff' },
        { id: 'STD-45938', pass: 'Student123!', role: 'STUDENT', name: 'Restored Student 1' },
        { id: 'STD-37928', pass: 'Student123!', role: 'STUDENT', name: 'Restored Student 2' },
        { id: 'STD-54998', pass: 'Student123!', role: 'STUDENT', name: 'Restored Student 3' }
    ];

    for (const u of users) {
        const password = await bcrypt.hash(u.pass, 12);
        const email = `${u.id.toLowerCase()}@university.edu`;

        try {
            await prisma.user.upsert({
                where: { username: u.id },
                update: { password }, // Update password just in case
                create: {
                    username: u.id,
                    email,
                    name: u.name,
                    password,
                    role: u.role as any,
                    profile: {
                        create: { bio: 'Restored User' }
                    }
                }
            });
            console.log(`Restored ${u.id}`);
        } catch (e) {
            console.error(`Failed to restore ${u.id}:`, e.message);
        }
    }
}

main().finally(() => prisma.$disconnect());
