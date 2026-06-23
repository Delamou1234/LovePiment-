import {
  ADMIN_SESSION_COOKIE,
  COURIER_SESSION_COOKIE,
  CUSTOMER_SESSION_COOKIE,
  LEGACY_SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  SESSION_REFRESH_THRESHOLD_SEC,
} from './session.constants';
import type { SessionPayload, SessionRole, SessionUser } from './session-types';

function getAuthSecret(): string | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) return null;
  return secret;
}

function base64UrlToBytes(b64: string): Uint8Array {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodePayload(data: SessionPayload): string {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(data)));
}

function decodePayload(payload: string): SessionPayload | null {
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(payload));
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return bytesToBase64Url(new Uint8Array(sig));
}

async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const signatureBytes = base64UrlToBytes(signature);
  return crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes.buffer.slice(
      signatureBytes.byteOffset,
      signatureBytes.byteOffset + signatureBytes.byteLength,
    ),
    new TextEncoder().encode(payload),
  );
}

export function shouldRefreshSession(exp: number, nowSec = Math.floor(Date.now() / 1000)): boolean {
  return exp - nowSec < SESSION_REFRESH_THRESHOLD_SEC;
}

export async function verifySessionTokenEdge(
  token: string,
  secret?: string,
): Promise<(SessionUser & { exp: number }) | null> {
  const key = secret ?? getAuthSecret();
  if (!key) return null;

  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;
    if (!(await verifySignature(payload, signature, key))) return null;

    const data = decodePayload(payload);
    if (!data?.email || (data.role !== 'admin' && data.role !== 'customer' && data.role !== 'courier')) return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;

    return {
      id: data.id,
      email: data.email,
      name: data.name || data.email.split('@')[0],
      role: data.role,
      exp: data.exp,
    };
  } catch {
    return null;
  }
}

export async function createSessionTokenEdge(
  user: SessionUser,
  secret?: string,
): Promise<string | null> {
  const key = secret ?? getAuthSecret();
  if (!key) return null;

  const data: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC,
  };
  const payload = encodePayload(data);
  const signature = await signPayload(payload, key);
  return `${payload}.${signature}`;
}

export async function refreshSessionTokenEdge(
  user: SessionUser,
  secret?: string,
): Promise<string | null> {
  return createSessionTokenEdge(user, secret);
}

export type EdgeSessionSnapshot = {
  customer: SessionUser | null;
  admin: SessionUser | null;
  courier: SessionUser | null;
  cookiesToClear: string[];
  cookiesToSet: { name: string; token: string; role: SessionRole }[];
  hadInvalidCookie: boolean;
};

function cookieNameForRole(role: SessionRole): string {
  if (role === 'admin') return ADMIN_SESSION_COOKIE;
  if (role === 'courier') return COURIER_SESSION_COOKIE;
  return CUSTOMER_SESSION_COOKIE;
}

async function resolveRoleToken(
  token: string | undefined,
  expectedRole: SessionRole,
  sourceCookie: string,
): Promise<{
  user: SessionUser | null;
  invalid: boolean;
  set?: { name: string; token: string; role: SessionRole };
  clearLegacy?: boolean;
}> {
  if (!token) return { user: null, invalid: false };

  const verified = await verifySessionTokenEdge(token);
  if (!verified) return { user: null, invalid: true };

  const { exp, ...user } = verified;
  if (user.role !== expectedRole) return { user: null, invalid: true };

  const targetName = cookieNameForRole(expectedRole);
  const needsNewToken =
    shouldRefreshSession(exp) || sourceCookie === LEGACY_SESSION_COOKIE;

  if (needsNewToken) {
    const newToken = await refreshSessionTokenEdge(user);
    if (newToken) {
      return {
        user,
        invalid: false,
        set: { name: targetName, token: newToken, role: expectedRole },
        clearLegacy: sourceCookie === LEGACY_SESSION_COOKIE,
      };
    }
  }

  return { user, invalid: false };
}

