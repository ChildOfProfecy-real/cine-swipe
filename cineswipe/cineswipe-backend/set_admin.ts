import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.update({
        where: { email: 'admin@cineswipe.com' },
        data: { isAdmin: true },
    });
    console.log(`✅ Updated: ${user.email} → isAdmin: ${user.isAdmin}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
