import { isAuthConfigured } from '@/shared/lib/auth/session';

export type EnvHealthStatus = {
  ok: boolean;
  databaseUrl: boolean;
  authSecret: boolean;
  missing: string[];
};

export function checkEnvHealth(): EnvHealthStatus {
  const missing: string[] = [];

  if (!process.env.DATABASE_URL?.trim()) {
    missing.push('DATABASE_URL');
  }

  if (!isAuthConfigured()) {
    missing.push('AUTH_SECRET (min. 16 caractères)');
  }

  return {
    ok: missing.length === 0,
    databaseUrl: Boolean(process.env.DATABASE_URL?.trim()),
    authSecret: isAuthConfigured(),
    missing,
  };
}
