import { NextRequest, NextResponse } from 'next/server';
import { getClientIp } from '@/shared/lib/security/client-ip';
import { checkRateLimit } from '@/shared/lib/security/rate-limit';

export const RATE_LIMITS = {
  authLogin: { limit: 12, windowMs: 15 * 60_000 },
  authRegister: { limit: 8, windowMs: 60 * 60_000 },
  authForgotPassword: { limit: 6, windowMs: 60 * 60_000 },
  authResetCode: { limit: 15, windowMs: 15 * 60_000 },
  checkout: { limit: 25, windowMs: 60 * 60_000 },
  contact: { limit: 8, windowMs: 60 * 60_000 },
  newsletter: { limit: 6, windowMs: 60 * 60_000 },
  imageSearch: { limit: 40, windowMs: 60 * 60_000 },
  iaAssistant: { limit: 30, windowMs: 60 * 60_000 },
  webhook: { limit: 120, windowMs: 60_000 },
} as const;

/**
 * Retourne une réponse 429 si la limite est dépassée, sinon null.
 */
export function enforceRateLimit(
  request: NextRequest,
  scope: keyof typeof RATE_LIMITS,
  suffix = '',
): NextResponse | null {
  const { limit, windowMs } = RATE_LIMITS[scope];
  const ip = getClientIp(request);
  const key = `${scope}:${ip}${suffix ? `:${suffix}` : ''}`;
  const result = checkRateLimit(key, limit, windowMs);

  if (result.ok) return null;

  return NextResponse.json(
    { message: 'Trop de requêtes. Patientez quelques instants avant de réessayer.' },
    {
      status: 429,
      headers: result.retryAfterSec
        ? { 'Retry-After': String(result.retryAfterSec) }
        : undefined,
    },
  );
}
