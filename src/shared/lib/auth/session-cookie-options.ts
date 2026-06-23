import { SESSION_MAX_AGE_SEC } from './session.constants';

/** Options cookie partagées (Edge + Node). */
export function getSessionCookieOptions(maxAge = SESSION_MAX_AGE_SEC) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? '';
  const isLocal =
    !appUrl ||
    appUrl.includes('localhost') ||
    appUrl.includes('127.0.0.1') ||
    appUrl.includes('[::1]');
  const secure =
    !isLocal &&
    (appUrl.startsWith('https://') || process.env.COOKIE_SECURE === 'true');

  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
  };
}
