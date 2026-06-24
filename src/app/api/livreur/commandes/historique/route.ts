import { NextRequest, NextResponse } from 'next/server';
import { courierOrderService } from '@/modules/livraison/services/courier-order.service';
import { getCourierSession } from '@/shared/lib/auth/session';

/** GET /api/livreur/commandes/historique — livraisons terminées du livreur */
export async function GET(request: NextRequest) {
  const session = await getCourierSession();
  if (!session?.id) {
    return NextResponse.json({ message: 'Connexion requise' }, { status: 401 });
  }

  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? 1) || 1);
  const limit = Math.min(100, Math.max(10, Number(request.nextUrl.searchParams.get('limit') ?? 50) || 50));

  const { livraisons, total } = await courierOrderService.listerHistoriquePourLivreur(
    session.id,
    { page, limit },
  );
  const totaux = await courierOrderService.obtenirTotauxLivreur(session.id);

  return NextResponse.json({
    livraisons,
    totaux,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
