import { getAppUrl } from '@/shared/lib/app-url';
import { createOAuthState, verifyOAuthState } from '@/shared/lib/auth/oauth-state';

const FACEBOOK_AUTH_URL = 'https://www.facebook.com/v21.0/dialog/oauth';
const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v21.0/oauth/access_token';
const FACEBOOK_USER_URL = 'https://graph.facebook.com/me';

export function isFacebookAuthConfigured(): boolean {
  return Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);
}

export function getFacebookRedirectUri(): string {
  return `${getAppUrl()}/api/auth/facebook/callback`;
}

export { createOAuthState, verifyOAuthState };

export function buildFacebookAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: getFacebookRedirectUri(),
    response_type: 'code',
    scope: 'email,public_profile',
    state,
  });
  return `${FACEBOOK_AUTH_URL}?${params.toString()}`;
}

export type FacebookUserProfile = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

export async function fetchFacebookUserFromCode(code: string): Promise<FacebookUserProfile> {
  const tokenParams = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    client_secret: process.env.FACEBOOK_APP_SECRET!,
    redirect_uri: getFacebookRedirectUri(),
    code,
  });

  const tokenRes = await fetch(`${FACEBOOK_TOKEN_URL}?${tokenParams.toString()}`);
  if (!tokenRes.ok) throw new Error('Échange token Facebook échoué');

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) throw new Error('Token Facebook manquant');

  const userParams = new URLSearchParams({
    fields: 'id,name,email,picture.type(large)',
    access_token: tokenData.access_token,
  });

  const userRes = await fetch(`${FACEBOOK_USER_URL}?${userParams.toString()}`);
  if (!userRes.ok) throw new Error('Profil Facebook inaccessible');

  const profile = (await userRes.json()) as {
    id?: string;
    email?: string;
    name?: string;
    picture?: { data?: { url?: string } };
  };

  if (!profile.id) throw new Error('Profil Facebook incomplet');

  const email = profile.email?.trim().toLowerCase();
  if (!email) {
    throw new Error('E-mail Facebook requis — autorisez l’accès à votre e-mail');
  }

  return {
    id: profile.id,
    email,
    name: profile.name?.trim() || email.split('@')[0],
    picture: profile.picture?.data?.url,
  };
}
