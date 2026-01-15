import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Safe way to load .env: assume CWD is the project root (server/)
// This works for both `ts-node src/index.ts` and `node dist/src/index.js`
// as long as you run them from 'c:\Users\Nii Boye\Desktop\projects\stdportal\server'

console.log(`[ENV] Current CWD: ${process.cwd()}`);
const envPath = path.resolve(process.cwd(), '.env');
console.log(`[ENV] Loading .env from: ${envPath}`);

if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (result.error) {
        console.error('[ENV] Error loading .env:', result.error);
    } else {
        // console.log('[ENV] Successfully loaded .env');
    }
} else {
    console.error('[ENV] CRITICAL: .env file NOT FOUND at:', envPath);
}
