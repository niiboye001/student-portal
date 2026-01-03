import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { name: true, email: true, id: true }
    });
    console.table(students);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
