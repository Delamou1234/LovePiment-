import { config } from 'dotenv';

config({ path: '.env.local' });
config();

async function main() {
  const { describeDatabaseUrl } = await import('../prisma/load-env');
  const { checkDatabaseHealth } = await import('../src/shared/lib/db/health');
  const { checkEnvHealth } = await import('../src/shared/lib/db/env-health');

  const env = checkEnvHealth();
  console.log('── Configuration ──');
  console.log(env.ok ? '✓ Variables OK' : `✗ Manquant: ${env.missing.join(', ')}`);
  console.log(`  DATABASE_URL → ${describeDatabaseUrl(process.env.DATABASE_URL)}`);
  console.log(`  DIRECT_URL   → ${describeDatabaseUrl(process.env.DIRECT_URL)}`);

  if (!env.databaseUrl) {
    process.exit(1);
  }

  console.log('── PostgreSQL (via DATABASE_URL) ──');
  const db = await checkDatabaseHealth();
  if (db.ok) {
    console.log(`✓ Connecté (${db.latencyMs} ms)`);
    process.exit(env.ok ? 0 : 1);
  }

  console.error(`✗ ${db.error ?? 'Connexion impossible'}`);
  console.error('\nAide:');
  console.error('  npm run db:push   # crée les tables sur la DB ci-dessus');
  console.error('  npm run db:seed   # charge produits + admin');
  process.exit(1);
}

main();
