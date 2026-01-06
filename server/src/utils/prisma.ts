import { PrismaClient } from '@prisma/client';
import '../config/env'; // Ensure env is loaded before Client init



import path from 'path';


// Hardcode the CORRECT path to the populated DB
const dbPath = path.join(__dirname, '../../prisma/dev.db');
const dbUrl = `file:${dbPath}`;

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: dbUrl
        }
    }
});

export default prisma;
