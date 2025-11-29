import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Handle Prisma connection errors gracefully
prisma.$connect().catch((error) => {
  console.error('[Prisma] Connection error:', error);
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

