
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAnnouncements() {
    try {
        const announcements = await prisma.announcement.findMany({
            include: {
                course: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        console.log('Found ' + announcements.length + ' announcements:');
        announcements.forEach((a) => {
            console.log(`--------------------------------------------------`);
            console.log(`ID: ${a.id}`);
            console.log(`Title: ${a.title}`);
            console.log(`Date: ${a.createdAt.toISOString()}`);
            console.log(`Type: ${a.type}`);
            console.log(`Course: ${a.course ? a.course.name : 'System/Global'}`);
            console.log(`Target: ${a.targetRole || 'All'}`);
        });
    } catch (error) {
        console.error('Error listing announcements:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listAnnouncements();
