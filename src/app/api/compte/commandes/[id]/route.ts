import { NextResponse } from 'next/server';
import { customerOrderService } from '@/modules/compte/services/customer-order.service';
import { getCustomerSession } from '@/shared/lib/auth/session';

type Params = Promise<{ id: string }>;

/** GET /api/compte/commandes/[id] */
export async function GET(_request: Request, { params }: { params: Params }) {
  const session = await getCustomerSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const { id } = await params;
  const commande = await customerOrderService.obtenirDetail(session.id, id);

  if (!commande) {
    return NextResponse.json({ message: 'Commande introuvable' }, { status: 404 });
  }

  return NextResponse.json({ commande });
}
