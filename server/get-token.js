require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || 'file:./dev.db'
        }
    }
});

async function getResetToken() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'alex.johnson@university.edu' },
            select: { resetToken: true, resetTokenExpiry: true }
        });

        if (user && user.resetToken) {
            console.log('\n=== RESET TOKEN ===');
            console.log('Token:', user.resetToken);
            console.log('Expires:', user.resetTokenExpiry);
            console.log('\nFull Reset Link:');
            console.log(`http://localhost:5173/reset-password?token=${user.resetToken}`);
            console.log('===================\n');
        } else {
            console.log('No reset token found');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

getResetToken();
