require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkUser() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'alex.johnson@university.edu' }
        });

        if (user) {
            console.log('\n=== USER FOUND ===');
            console.log('ID:', user.id);
            console.log('Email:', user.email);
            console.log('Name:', user.name);
            console.log('Role:', user.role);
            console.log('Password Hash:', user.password.substring(0, 20) + '...');
            console.log('Created:', user.createdAt);

            // Test password
            const isValid = await bcrypt.compare('password123', user.password);
            console.log('\nPassword "password123" is valid:', isValid);

            if (!isValid) {
                console.log('\n⚠️  Password hash is invalid! Need to reset it.');
            }
        } else {
            console.log('\n❌ USER NOT FOUND');
            console.log('Email: alex.johnson@university.edu does not exist in database');
            console.log('\nListing all users:');
            const allUsers = await prisma.user.findMany({
                select: { id: true, email: true, name: true }
            });
            console.log(allUsers);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
