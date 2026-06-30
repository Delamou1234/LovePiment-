import { NextResponse } from 'next/server';
import { adminAuthRepository } from '@/modules/auth/repository/admin-auth.repository';
import {
  clearSessionCookie,
  getAdminSession,
  getCourierSession,
  getCustomerSessionWithRefresh,
  setSessionCookie,
} from '@/shared/lib/auth/session';
import { getCustomerSessionWithCourierFallback } from '@/shared/lib/auth/customer-from-courier';
import {
  construireUtilisateurAdminAuth,
  construireUtilisateurClientAuth,
  construireUtilisateurLivreurAuth,
} from '@/modules/auth/services/auth-me.service';

/** GET /api/auth/me — session + profil client depuis la base */
export async function GET() {
  const refreshed = await getCustomerSessionWithRefresh();
  let session = refreshed.user;
  const refreshedToken = refreshed.refreshedToken;
  let role: 'customer' = refreshed.role;

  if (!session) {
    session = await getCustomerSessionWithCourierFallback();
    if (session) role = 'customer';
  }

  const buildResponse = (body: object, clear = false) => {
    const response = NextResponse.json(body);
    if (refreshedToken && session) {
      setSessionCookie(response, refreshedToken, role);
    }
    if (clear) clearSessionCookie(response, 'customer');
    return response;
  };

  if (!session) {
    const adminSession = await getAdminSession();
    if (adminSession) {
      const admin = await construireUtilisateurAdminAuth(
        adminSession.id ?? '',
        adminSession.email,
      );
      if (!admin) {
        const response = NextResponse.json({ user: null });
        clearSessionCookie(response, 'admin');
        return response;
      }
      return NextResponse.json({ user: admin });
    }

    const courierSession = await getCourierSession();
    if (courierSession?.id) {
      return NextResponse.json({
        user: construireUtilisateurLivreurAuth({
          id: courierSession.id,
          email: courierSession.email,
          name: courierSession.name,
        }),
      });
    }

    return NextResponse.json({ user: null });
  }

  if (!session.id) {
    return buildResponse({ user: session });
  }

  const customer = await construireUtilisateurClientAuth(session.id);
  if (!customer) {
    return buildResponse({ user: null }, true);
  }

  return buildResponse({ user: customer });
}
