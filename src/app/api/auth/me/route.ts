import { NextResponse } from 'next/server';
import { adminAuthRepository } from '@/modules/auth/repository/admin-auth.repository';
import {
  clearSessionCookie,
  getAdminSession,
  getCustomerSessionWithRefresh,
  setSessionCookie,
} from '@/shared/lib/auth/session';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';

/** GET /api/auth/me — session + profil client depuis la base */
export async function GET() {
  const { user: session, refreshedToken, role } = await getCustomerSessionWithRefresh();

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
      const admin =
        (adminSession.id ? await adminAuthRepository.trouverParId(adminSession.id) : null) ??
        (await adminAuthRepository.trouverParEmail(adminSession.email));
      if (!admin?.actif) {
        const response = NextResponse.json({ user: null });
        clearSessionCookie(response, 'admin');
        return response;
      }
      return NextResponse.json({
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.nom,
          role: 'admin' as const,
        },
      });
    }

    return NextResponse.json({ user: null });
  }

  if (!session.id) {
    return buildResponse({ user: session });
  }

  const customer = await customerAuthRepository.trouverParId(session.id);
  if (!customer) {
    return buildResponse({ user: null }, true);
  }

  const derniereCommande = await customerAuthRepository.trouverDerniereCommande(customer.id);

  return buildResponse({
    user: {
      id: customer.id,
      email: customer.email,
      name: customer.nom,
      role: 'customer' as const,
      telephone: customer.telephone,
      avatarUrl: customer.avatarUrl,
      viaGoogle: Boolean(customer.googleId),
      adressePreferee: customer.adressePreferee,
      villePreferee: customer.villePreferee,
      derniereAdresse:
        customer.adressePreferee ?? derniereCommande?.clientAdresse ?? null,
      derniereVille: customer.villePreferee ?? derniereCommande?.clientVille ?? null,
    },
  });
}
