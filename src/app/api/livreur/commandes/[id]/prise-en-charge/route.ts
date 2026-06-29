import { NextRequest, NextResponse } from 'next/server';
import { courierOrderService } from '@/modules/livraison/services/courier-order.service';
import { getCourierSession } from '@/shared/lib/auth/session';

type Params = Promise<{ id: string }>;

/** POST /api/livreur/commandes/[id]/prise-en-charge */
export async function POST(_request: NextRequest, { params }: { params: Params }) {
  const session = await getCourierSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const order = await courierOrderService.marquerPriseEnCharge(session.id, id);
    if (!order) {
      return NextResponse.json(
        { message: 'Commande introuvable ou non assignée à votre compte' },
        { status: 403 },
      );
    }

    return NextResponse.json({
      ok: true,
      priseEnCharge: true,
      priseEnChargeLe: order.livreurPriseEnChargeAt?.toISOString() ?? null,
      statut: order.statut,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Prise en charge impossible';
    return NextResponse.json({ message }, { status: 400 });
  }
}
