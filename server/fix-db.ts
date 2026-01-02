
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const targetDbPath = path.join(__dirname, 'prisma/dev.db');
const dbUrl = `file:${targetDbPath.replace(/\\/g, '/')}`; // Ensure forward slashes for Prisma URL

console.log('--- FINAL DB FIX ---');
console.log('Targeting DB File:', targetDbPath);

// 1. Force update .env to point to this absolute path
const envPath = path.join(__dirname, '.env');
const envContent = `DATABASE_URL="${dbUrl}"
PORT=5001
JWT_SECRET=supersecretkey123
JWT_REFRESH_SECRET=anothersecretkey456
`;
fs.writeFileSync(envPath, envContent);
console.log('Updated .env with absolute path.');

// 2. Run Push
try {
    console.log('Running prisma db push...');
    // We don't need to pass env here because we wrote it to the .env file which prisma reads automatically
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: __dirname });
} catch (e) {
    console.error('Push failed. Is the server running?');
    process.exit(1);
}

// 3. Run Seed
try {
    console.log('Running seed...');
    execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit', cwd: __dirname });
} catch (e) {
    console.error('Seed failed.');
}

console.log('--- DONE ---');
