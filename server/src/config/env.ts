import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Resolve .env path relative to this file (src/config/env.ts)
// Navigate up: config -> src -> server -> .env
const envPath = path.resolve(__dirname, '../../.env');

console.log('[ENV] Loading environment from:', envPath);

if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (result.error) {
        console.error('[ENV] Error loading .env:', result.error);
    } else {
        console.log('[ENV] Environment loaded successfully');
        console.log('[ENV] DATABASE_URL available:', !!process.env.DATABASE_URL);
    }
} else {
    console.error('[ENV] .env file not found at:', envPath);
}
