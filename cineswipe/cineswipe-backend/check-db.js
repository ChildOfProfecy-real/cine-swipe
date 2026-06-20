const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.clip.findMany({ take: 2 }).then(console.log).finally(() => prisma.$disconnect());
