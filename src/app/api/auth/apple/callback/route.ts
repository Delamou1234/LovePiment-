import { NextRequest, NextResponse } from 'next/server';
import {
  createSessionToken,
  isAuthConfigured,
  setSessionCookie,
} from '@/shared/lib/auth/session';
import { getAppUrl } from '@/shared/lib/app-url';
import {
  fetchAppleUserFromCode,
  isAppleAuthConfigured,
  verifyOAuthState,
} from '@/shared/lib/auth/apple-oauth';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';

export async function POST(request: NextRequest) {
  const appUrl = getAppUrl();
  const fail = (message: string) =>
    NextResponse.redirect(
      new URL(`/connexion?error=${encodeURIComponent(message)}`, appUrl),
    );

  if (!isAppleAuthConfigured() || !isAuthConfigured()) {
    return fail('Connexion Apple indisponible');
  }

  const form = await request.formData();
  const error = form.get('error')?.toString();
  if (error) return fail('Connexion Apple annulée');

  const code = form.get('code')?.toString();
  const state = form.get('state')?.toString();
  const userJson = form.get('user')?.toString();

  if (!code || !state) return fail('Paramètres Apple invalides');

  const oauthState = verifyOAuthState(state);
  if (!oauthState) return fail('Session Apple expirée, réessayez');

  try {
    const profile = await fetchAppleUserFromCode(code, userJson);
    const customer = await customerAuthRepository.trouverOuCreerViaApple({
      appleId: profile.id,
      email: profile.email,
      nom: profile.name,
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
    console.error('[POST /api/auth/apple/callback]', err);
    return fail('Connexion Apple impossible');
  }
}
