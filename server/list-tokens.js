const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tokens = await prisma.refreshToken.findMany({
        include: { user: { select: { email: true } } }
    });
    console.log('Refresh Tokens:');
    tokens.forEach(t => {
        console.log(`- User: ${t.user.email}, Revoked: ${t.revoked}, Expires: ${t.expiresAt.toISOString()}`);
    });
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
