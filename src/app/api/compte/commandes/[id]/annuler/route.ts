import { NextResponse } from 'next/server';
import { customerOrderService } from '@/modules/compte/services/customer-order.service';
import { getCustomerSession } from '@/shared/lib/auth/session';

type Params = Promise<{ id: string }>;

/** POST /api/compte/commandes/[id]/annuler */
export async function POST(_request: Request, { params }: { params: Params }) {
  const session = await getCustomerSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const { id } = await params;
  const result = await customerOrderService.annuler(session.id, id);

  if (result === 'not_found') {
    return NextResponse.json({ message: 'Commande introuvable' }, { status: 404 });
  }

  if (result === 'forbidden' || result === 'invalid') {
    return NextResponse.json(
      { message: 'Cette commande ne peut plus être annulée en ligne. Contactez le support.' },
      { status: 403 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: 'Commande annulée. Vous recevrez une confirmation par notification.',
  });
}
