import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { getSafeRedirect } from '@/shared/lib/auth-redirect';

export type OAuthState = {
  redirect: string;
  exp: number;
  nonce: string;
};

function getOAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('AUTH_SECRET requis pour OAuth');
  }
  return secret;
}

function signPayload(payload: string): string {
  return createHmac('sha256', getOAuthSecret()).update(payload).digest('base64url');
}

export function createOAuthState(redirect?: string | null, fallback = '/commande'): string {
  const data: OAuthState = {
    redirect: getSafeRedirect(redirect, fallback),
    exp: Math.floor(Date.now() / 1000) + 600,
    nonce: randomBytes(16).toString('hex'),
  };
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `${payload}.${signPayload(payload)}`;
}

export function verifyOAuthState(state: string, fallback = '/commande'): OAuthState | null {
  try {
    const [payload, signature] = state.split('.');
    if (!payload || !signature) return null;

    const expected = signPayload(payload);
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as OAuthState;
    if (!data.nonce || data.exp < Math.floor(Date.now() / 1000)) return null;

    return {
      ...data,
      redirect: getSafeRedirect(data.redirect, fallback),
    };
  } catch {
    return null;
  }
}
