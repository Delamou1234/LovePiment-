import { sign } from 'crypto';
import { getAppUrl } from '@/shared/lib/app-url';
import { createOAuthState, verifyOAuthState } from '@/shared/lib/auth/oauth-state';

const APPLE_AUTH_URL = 'https://appleid.apple.com/auth/authorize';
const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';

export function isAppleAuthConfigured(): boolean {
  return Boolean(
    process.env.APPLE_CLIENT_ID &&
      process.env.APPLE_TEAM_ID &&
      process.env.APPLE_KEY_ID &&
      process.env.APPLE_PRIVATE_KEY,
  );
}

export function getAppleRedirectUri(): string {
  return `${getAppUrl()}/api/auth/apple/callback`;
}

export { createOAuthState, verifyOAuthState };

function createAppleClientSecret(): string {
  const teamId = process.env.APPLE_TEAM_ID!;
  const clientId = process.env.APPLE_CLIENT_ID!;
  const keyId = process.env.APPLE_KEY_ID!;
  const privateKey = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n');

  const header = { alg: 'ES256', kid: keyId };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: teamId,
    iat: now,
    exp: now + 86400 * 180,
    aud: 'https://appleid.apple.com',
    sub: clientId,
  };

  const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsigned = `${encode(header)}.${encode(payload)}`;
  const signature = sign('sha256', Buffer.from(unsigned), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363',
  }).toString('base64url');
  return `${unsigned}.${signature}`;
}

export function buildAppleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID!,
    redirect_uri: getAppleRedirectUri(),
    response_type: 'code',
    response_mode: 'form_post',
    scope: 'name email',
    state,
  });
  return `${APPLE_AUTH_URL}?${params.toString()}`;
}

export type AppleUserProfile = {
  id: string;
  email: string;
  name: string;
};

function decodeJwtPayload(token: string): Record<string, unknown> {
  const part = token.split('.')[1];
  if (!part) throw new Error('JWT Apple invalide');
  return JSON.parse(Buffer.from(part, 'base64url').toString());
}

export async function fetchAppleUserFromCode(
  code: string,
  userJson?: string | null,
): Promise<AppleUserProfile> {
  const clientSecret = createAppleClientSecret();

  const tokenRes = await fetch(APPLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.APPLE_CLIENT_ID!,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: getAppleRedirectUri(),
    }),
  });

  if (!tokenRes.ok) throw new Error('Échange token Apple échoué');

  const tokenData = (await tokenRes.json()) as { id_token?: string };
  if (!tokenData.id_token) throw new Error('Token Apple manquant');

  const claims = decodeJwtPayload(tokenData.id_token) as {
    sub?: string;
    email?: string;
  };

  if (!claims.sub) throw new Error('Profil Apple incomplet');

  let name = 'Client Apple';
  if (userJson) {
    try {
      const user = JSON.parse(userJson) as { name?: { firstName?: string; lastName?: string } };
      const parts = [user.name?.firstName, user.name?.lastName].filter(Boolean);
      if (parts.length) name = parts.join(' ');
    } catch {
      /* ignore */
    }
  }

  const email = claims.email?.trim().toLowerCase();
  if (!email) {
    throw new Error('E-mail Apple requis — utilisez « Partager mon e-mail »');
  }

  return { id: claims.sub, email, name };
}