/** Analyse tous les cookies de session d'une requête (Edge). */
export async function resolveEdgeSessions(
  cookieGetter: (name: string) => string | undefined,
): Promise<EdgeSessionSnapshot> {
  const cookiesToClear: string[] = [];
  const cookiesToSet: { name: string; token: string; role: SessionRole }[] = [];
  let hadInvalidCookie = false;

  const legacy = cookieGetter(LEGACY_SESSION_COOKIE);
  const customerDedicated = cookieGetter(CUSTOMER_SESSION_COOKIE);
  const adminDedicated = cookieGetter(ADMIN_SESSION_COOKIE);
  const courierDedicated = cookieGetter(COURIER_SESSION_COOKIE);

  if (customerDedicated) {
    const res = await resolveRoleToken(customerDedicated, 'customer', CUSTOMER_SESSION_COOKIE);
    if (res.invalid) {
      hadInvalidCookie = true;
      cookiesToClear.push(CUSTOMER_SESSION_COOKIE);
    } else if (res.set) cookiesToSet.push(res.set);

    if (adminDedicated) {
      const adminRes = await resolveRoleToken(adminDedicated, 'admin', ADMIN_SESSION_COOKIE);
      if (adminRes.invalid) {
        hadInvalidCookie = true;
        cookiesToClear.push(ADMIN_SESSION_COOKIE);
      } else if (adminRes.set) cookiesToSet.push(adminRes.set);

      return {
        customer: res.user,
        admin: adminRes.user,
        courier: null,
        cookiesToClear: [...new Set(cookiesToClear)],
        cookiesToSet,
        hadInvalidCookie,
      };
    }

    if (legacy) cookiesToClear.push(LEGACY_SESSION_COOKIE);

    return {
      customer: res.user,
      admin: null,
      courier: null,
      cookiesToClear: [...new Set(cookiesToClear)],
      cookiesToSet,
      hadInvalidCookie,
    };
  }

  if (courierDedicated) {
    const courierRes = await resolveRoleToken(courierDedicated, 'courier', COURIER_SESSION_COOKIE);
    if (courierRes.invalid) {
      hadInvalidCookie = true;
      cookiesToClear.push(COURIER_SESSION_COOKIE);
    } else if (courierRes.set) cookiesToSet.push(courierRes.set);

    return {
      customer: null,
      admin: null,
      courier: courierRes.user,
      cookiesToClear: [...new Set(cookiesToClear)],
      cookiesToSet,
      hadInvalidCookie,
    };
  }

  if (legacy) {
    const legacyRes = await verifySessionTokenEdge(legacy);
    if (!legacyRes) {
      hadInvalidCookie = true;
      cookiesToClear.push(LEGACY_SESSION_COOKIE);
    } else {
      const { exp, ...user } = legacyRes;
      const targetName = cookieNameForRole(user.role);
      if (shouldRefreshSession(exp) || targetName !== LEGACY_SESSION_COOKIE) {
        const newToken = await refreshSessionTokenEdge(user);
        if (newToken) {
          cookiesToSet.push({ name: targetName, token: newToken, role: user.role });
          cookiesToClear.push(LEGACY_SESSION_COOKIE);
        }
      }

      if (user.role === 'customer') {
        return {
          customer: user,
          admin: adminDedicated
            ? (await resolveRoleToken(adminDedicated, 'admin', ADMIN_SESSION_COOKIE)).user
            : null,
          courier: null,
          cookiesToClear: [...new Set(cookiesToClear)],
          cookiesToSet,
          hadInvalidCookie,
        };
      }

      if (user.role === 'courier') {
        return {
          customer: null,
          admin: null,
          courier: user,
          cookiesToClear: [...new Set(cookiesToClear)],
          cookiesToSet,
          hadInvalidCookie,
        };
      }

      return {
        customer: null,
        admin: user,
        courier: null,
        cookiesToClear: [...new Set(cookiesToClear)],
        cookiesToSet,
        hadInvalidCookie,
      };
    }
  }

  if (adminDedicated) {
    const adminRes = await resolveRoleToken(adminDedicated, 'admin', ADMIN_SESSION_COOKIE);
    if (adminRes.invalid) {
      hadInvalidCookie = true;
      cookiesToClear.push(ADMIN_SESSION_COOKIE);
    } else if (adminRes.set) cookiesToSet.push(adminRes.set);

    return {
      customer: null,
      admin: adminRes.user,
      courier: null,
      cookiesToClear: [...new Set(cookiesToClear)],
      cookiesToSet,
      hadInvalidCookie,
    };
  }

  return {
    customer: null,
    admin: null,
    courier: null,
    cookiesToClear: [...new Set(cookiesToClear)],
    cookiesToSet,
    hadInvalidCookie,
  };
}
