import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { name: 'Khan Floh' },
        select: { username: true }
    });
    console.log('Username:', user?.username);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
