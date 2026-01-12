import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { logAudit } from '../services/audit.service';
import { generateUserId } from '../utils/id.utils';
import { AuthRequest } from '../middleware/auth.middleware';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['STUDENT', 'ADMIN']).optional()
});

const loginSchema = z.object({
    userId: z.string().min(1),
    password: z.string().min(1)
});

const forgotPasswordSchema = z.object({
    email: z.string().email()
});

const resetPasswordSchema = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(6)
});

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name, role } = registerSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Generate Username
        const generatedRole = role || 'STUDENT';
        const username = await generateUserId(generatedRole === 'ADMIN' ? 'STAFF' : 'STUDENT'); // Admin gets STAFF prefix or we can adjust logic

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                name,
                role: generatedRole
            }
        });

        res.status(201).json({ message: 'User created successfully', userId: user.id });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Registration failed' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { userId, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { username: userId } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '15m' } // Shorter access token
        );

        // Generate Refresh Token
        const refreshToken = jwt.sign(
            { userId: user.id, jti: Date.now().toString() + Math.random() },
            process.env.REFRESH_TOKEN_SECRET || 'refresh_secret',
            { expiresIn: '7d' }
        );

        // Store refresh token in database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt
            }
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000, // 15 mins
            path: '/'
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        });

        // Log Audit
        await logAudit(user.id, 'LOGIN', 'AUTH', { method: 'username' }, req.ip);

        res.json({
            message: 'Login successful',
            user: { id: user.id, name: user.name, email: user.email, role: user.role, username: user.username }
        });
    } catch (error: any) {
        console.error('CRITICAL LOGIN ERROR:', error);
        if (error.code) console.error('Error Code:', error.code);
        if (error.meta) console.error('Error Meta:', error.meta);
        res.status(500).json({ message: 'Login failed: ' + (error.message || 'Unknown error') });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await prisma.refreshToken.updateMany({
                where: { token: refreshToken },
                data: { revoked: true }
            });
        }
        res.clearCookie('token', { path: '/' });
        res.clearCookie('refreshToken', { path: '/' });

        // Cannot easily log user ID here if not in request, but typically handled by auth middleware
        // For now, simple response.
        res.json({ message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({ message: 'Logout failed' });
    }
};

export const refresh = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token missing' });
        }

        const storedToken = await prisma.refreshToken.findFirst({
            where: {
                token: refreshToken,
                revoked: false,
                expiresAt: { gt: new Date() }
            },
            include: { user: true }
        });

        if (!storedToken) {
            return res.status(403).json({ message: 'Invalid or expired refresh token' });
        }

        try {
            // Verify JWT synchronously
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'refresh_secret');

            // Implement rotation: Revoke old, issue new
            await prisma.refreshToken.update({
                where: { id: storedToken.id },
                data: { revoked: true }
            });

            const user = storedToken.user;
            const newToken = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '15m' }
            );

            const newRefreshToken = jwt.sign(
                { userId: user.id, jti: Date.now().toString() + Math.random() },
                process.env.REFRESH_TOKEN_SECRET || 'refresh_secret',
                { expiresIn: '7d' }
            );

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            await prisma.refreshToken.create({
                data: {
                    token: newRefreshToken,
                    userId: user.id,
                    expiresAt
                }
            });

            res.cookie('token', newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000,
                path: '/'
            });

            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/'
            });

            res.json({ message: 'Token refreshed' });
        } catch (err: any) {
            console.error('JWT Refresh error:', err.message);
            return res.status(403).json({ message: 'Invalid refresh token' });
        }
    } catch (error: any) {
        console.error('Refresh logic error:', error);
        res.status(500).json({ message: 'Refresh failed: ' + (error.message || 'Unknown error') });
    }
};

export const me = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { id: true, name: true, email: true, role: true }
        });

        if (!user) return res.status(401).json({ message: 'User not found' });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user data' });
    }
};

// Forgot Password Flow
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Check for security, don't reveal if user exists
            return res.json({ message: 'If an account exists, a reset email has been sent.' });
        }

        // Generate a random token (in prod use crypto.randomBytes)
        // For simplicity using a short-lived dedicated JWT or just a random string
        // Let's use a random string from bcrypt salt for uniqueness + timestamp
        const resetToken = await bcrypt.hash(email + Date.now(), 5);
        // Clean up token for URL safety
        const safeToken = Buffer.from(resetToken).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

        const expiry = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: safeToken,
                resetTokenExpiry: expiry
            }
        });

        // Mock sending email
        // console.log(`[EMAIL MOCK] Password Reset Link for ${email}: http://localhost:5173/reset-password?token=${safeToken}`);

        res.json({ message: 'If an account exists, a reset email has been sent.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error processing request' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = resetPasswordSchema.parse(req.body);

        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date()
                }
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error resetting password' });
    }
};
