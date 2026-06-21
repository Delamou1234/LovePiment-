import { NextRequest, NextResponse } from 'next/server';
import {
  buildFacebookAuthUrl,
  createOAuthState,
  isFacebookAuthConfigured,
} from '@/shared/lib/auth/facebook-oauth';
import { getSafeRedirect } from '@/shared/lib/auth-redirect';

export async function GET(request: NextRequest) {
  if (!isFacebookAuthConfigured()) {
    return NextResponse.redirect(
      new URL('/connexion?error=facebook_non_configure', request.url),
    );
  }

  const redirect = request.nextUrl.searchParams.get('redirect');
  const state = createOAuthState(getSafeRedirect(redirect, '/compte'));
  return NextResponse.redirect(buildFacebookAuthUrl(state));
}
