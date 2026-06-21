import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/shared/lib/auth/session.constants';

/** Protège /commande et /compte : cookie de session requis (vérif. complète côté layout). */
export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const isCheckoutRoute = pathname === '/commande' || pathname.startsWith('/commande/');
  const isCompteRoute = pathname === '/compte' || pathname.startsWith('/compte/');

  if ((isCheckoutRoute || isCompteRoute) && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/connexion';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request });
}
