import { NextResponse } from 'next/server';
import { getCustomerSessionWithCourierFallback } from '@/shared/lib/auth/customer-from-courier';
import { assurerSessionLivreurPourClient } from '@/modules/livraison/services/courier-customer.service';
import { cachePrivate } from '@/shared/lib/http-cache';

/** GET /api/compte/livreur-context — indique si le client connecté est aussi livreur. */
export async function GET() {
  const session = await getCustomerSessionWithCourierFallback();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const livreur = await assurerSessionLivreurPourClient(session.id);

  return NextResponse.json({ livreur }, { headers: cachePrivate(0) });
}
