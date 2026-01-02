import prisma from './prisma';

export const generateUserId = async (role: string): Promise<string> => {
    const prefix = role === 'STUDENT' ? 'STD' : 'STF';
    let uniqueId = '';
    let isUnique = false;

    while (!isUnique) {
        // Generate random 5 digits
        const randomDigits = Math.floor(10000 + Math.random() * 90000).toString();
        uniqueId = `${prefix}-${randomDigits}`;

        // Check availability
        const existing = await prisma.user.findFirst({
            where: { username: uniqueId }
        });

        if (!existing) {
            isUnique = true;
        }
    }

    return uniqueId;
};
