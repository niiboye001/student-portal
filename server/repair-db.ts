
import path from 'path';
import { execSync } from 'child_process';

const dbPath = path.join(__dirname, 'prisma/dev.db');
const dbUrl = `file:${dbPath}`;

console.log('--- Database Repair Tool ---');
console.log('Target Database:', dbUrl);

process.env.DATABASE_URL = dbUrl;

try {
    console.log('1. Pushing schema...');
    execSync('npx prisma db push --accept-data-loss', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: dbUrl }
    });

    console.log('2. Seeding database...');
    execSync('npx ts-node prisma/seed.ts', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: dbUrl }
    });

    console.log('--- SUCCESS: Database repaired! ---');
} catch (error) {
    console.error('--- FAILED ---');
    console.error('If this failed with EPERM or locking error, THE SERVER IS LOCKING THE FILE.');
    console.error('Please STOP the server (Ctrl+C) and run this script again.');
}
