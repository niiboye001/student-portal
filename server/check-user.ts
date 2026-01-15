import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'test_staff@example.com';
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (user) {
        console.log('User found:', user);
    } else {
        console.log('User NOT found: ' + email);
        const allUsers = await prisma.user.findMany({ select: { email: true, role: true } });
        console.log('Available users:', allUsers);
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
