
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
    try {
        console.log("Cleaning up test assignments...");
        const result = await prisma.assignment.deleteMany({
            where: {
                title: {
                    in: ['Final UI Test', 'API Verification Valid', 'Final Verification Quiz', 'Integration Quiz 2']
                }
            }
        });
        console.log(`Deleted ${result.count} test assignments.`);
    } catch (e) {
        console.error("Cleanup failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
