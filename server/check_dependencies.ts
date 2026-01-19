
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkDependencies() {
    const userId = 'STD-54998';

    // Find the user's internal ID first
    const user = await prisma.user.findUnique({ where: { username: userId } });

    if (!user) {
        console.log('User not found!');
        return;
    }

    console.log(`Checking dependencies for User: ${user.name} (${user.id})`);

    const enrollments = await prisma.enrollment.count({ where: { userId: user.id } });
    console.log(`- Enrollments: ${enrollments}`);

    const submissions = await prisma.submission.count({ where: { studentId: user.id } });
    console.log(`- Submissions: ${submissions}`);

    const refreshTokens = await prisma.refreshToken.count({ where: { userId: user.id } });
    console.log(`- RefreshTokens: ${refreshTokens}`);

    const audits = await prisma.auditLog.count({ where: { userId: user.id } });
    console.log(`- AuditLogs: ${audits}`);

    const profile = await prisma.profile.count({ where: { userId: user.id } });
    console.log(`- Profile: ${profile}`);
}

checkDependencies().finally(() => prisma.$disconnect());
