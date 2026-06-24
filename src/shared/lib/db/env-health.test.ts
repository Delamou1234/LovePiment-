import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { checkEnvHealth } from './env-health';

describe('checkEnvHealth', () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env = { ...original };
  });

  afterEach(() => {
    process.env = original;
  });

  it('signale les variables manquantes', () => {
    delete process.env.DATABASE_URL;
    delete process.env.AUTH_SECRET;

    const health = checkEnvHealth();
    expect(health.ok).toBe(false);
    expect(health.databaseUrl).toBe(false);
    expect(health.missing.length).toBeGreaterThan(0);
  });

  it('valide une config minimale', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.AUTH_SECRET = 'secret-de-test-16-chars';

    const health = checkEnvHealth();
    expect(health.ok).toBe(true);
    expect(health.databaseUrl).toBe(true);
    expect(health.authSecret).toBe(true);
  });
});
