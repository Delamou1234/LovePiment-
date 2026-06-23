import { NextRequest, NextResponse } from 'next/server';
import { deliveryNavigationService } from '@/modules/livraison/services/delivery-navigation.service';
import { getCourierSession } from '@/shared/lib/auth/session';

type Params = Promise<{ token: string }>;

function unauthorized() {
  return NextResponse.json({ message: 'Connexion livreur requise' }, { status: 401 });
}

/** GET /api/livraison/[token] — navigation réservée au livreur assigné */
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  const session = await getCourierSession();
  if (!session?.id) return unauthorized();

  const { token } = await params;
  const livraison = await deliveryNavigationService.obtenirParTokenPourLivreur(
    token,
    session.id,
  );

  if (!livraison) {
    return NextResponse.json(
      { message: 'Livraison introuvable ou non assignée à votre compte' },
      { status: 403 },
    );
  }

  return NextResponse.json({ livraison });
}
