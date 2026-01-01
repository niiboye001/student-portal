import { PrismaClient } from '@prisma/client';
import '../config/env'; // Ensure env is loaded before Client init

console.log('[PRISMA] Initializing client. DATABASE_URL present:', !!process.env.DATABASE_URL);

// Explicitly pass the URL to avoid schema.prisma env resolution timing issues
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || "file:../dev.db"
        }
    }
});

export default prisma;
