import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env from current directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log('Loading .env from:', path.resolve(__dirname, '../../.env'));
console.log('EMAIL_USER:', process.env.EMAIL_USER);
// Mask pass for log
console.log('EMAIL_PASS present:', !!process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Nodemailer handles spaces usually
    }
});

async function test() {
    try {
        console.log(`Sending from ${process.env.EMAIL_USER}...`);
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to self
            subject: 'Test Email - App Password',
            html: '<p>If you see this, the App Password is working!</p>'
        });
        console.log('Success! Email sent.');
    } catch (error: any) {
        console.error('Error:', error.message);
        if (error.response) console.error('Response:', error.response);
    }
}

test();
