import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    try {
        console.log('--- DEBUG FINANCE ---');

        // 1. Find the student by username
        const student = await prisma.user.findUnique({
            where: { username: 'STD-37928' }
        });

        if (!student) {
            console.log('❌ Student STD-37928 not found!');
            return;
        }

        console.log(`✅ Found Student: ${student.name} (${student.email})`);
        console.log(`   UUID: ${student.id}`);
        console.log(`   Username: ${student.username}`);

        // 2. Find invoices for this student
        const invoices = await prisma.invoice.findMany({
            where: { studentId: student.id },
            include: { fee: true }
        });

        console.log(`\n--- Invoices for ${student.username} ---`);
        if (invoices.length === 0) {
            console.log('❌ No invoices found for this student UUID.');
        } else {
            invoices.forEach(inv => {
                console.log(`   [${inv.status}] ${inv.fee.name}: $${inv.amount} (Due: ${inv.dueDate})`);
            });
        }

        // 3. Check all invoices to see if there are orphaned ones
        const allInvoices = await prisma.invoice.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { fee: true }
        });

        console.log('\n--- Reviewing Last 5 created invoices ---');
        allInvoices.forEach(inv => {
            console.log(`   Inv ID: ${inv.id} | Student ID: ${inv.studentId} | Amount: ${inv.amount}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
