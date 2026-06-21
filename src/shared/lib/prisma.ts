import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL est requis pour se connecter à PostgreSQL.');
  }

  const isProd = process.env.NODE_ENV === 'production';
  const pool = globalForPrisma.pgPool ?? new Pool({
      connectionString,
      max: Number(process.env.DATABASE_POOL_MAX ?? (isProd ? 50 : 10)),
      min: Number(process.env.DATABASE_POOL_MIN ?? (isProd ? 2 : 1)),
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: isProd ? 10_000 : 5_000,
    });

  globalForPrisma.pgPool = pool;

  pool.on('error', (err) => {
    console.error('[pg pool] erreur connexion idle:', err.message);
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log:
      process.env.PRISMA_LOG_QUERIES === 'true'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
