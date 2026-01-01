import './config/env';
import app from './app';
import prisma from './utils/prisma';

const PORT = process.env.PORT || 5001;

// Start Server
app.listen(Number(PORT), '127.0.0.1', () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});

// Handle Shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
