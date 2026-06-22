import { defineConfig, env } from 'prisma/config';
import { loadProjectEnv } from './prisma/load-env';

loadProjectEnv();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Prisma CLI (migrate, db push) : connexion directe Supabase (port 5432).
    // L'app runtime utilise DATABASE_URL (pooler) via src/shared/lib/prisma.ts.
    url: env('DIRECT_URL'),
  },
});
