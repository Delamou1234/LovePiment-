import { NextRequest, NextResponse } from 'next/server';
import {
  createSessionToken,
  isAuthConfigured,
  setSessionCookie,
} from '@/shared/lib/auth/session';
import { getAppUrl } from '@/shared/lib/app-url';
import {
  fetchGoogleUserFromCode,
  isGoogleAuthConfigured,
  verifyOAuthState,
} from '@/shared/lib/auth/google-oauth';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';

/** GET /api/auth/google/callback */
export async function GET(request: NextRequest) {
  const appUrl = getAppUrl();
  const fail = (message: string) =>
    NextResponse.redirect(
      new URL(`/connexion?error=${encodeURIComponent(message)}`, appUrl),
    );

  if (!isGoogleAuthConfigured() || !isAuthConfigured()) {
    return fail('Connexion Google indisponible');
  }

  const { searchParams } = request.nextUrl;
  const error = searchParams.get('error');
  if (error) {
    return fail('Connexion Google annulée');
  }

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  if (!code || !state) {
    return fail('Paramètres Google invalides');
  }

  const oauthState = verifyOAuthState(state);
  if (!oauthState) {
    return fail('Session Google expirée, réessayez');
  }

  try {
    const profile = await fetchGoogleUserFromCode(code);
    const customer = await customerAuthRepository.trouverOuCreerViaGoogle({
      googleId: profile.id,
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
    setSessionCookie(response, token);
    return response;
  } catch (err) {
    console.error('[GET /api/auth/google/callback]', err);
    return fail('Connexion Google impossible');
  }
}
