import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  ALL_SESSION_COOKIES,
  COURIER_SESSION_COOKIE,
  CUSTOMER_SESSION_COOKIE,
  LEGACY_SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  SESSION_REFRESH_THRESHOLD_SEC,
} from './session.constants';
import { getSessionCookieOptions } from './session-cookie-options';
import type { SessionPayload, SessionRole, SessionUser } from './session-types';

export type { SessionRole, SessionUser } from './session-types';
export {
  ADMIN_SESSION_COOKIE,
  COURIER_SESSION_COOKIE,
  CUSTOMER_SESSION_COOKIE,
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
} from './session.constants';
export { shouldRefreshSession } from './session-edge';

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

function decodePayload(payload: string): SessionPayload | null {
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as SessionPayload;
  } catch {
    return null;
  }
}

export function createSessionToken(user: SessionUser): string {
  const secret = getAuthSecret();
  const data: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC,
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

    const data = decodePayload(payload);
    if (!data?.email || (data.role !== 'admin' && data.role !== 'customer' && data.role !== 'courier')) return null;
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

function readToken(
  getter: (name: string) => string | undefined,
  role: SessionRole,
): string | undefined {
  const dedicated =
    role === 'customer'
      ? CUSTOMER_SESSION_COOKIE
      : role === 'admin'
        ? ADMIN_SESSION_COOKIE
        : COURIER_SESSION_COOKIE;
  const dedicatedToken = getter(dedicated);
  if (dedicatedToken) return dedicatedToken;

  const legacy = getter(LEGACY_SESSION_COOKIE);
  if (!legacy) return undefined;

  const user = verifySessionToken(legacy);
  if (user?.role === role) return legacy;
  return undefined;
}

function verifyRoleToken(token: string | undefined, role: SessionRole): SessionUser | null {
  if (!token) return null;
  const user = verifySessionToken(token);
  return user?.role === role ? user : null;
}

export type SessionResolveResult = {
  user: SessionUser | null;
  refreshedToken?: string;
};

function resolveRoleSession(token: string | undefined, role: SessionRole): SessionResolveResult {
  const user = verifyRoleToken(token, role);
  if (!user) return { user: null };

  const [payloadPart] = token!.split('.');
  const payload = decodePayload(payloadPart);
  if (payload && payload.exp - Math.floor(Date.now() / 1000) < SESSION_REFRESH_THRESHOLD_SEC) {
    return { user, refreshedToken: createSessionToken(user) };
  }
  return { user };
}

export function getSessionFromRequest(request: NextRequest): SessionUser | null {
  const getter = (name: string) => request.cookies.get(name)?.value;
  return (
    verifyRoleToken(getter(CUSTOMER_SESSION_COOKIE), 'customer') ??
    verifyRoleToken(getter(ADMIN_SESSION_COOKIE), 'admin') ??
    verifySessionToken(getter(LEGACY_SESSION_COOKIE) ?? '')
  );
}

export function getCustomerSessionFromRequest(request: NextRequest): SessionUser | null {
  const getter = (name: string) => request.cookies.get(name)?.value;
  return verifyRoleToken(readToken(getter, 'customer'), 'customer');
}

export function getAdminSessionFromRequest(request: NextRequest): SessionUser | null {
  const getter = (name: string) => request.cookies.get(name)?.value;
  return verifyRoleToken(readToken(getter, 'admin'), 'admin');
}

export function getCourierSessionFromRequest(request: NextRequest): SessionUser | null {
  const getter = (name: string) => request.cookies.get(name)?.value;
  return verifyRoleToken(readToken(getter, 'courier'), 'courier');
}

export async function getCourierSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const getter = (name: string) => cookieStore.get(name)?.value;
  return resolveRoleSession(readToken(getter, 'courier'), 'courier').user;
}

export async function getCustomerSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const getter = (name: string) => cookieStore.get(name)?.value;
  return resolveRoleSession(readToken(getter, 'customer'), 'customer').user;
}

export async function getAdminSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const getter = (name: string) => cookieStore.get(name)?.value;
  return resolveRoleSession(readToken(getter, 'admin'), 'admin').user;
}

/** Première session valide trouvée (client prioritaire). */
export async function getSession(): Promise<SessionUser | null> {
  const customer = await getCustomerSession();
  if (customer) return customer;
  return getAdminSession();
}

export async function getCustomerSessionWithRefresh(): Promise<
  SessionResolveResult & { role: 'customer' }
> {
  const cookieStore = await cookies();
  const getter = (name: string) => cookieStore.get(name)?.value;
  const resolved = resolveRoleSession(readToken(getter, 'customer'), 'customer');
  return { ...resolved, role: 'customer' };
}

export function setSessionCookie(response: NextResponse, token: string, role: SessionRole) {
  const name =
    role === 'admin'
      ? ADMIN_SESSION_COOKIE
      : role === 'courier'
        ? COURIER_SESSION_COOKIE
        : CUSTOMER_SESSION_COOKIE;
  response.cookies.set(name, token, getSessionCookieOptions());
  response.cookies.set(LEGACY_SESSION_COOKIE, '', { ...getSessionCookieOptions(0), maxAge: 0 });
}

export function clearSessionCookie(response: NextResponse, role?: SessionRole | 'all') {
  const names =
    role === 'all' || role === undefined
      ? [...ALL_SESSION_COOKIES]
      : role === 'admin'
        ? [ADMIN_SESSION_COOKIE, LEGACY_SESSION_COOKIE]
        : role === 'courier'
          ? [COURIER_SESSION_COOKIE, LEGACY_SESSION_COOKIE]
          : [CUSTOMER_SESSION_COOKIE, LEGACY_SESSION_COOKIE];

  for (const name of names) {
    response.cookies.set(name, '', { ...getSessionCookieOptions(0), maxAge: 0 });
  }
}

export function applySessionCookieUpdates(
  response: NextResponse,
  updates: {
    cookiesToClear?: string[];
    cookiesToSet?: { name: string; token: string; role: SessionRole }[];
  },
) {
  for (const name of updates.cookiesToClear ?? []) {
    response.cookies.set(name, '', { ...getSessionCookieOptions(0), maxAge: 0 });
  }
  for (const item of updates.cookiesToSet ?? []) {
    setSessionCookie(response, item.token, item.role);
  }
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
