import { NextRequest, NextResponse } from 'next/server';
import {
  buildGoogleAuthUrl,
  createOAuthState,
  isGoogleAuthConfigured,
} from '@/shared/lib/auth/google-oauth';
import { getSafeRedirect } from '@/shared/lib/auth-redirect';

/** GET /api/auth/google — redirection vers Google OAuth */
export async function GET(request: NextRequest) {
  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(
      new URL('/connexion?error=google_non_configure', request.url),
    );
  }

  const redirect = request.nextUrl.searchParams.get('redirect');
  const state = createOAuthState(getSafeRedirect(redirect, '/commande'));
  const url = buildGoogleAuthUrl(state);

  return NextResponse.redirect(url);
}
