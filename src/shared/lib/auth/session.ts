import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { NextResponse } from 'next/server';
import { SESSION_COOKIE } from './session.constants';

export { SESSION_COOKIE };
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

export type SessionRole = 'admin' | 'customer';

export type SessionUser = {
  id?: string;
  email: string;
  name: string;
  role: SessionRole;
};

type SessionPayload = SessionUser & { exp: number };

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'AUTH_SECRET manquant ou trop court. Ajoutez AUTH_SECRET (min. 16 caractères) dans .env.local',
    );
  }
  return secret;
}

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSessionToken(user: SessionUser): string {
  const secret = getAuthSecret();
  const data: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SEC,
  };
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `${payload}.${signPayload(payload, secret)}`;
}

export function verifySessionToken(token: string, secret?: string): SessionUser | null {
  try {
    const key = secret ?? getAuthSecret();
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expected = signPayload(payload, key);
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as SessionPayload;
    if (!data.email || (data.role !== 'admin' && data.role !== 'customer')) return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;

    return {
      id: data.id,
      email: data.email,
      name: data.name || data.email.split('@')[0],
      role: data.role,
    };
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: NextRequest): SessionUser | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function getCustomerSession(): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.role === 'customer' ? session : null;
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE_SEC,
    path: '/',
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export function getAdminCredentials() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16);
}
