import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { trackingService } from '@/modules/livraison/services/tracking.service';
import { orderService } from '@/modules/commandes/services/order.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

/** GET /api/admin/commandes */
export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const statut = request.nextUrl.searchParams.get('statut') ?? undefined;
  const { commandes, pagination } = await orderService.listerCommandes(
    { statut },
    { page: 1, limit: 50 },
  );

  const enriched = await Promise.all(
    commandes.map(async (c) => {
      const suivi = await trackingService.obtenirSuiviParId(c.id);
      return {
        ...c,
        montantTotal: Number(c.montantTotal),
        modePaiement: c.modePaiement,
        statutPaiement: c.statutPaiement,
        suiviToken: suivi?.suiviToken,
        suiviResume: suivi?.livraisonLibelle,
        satisfaction: suivi?.satisfaction ?? null,
      };
    }),
  );

  return NextResponse.json({ commandes: enriched, pagination });
}
