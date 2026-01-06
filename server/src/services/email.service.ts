import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Email credentials not found in env. Email not sent.');
            console.log(`[Email Mock] To: ${to}, Subject: ${subject}`);
            return;
        }

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            html
        });
    } catch (error: any) {
        console.error('Error sending email:', error.message);
        if (error.response) {
            console.error('SMTP Response:', error.response);
        }
    }
};

export const sendGradeNotification = async (to: string, assignmentTitle: string, grade: string, feedback: string) => {
    const subject = `Grade Posted: ${assignmentTitle}`;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Assignment Graded</h2>
            <p>Your assignment <strong>${assignmentTitle}</strong> has been graded.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="font-size: 18px; margin: 0;">Grade: <strong style="color: #059669;">${grade}</strong></p>
                ${feedback ? `<p style="margin-top: 10px;">Feedback: <em>${feedback}</em></p>` : ''}
            </div>

            <p>Log in to the student portal to view full details.</p>
        </div>
    `;
    await sendEmail(to, subject, html);
};

export const sendWelcomeEmail = async (to: string, name: string, username: string, role: string) => {
    const subject = `Welcome to Student Portal - Your Credentials`;
    const defaultPassword = role === 'TUTOR' ? 'Staff123!' : 'Student123!';

    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Welcome to Student Portal</h2>
            <p>Hello <strong>${name}</strong>,</p>
            <p>Your account has been created successfully. Here are your login credentials:</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;">Username: <strong>${username}</strong></p>
                <p style="margin: 5px 0;">Password: <strong>${defaultPassword}</strong></p>
                <p style="margin: 5px 0;">Role: <strong>${role}</strong></p>
            </div>

            <p>Please log in and change your password immediately.</p>
        </div>
    `;
    await sendEmail(to, subject, html);
};

export const sendPasswordResetEmail = async (to: string, name: string) => {
    const subject = `Security Alert: Password Reset`;
    const newPassword = 'Password123!';

    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #d97706;">Password Reset</h2>
            <p>Hello <strong>${name}</strong>,</p>
            <p>Your password has been reset by an administrator.</p>
            
            <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fcd34d;">
                <p style="margin: 0;">New Password: <strong>${newPassword}</strong></p>
            </div>

            <p>Please log in and change this password immediately.</p>
        </div>
    `;
    await sendEmail(to, subject, html);
};
