import { config } from 'dotenv';

/** Charge .env.local puis .env (même ordre que Next.js). */
export function loadProjectEnv(): void {
  config({ path: '.env.local' });
  config();
}

/** Affiche l'hôte DB sans exposer le mot de passe. */
export function describeDatabaseUrl(url?: string): string {
  if (!url?.trim()) return '(non défini)';
  try {
    const parsed = new URL(url.replace(/^postgresql:/, 'http:'));
    const db = parsed.pathname.replace(/^\//, '') || 'postgres';
    return `${parsed.hostname}:${parsed.port || '5432'}/${db}`;
  } catch {
    return '(URL invalide)';
  }
}
