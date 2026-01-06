
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAnnouncements() {
    try {
        const idsToDelete = [
            '7ea8b236-41b7-4a5e-aa48-fc9823356bc1', // Late meeting
            'ce5e190c-7810-4847-a48d-1ad836c992c7'  // change of venue
        ];

        const result = await prisma.announcement.deleteMany({
            where: {
                id: {
                    in: idsToDelete
                }
            }
        });

        console.log(`Deleted ${result.count} announcements.`);
    } catch (error) {
        console.error('Error deleting announcements:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteAnnouncements();
