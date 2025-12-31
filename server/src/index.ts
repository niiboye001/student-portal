import 'dotenv/config'; // Must be first
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import adminRoutes from './routes/admin.routes';
import prisma from './utils/prisma';
import { rateLimit } from 'express-rate-limit';

// dotenv.config() removed as import handles it

const app = express();
const PORT = process.env.PORT || 5001;

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// Debug logging BEFORE anything else
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.path}`);
    if (req.method === 'POST') console.log('[BODY]', JSON.stringify(req.body));
    next();
});

// Middleware (Temporarily disabled security blocks for debugging)
// app.use(helmet());
// app.use(limiter);
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'], // Frontend URLs
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start Server
app.listen(Number(PORT), '127.0.0.1', () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});

// Handle Shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
