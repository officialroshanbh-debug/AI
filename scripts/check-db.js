import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        console.log('DB OK');
        process.exit(0);
    } catch (err) {
        console.error('DB connection problem:', err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
})();
