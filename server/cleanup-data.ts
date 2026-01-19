
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Cleaning up dummy assignments...");
        const result = await prisma.assignment.deleteMany({
            where: {
                title: {
                    in: ['Browser Mimic Assignment', 'Debug Assignment', 'Derivatives Quiz']
                }
            }
        });
        // Note: 'Derivatives Quiz' was the one I tried to create in the browser but failed. 
        // If it failed, it's not there. But if any attempts succeeded (e.g. checks), it might be there.
        // Actually, the browser attempts failed with 500, so likely not there.
        // best to be safe.

        console.log(`Deleted ${result.count} assignments.`);

    } catch (e) {
        console.error("Error cleaning up:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
