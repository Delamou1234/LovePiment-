import { prisma } from '@/shared/lib/prisma';

export type DbHealthStatus = {
  ok: boolean;
  latencyMs: number;
  error?: string;
};

export async function checkDatabaseHealth(): Promise<DbHealthStatus> {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - started };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : 'Erreur base de données',
    };
  }
}
