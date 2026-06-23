import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthenticatedRedirect } from '@/shared/lib/auth-redirect';
import { getSessionCookieOptions } from '@/shared/lib/auth/session-cookie-options';
import { resolveEdgeSessions } from '@/shared/lib/auth/session-edge';
import {
  ALL_SESSION_COOKIES,
  ADMIN_SESSION_COOKIE,
  COURIER_SESSION_COOKIE,
  CUSTOMER_SESSION_COOKIE,
  LEGACY_SESSION_COOKIE,
} from '@/shared/lib/auth/session.constants';

function applyCookieUpdates(
  response: NextResponse,
  snapshot: Awaited<ReturnType<typeof resolveEdgeSessions>>,
) {
  const opts = getSessionCookieOptions(0);
  for (const name of snapshot.cookiesToClear) {
    response.cookies.set(name, '', { ...opts, maxAge: 0 });
  }
  for (const item of snapshot.cookiesToSet) {
    response.cookies.set(item.name, item.token, getSessionCookieOptions());
    response.cookies.set(LEGACY_SESSION_COOKIE, '', { ...opts, maxAge: 0 });
  }
}

function hadAnySessionCookie(request: NextRequest): boolean {
  return ALL_SESSION_COOKIES.some((name) => Boolean(request.cookies.get(name)?.value));
}

/** Vérifie, renouvelle et nettoie les cookies de session sur chaque requête. */
export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const snapshot = await resolveEdgeSessions((name) => request.cookies.get(name)?.value);

  const isCheckoutRoute = pathname === '/commande' || pathname.startsWith('/commande/');
  const isCompteRoute = pathname === '/compte' || pathname.startsWith('/compte/');
  const isAuthRoute = pathname === '/connexion' || pathname === '/inscription';
  const isLivreurRoute = pathname === '/livreur' || pathname.startsWith('/livreur/');
  const isLivraisonNavRoute = pathname === '/livraison' || pathname.startsWith('/livraison/');
  const isLivreurLoginLegacy = pathname === '/livreur/connexion';
  const isProtectedCustomer = isCheckoutRoute || isCompteRoute;

  const hasCustomer = Boolean(snapshot.customer?.id);
  const hasAdmin = Boolean(snapshot.admin?.id);
  const hasCourier = Boolean(snapshot.courier?.id);
  const hadCookie = hadAnySessionCookie(request);

  if (isLivreurLoginLegacy) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/connexion';
    loginUrl.searchParams.set('redirect', '/livreur');
    const response = NextResponse.redirect(loginUrl);
    applyCookieUpdates(response, snapshot);
    return response;
  }

  if (isLivreurRoute && !hasCourier) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/connexion';
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    applyCookieUpdates(response, snapshot);
    return response;
  }

  if (isLivraisonNavRoute && !hasCourier) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/connexion';
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    applyCookieUpdates(response, snapshot);
    return response;
  }

  if (isProtectedCustomer && !hasCustomer) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/connexion';
    loginUrl.searchParams.set('redirect', pathname);
    if (snapshot.hadInvalidCookie || (hadCookie && !hasCustomer)) {
      loginUrl.searchParams.set('error', 'session_expired');
    }
    const response = NextResponse.redirect(loginUrl);
    if (snapshot.hadInvalidCookie || (hadCookie && !hasCustomer)) {
      const toClear = new Set(snapshot.cookiesToClear);
      toClear.add(CUSTOMER_SESSION_COOKIE);
      toClear.add(LEGACY_SESSION_COOKIE);
      if (snapshot.admin) toClear.delete(ADMIN_SESSION_COOKIE);
      if (snapshot.courier) toClear.delete(COURIER_SESSION_COOKIE);
      for (const name of toClear) {
        response.cookies.set(name, '', { ...getSessionCookieOptions(0), maxAge: 0 });
      }
    }
    return response;
  }

  if (isAuthRoute) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const target = resolveAuthenticatedRedirect(
      { customer: hasCustomer, admin: hasAdmin, courier: hasCourier },
      redirectParam,
    );
    if (target) {
      const response = NextResponse.redirect(new URL(target, request.url));
      applyCookieUpdates(response, snapshot);
      return response;
    }
  }

  const response = NextResponse.next({ request });
  applyCookieUpdates(response, snapshot);
  return response;
}
