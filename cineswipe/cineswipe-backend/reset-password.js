const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const newPasswordHash = await bcrypt.hash('test123', 10);
    
    // Check if test user exists
    const testUser = await prisma.user.findUnique({
        where: { email: 'test@cineswipe.com' }
    });

    if (testUser) {
        await prisma.user.update({
            where: { email: 'test@cineswipe.com' },
            data: { password: newPasswordHash }
        });
        console.log('Password for test@cineswipe.com has been forcefully reset to "test123"');
    } else {
        console.log('test@cineswipe.com does not exist in the database!');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
