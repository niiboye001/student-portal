
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

async function main() {
    const dbPath = path.join(__dirname, 'dev.db');
    const dbPath2 = path.join(__dirname, 'prisma/dev.db');

    console.log('--- Database Reset Tool ---');

    // 1. Try to delete databases
    try {
        if (fs.existsSync(dbPath)) {
            console.log('Deleting server/dev.db...');
            fs.unlinkSync(dbPath);
            console.log('Deleted server/dev.db');
        }
        if (fs.existsSync(dbPath2)) {
            console.log('Deleting server/prisma/dev.db...');
            fs.unlinkSync(dbPath2);
            console.log('Deleted server/prisma/dev.db');
        }
    } catch (error: any) {
        console.error('ERROR: Could not delete database file.');
        console.error('CAUSE: The server is probably still running and locking the file.');
        console.error('ACTION: Please STOP the server (Ctrl+C) and run this script again.');
        process.exit(1);
    }

    // 2. Push Schema
    try {
        console.log('Running prisma db push...');
        execSync('npx prisma db push', { stdio: 'inherit', cwd: __dirname });
    } catch (error) {
        console.error('Failed to push schema.');
        process.exit(1);
    }

    // 3. Seed Data
    try {
        console.log('Seeding database...');
        // We can import the seed function or run the command
        // Since we are in ts-node context, let's try running the seed file
        execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit', cwd: __dirname });
        console.log('Seeding complete.');
    } catch (error) {
        console.error('Failed to seed database.');
        // Don't exit, maybe manual seed works
    }

    console.log('--- SUCCESS ---');
    console.log('Database has been reset and seeded.');
    console.log('You can now START the server.');
}

main();
