import { NextResponse } from 'next/server';
import { createSessionToken, getCourierSession, setSessionCookie } from '@/shared/lib/auth/session';
import { assurerCompteClientPourLivreur } from '@/modules/livraison/services/courier-customer.service';

/** POST /api/livreur/compte-client — active le compte client pour un livreur connecté */
export async function POST() {
  const courier = await getCourierSession();
  if (!courier?.id) {
    return NextResponse.json({ message: 'Connexion livreur requise' }, { status: 401 });
  }

  const customer = await assurerCompteClientPourLivreur(courier.id);
  if (!customer) {
    return NextResponse.json({ message: 'Compte client indisponible' }, { status: 500 });
  }

  const token = createSessionToken({
    id: customer.id,
    email: customer.email,
    name: customer.nom,
    role: 'customer',
  });

  const response = NextResponse.json({
    ok: true,
    customerId: customer.id,
  });
  setSessionCookie(response, token, 'customer');
  return response;
}
