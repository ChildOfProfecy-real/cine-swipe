import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'premium@cineswipe.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: { password: hashedPassword },
        create: {
            email,
            password: hashedPassword,
            name: 'Premium User',
            isAdmin: false
        }
    });

    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

    await prisma.subscription.upsert({
        where: { userId: user.id },
        update: { status: 'ACTIVE', currentPeriodEnd },
        create: { userId: user.id, status: 'ACTIVE', currentPeriodEnd }
    });

    console.log('Created Premium User:');
    console.log('Email: ' + email);
    console.log('Password: ' + password);
}

main().catch(console.error).finally(() => prisma.$disconnect());
