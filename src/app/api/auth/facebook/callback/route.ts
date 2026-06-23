import { NextRequest, NextResponse } from 'next/server';
import {
  createSessionToken,
  isAuthConfigured,
  setSessionCookie,
} from '@/shared/lib/auth/session';
import { getAppUrl } from '@/shared/lib/app-url';
import {
  fetchFacebookUserFromCode,
  isFacebookAuthConfigured,
  verifyOAuthState,
} from '@/shared/lib/auth/facebook-oauth';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';

export async function GET(request: NextRequest) {
  const appUrl = getAppUrl();
  const fail = (message: string) =>
    NextResponse.redirect(
      new URL(`/connexion?error=${encodeURIComponent(message)}`, appUrl),
    );

  if (!isFacebookAuthConfigured() || !isAuthConfigured()) {
    return fail('Connexion Facebook indisponible');
  }

  const { searchParams } = request.nextUrl;
  if (searchParams.get('error')) return fail('Connexion Facebook annulée');

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  if (!code || !state) return fail('Paramètres Facebook invalides');

  const oauthState = verifyOAuthState(state);
  if (!oauthState) return fail('Session Facebook expirée, réessayez');

  try {
    const profile = await fetchFacebookUserFromCode(code);
    const customer = await customerAuthRepository.trouverOuCreerViaFacebook({
      facebookId: profile.id,
      email: profile.email,
      nom: profile.name,
      avatarUrl: profile.picture,
    });

    const token = createSessionToken({
      id: customer.id,
      email: customer.email,
      name: customer.nom,
      role: 'customer',
    });

    const response = NextResponse.redirect(new URL(oauthState.redirect, appUrl));
    setSessionCookie(response, token, 'customer');
    return response;
  } catch (err) {
    console.error('[GET /api/auth/facebook/callback]', err);
    return fail('Connexion Facebook impossible');
  }
}
