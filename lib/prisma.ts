import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configure Prisma for serverless environments
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Handle connection errors gracefully
prisma.$on('error' as never, (e: Error) => {
  console.error('[Prisma] Database error:', {
    message: e.message,
    name: e.name,
    stack: e.stack,
  });
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

