
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeUsers() {
    const emails = ['test_admin@example.com', 'test_staff@example.com', 'test_student@example.com'];

    try {
        const users = await prisma.user.findMany({
            where: { email: { in: emails } },
            select: { id: true, username: true }
        });

        console.log(`Found ${users.length} users to delete.`);

        for (const user of users) {
            console.log(`Deleting data for ${user.username}...`);

            // Delete related records manually to avoid FK constraint errors
            await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
            await prisma.auditLog.deleteMany({ where: { userId: user.id } });
            await prisma.profile.deleteMany({ where: { userId: user.id } });
            await prisma.enrollment.deleteMany({ where: { userId: user.id } });
            await prisma.submission.deleteMany({ where: { studentId: user.id } });
            await prisma.invoice.deleteMany({ where: { studentId: user.id } });
            await prisma.discussion.deleteMany({ where: { userId: user.id } });
            await prisma.attendance.deleteMany({ where: { studentId: user.id } });
            await prisma.attendance.deleteMany({ where: { markedById: user.id } });

            // Finally delete user
            await prisma.user.delete({ where: { id: user.id } });
            console.log(`Deleted user ${user.username}`);
        }

    } catch (e) {
        console.error('Error deleting users:', e);
    } finally {
        await prisma.$disconnect();
    }
}

removeUsers();
