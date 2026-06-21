import { NextRequest, NextResponse } from 'next/server';
import {
  buildAppleAuthUrl,
  createOAuthState,
  isAppleAuthConfigured,
} from '@/shared/lib/auth/apple-oauth';
import { getSafeRedirect } from '@/shared/lib/auth-redirect';

export async function GET(request: NextRequest) {
  if (!isAppleAuthConfigured()) {
    return NextResponse.redirect(
      new URL('/connexion?error=apple_non_configure', request.url),
    );
  }

  const redirect = request.nextUrl.searchParams.get('redirect');
  const state = createOAuthState(getSafeRedirect(redirect, '/compte'));
  return NextResponse.redirect(buildAppleAuthUrl(state));
}
