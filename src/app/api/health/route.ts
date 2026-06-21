import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/shared/lib/db/health';
import { checkEnvHealth } from '@/shared/lib/db/env-health';

export const dynamic = 'force-dynamic';

/** GET /api/health — état du backend (DB, config). */
export async function GET() {
  const env = checkEnvHealth();
  const db = env.databaseUrl ? await checkDatabaseHealth() : { ok: false, latencyMs: 0, error: 'DATABASE_URL manquant' };

  const ok = env.ok && db.ok;
  const status = ok ? 200 : 503;

  return NextResponse.json(
    {
      ok,
      timestamp: new Date().toISOString(),
      env,
      db,
      hints: !ok
        ? [
            !env.databaseUrl && 'Définissez DATABASE_URL dans .env.local',
            !env.authSecret && 'Définissez AUTH_SECRET (16+ caractères) dans .env.local',
            env.databaseUrl && !db.ok && 'PostgreSQL injoignable — lancez: docker compose up -d',
            env.databaseUrl && !db.ok && 'Puis: npm run db:setup',
          ].filter(Boolean)
        : undefined,
    },
    { status },
  );
}
