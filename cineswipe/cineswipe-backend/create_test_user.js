const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const testPassword = await bcrypt.hash('test123', 10);

    const user = await prisma.user.upsert({
        where: { email: 'test@cineswipe.com' },
        update: { password: testPassword }, // Reset password if already exists somehow
        create: {
            email: 'test@cineswipe.com',
            password: testPassword,
            name: 'Test Setup',
            isAdmin: false,
        }
    });

    console.log("Upserted user: ", user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
