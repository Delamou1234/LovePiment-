import { NextResponse } from 'next/server';
import { trackingService } from '@/modules/livraison/services/tracking.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

type Params = Promise<{ id: string }>;

/** POST /api/admin/commandes/[id]/paiement-livraison — livreur confirme encaissement espèces */
export async function POST(_request: Request, { params }: { params: Params }) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const { id } = await params;

  try {
    const order = await trackingService.confirmerPaiementLivraison(id);
    const suivi = await trackingService.obtenirSuiviParId(order!.id);
    return NextResponse.json({
      message: 'Paiement enregistré — montant comptabilisé.',
      suivi,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur';
    return NextResponse.json({ message }, { status: 400 });
  }
}
