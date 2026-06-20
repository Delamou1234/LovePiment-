import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: any };

const isMock = process.env.MOCK_DATABASE === 'true';

export const prisma = isMock
  ? (null as unknown as PrismaClient)
  : (globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      }));

if (!isMock && process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
