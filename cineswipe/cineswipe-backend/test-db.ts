import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing Prisma connection...');
    try {
        await prisma.$connect();
        console.log('Connected to the database successfully!');
        
        // Test a simple query
        const users = await prisma.user.count();
        console.log(`Found ${users} users.`);
    } catch(e) {
        console.error('Failed to connect to the database:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
