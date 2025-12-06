const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Running pre-deployment health check...');
    try {
        // 1. Check Database Connection
        await prisma.$connect();
        console.log('✅ Database connection successful');

        // 2. Simple Query Check
        await prisma.$queryRaw`SELECT 1`;
        console.log('✅ Database query successful');

        process.exit(0);
    } catch (error) {
        console.error('❌ Health check failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
