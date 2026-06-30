import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/modules/paiement/services/payment.service';
import { orderService } from '@/modules/commandes/services/order.service';
import { getCustomerSessionWithCourierFallback } from '@/shared/lib/auth/customer-from-courier';
import { enforceRateLimit } from '@/shared/lib/security/enforce-rate-limit';

export const runtime = 'nodejs';

/**
 * GET /api/paiement/statut?commandeId=...
 * Synchronise le statut Orange Money et retourne l'état courant.
 */
export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'checkout');
    if (limited) return limited;

    const customer = await getCustomerSessionWithCourierFallback();
    if (!customer?.id) {
      return NextResponse.json({ message: 'Connexion requise.' }, { status: 401 });
    }

    const commandeId = request.nextUrl.searchParams.get('commandeId')?.trim();
    if (!commandeId) {
      return NextResponse.json({ message: 'commandeId requis.' }, { status: 400 });
    }

    const commande = await orderService.obtenirCommande(commandeId);
    if (commande.customerId && commande.customerId !== customer.id) {
      return NextResponse.json({ message: 'Accès refusé.' }, { status: 403 });
    }

    const statut = await paymentService.synchroniserPaiementCommande(commandeId);
    return NextResponse.json(statut);
  } catch (error) {
    console.error('[GET /api/paiement/statut]', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}
