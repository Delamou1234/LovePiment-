import { cookies } from 'next/headers';
import {
  createSessionToken,
  CUSTOMER_SESSION_COOKIE,
  getCourierSession,
  getCustomerSession,
  type SessionUser,
} from '@/shared/lib/auth/session';
import { getSessionCookieOptions } from '@/shared/lib/auth/session-cookie-options';
import { isValidCustomerSession } from '@/shared/lib/auth/customer-session';
import { assurerCompteClientPourLivreur } from '@/modules/livraison/services/courier-customer.service';

/** Session client, ou compte client auto-créé pour un livreur connecté. */
export async function getCustomerSessionWithCourierFallback(): Promise<SessionUser | null> {
  const existing = await getCustomerSession();
  if (isValidCustomerSession(existing)) return existing;

  const courier = await getCourierSession();
  if (!courier?.id) return null;

  const customer = await assurerCompteClientPourLivreur(courier.id);
  if (!customer) return null;

  const sessionUser: SessionUser = {
    id: customer.id,
    email: customer.email,
    name: customer.nom,
    role: 'customer',
  };

  const token = createSessionToken(sessionUser);
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, token, getSessionCookieOptions());

  return sessionUser;
}
