
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function forceDelete() {
    const userId = 'STD-54998';
    const user = await prisma.user.findUnique({ where: { username: userId } });

    if (!user) {
        console.log('User not found.');
        return;
    }

    console.log(`Deleting dependencies for ${user.username}...`);

    // Delete AuditLogs
    const logs = await prisma.auditLog.deleteMany({ where: { userId: user.id } });
    console.log(`- Deleted ${logs.count} AuditLogs`);

    // Delete Profile
    const profile = await prisma.profile.deleteMany({ where: { userId: user.id } });
    console.log(`- Deleted ${profile.count} Profile`);

    // Delete RefreshTokens
    const tokens = await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    console.log(`- Deleted ${tokens.count} RefreshTokens`);

    // Delete Enrollments
    const enrollments = await prisma.enrollment.deleteMany({ where: { userId: user.id } });
    console.log(`- Deleted ${enrollments.count} Enrollments`);

    // Finally Delete User
    await prisma.user.delete({ where: { id: user.id } });
    console.log(`Successfully deleted user ${userId}`);
}

forceDelete().finally(() => prisma.$disconnect());
