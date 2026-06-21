import { config } from 'dotenv';

config({ path: '.env.local' });
config();

async function main() {
  const { checkDatabaseHealth } = await import('../src/shared/lib/db/health');
  const { checkEnvHealth } = await import('../src/shared/lib/db/env-health');

  const env = checkEnvHealth();
  console.log('── Configuration ──');
  console.log(env.ok ? '✓ Variables OK' : `✗ Manquant: ${env.missing.join(', ')}`);

  if (!env.databaseUrl) {
    process.exit(1);
  }

  console.log('── PostgreSQL ──');
  const db = await checkDatabaseHealth();
  if (db.ok) {
    console.log(`✓ Connecté (${db.latencyMs} ms)`);
    process.exit(env.ok ? 0 : 1);
  }

  console.error(`✗ ${db.error ?? 'Connexion impossible'}`);
  console.error('\nAide:');
  console.error('  docker compose up -d');
  console.error('  npm run db:setup');
  process.exit(1);
}

main();
