import { PrismaClient } from '@prisma/client';
import '../config/env'; // Ensure env is loaded before Client init

console.log('[PRISMA] Initializing client. DATABASE_URL present:', !!process.env.DATABASE_URL);

import path from 'path';

// Hardcode the CORRECT path to the populated DB
const dbPath = path.join(__dirname, '../../prisma/dev.db');
const dbUrl = `file:${dbPath}`;

console.log('[PRISMA] Forcing Connection URL:', dbUrl);

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: dbUrl
        }
    }
});

export default prisma;
