import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { paymentService } from '@/modules/paiement/services/payment.service';
import { orderService } from '@/modules/commandes/services/order.service';
import { getCustomerSessionWithCourierFallback } from '@/shared/lib/auth/customer-from-courier';
import { validerTelephoneGuinee } from '@/shared/lib/phone-guinea';
import { enforceRateLimit } from '@/shared/lib/security/enforce-rate-limit';

export const runtime = 'nodejs';

const retrySchema = z.object({
  commandeId: z.string().min(1),
  telephonePaiement: z
    .string()
    .max(20)
    .regex(/^[\d+\s\-()]+$/)
    .optional()
    .nullable(),
});

/**
 * POST /api/paiement/retry
 * Nouvelle session Orange Money pour une commande non payée.
 */
export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'checkout');
    if (limited) return limited;

    const customer = await getCustomerSessionWithCourierFallback();
    if (!customer?.id) {
      return NextResponse.json({ message: 'Connexion requise.' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const validation = retrySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: 'commandeId requis.' }, { status: 400 });
    }

    const { commandeId, telephonePaiement } = validation.data;
    const commande = await orderService.obtenirCommande(commandeId);
    if (commande.customerId && commande.customerId !== customer.id) {
      return NextResponse.json({ message: 'Accès refusé.' }, { status: 403 });
    }

    if (commande.statut === 'ANNULEE') {
      return NextResponse.json({ message: 'Cette commande est annulée.' }, { status: 400 });
    }
    if (commande.statutPaiement === 'REUSSIE') {
      return NextResponse.json({ message: 'Cette commande est déjà payée.' }, { status: 400 });
    }

    if (telephonePaiement?.trim() && !validerTelephoneGuinee(telephonePaiement)) {
      return NextResponse.json(
        { message: 'Numéro Orange Money invalide. Exemple : 620 00 00 00' },
        { status: 400 },
      );
    }

    const { paymentUrl } = await paymentService.relancerPaiementCommande(
      commandeId,
      telephonePaiement?.trim() || null,
    );
    return NextResponse.json({ paymentUrl, redirect: true });
  } catch (error) {
    console.error('[POST /api/paiement/retry]', error);
    const message =
      error instanceof Error ? error.message : 'Impossible de relancer le paiement.';
    return NextResponse.json({ message }, { status: 503 });
  }
}
