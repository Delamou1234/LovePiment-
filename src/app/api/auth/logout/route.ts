import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, type SessionRole } from '@/shared/lib/auth/session';

function redirectSafe(request: NextRequest, target: string) {
  const fallback = new URL('/connexion', request.url);
  if (!target || !target.startsWith('/') || target.startsWith('//')) {
    return NextResponse.redirect(fallback);
  }

  const url = new URL(target, request.url);
  if (url.origin !== new URL(request.url).origin) {
    return NextResponse.redirect(fallback);
  }

  return NextResponse.redirect(url);
}

function parseLogoutRole(value: string | null): SessionRole | 'all' {
  if (value === 'customer' || value === 'admin' || value === 'courier') return value;
  return 'all';
}

/** GET /api/auth/logout?redirect=/connexion — efface la session puis redirige */
export async function GET(request: NextRequest) {
  const redirectTo = request.nextUrl.searchParams.get('redirect') || '/connexion';
  const role = parseLogoutRole(request.nextUrl.searchParams.get('role'));
  const response = redirectSafe(request, redirectTo);
  clearSessionCookie(response, role);
  return response;
}

/** POST /api/auth/logout?role=customer|admin */
export async function POST(request: NextRequest) {
  const role = parseLogoutRole(request.nextUrl.searchParams.get('role'));
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response, role);
  return response;
}
