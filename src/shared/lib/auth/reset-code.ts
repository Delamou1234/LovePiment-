import { createHash, randomInt } from 'crypto';

export function generateResetCode(): string {
  return String(randomInt(10_000_000, 100_000_000));
}

export function hashResetCode(code: string): string {
  return createHash('sha256').update(code.trim()).digest('hex');
}

export function isValidResetCodeFormat(code: string): boolean {
  return /^\d{8}$/.test(code.trim());
}
