import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { orderService } from '@/modules/commandes/services/order.service';
import { paymentService } from '@/modules/paiement/services/payment.service';
import { getCustomerSession } from '@/shared/lib/auth/session';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';

// ─── Schéma de validation commande ───────────────────────────────────────────

const creerCommandeSchema = z.object({
  clientNom: z.string().min(2, 'Nom requis (min 2 caractères)').max(100),
  clientTelephone: z
    .string()
    .min(8, 'Numéro de téléphone invalide')
    .regex(/^[\d+\s\-()]+$/, 'Numéro de téléphone invalide'),
  clientAdresse: z.string().min(5, 'Adresse requise').max(200),
  clientVille: z.string().min(2, 'Ville requise').max(100),
  clientLatitude: z.number().min(-90).max(90).optional().nullable(),
  clientLongitude: z.number().min(-180).max(180).optional().nullable(),
  modePaiement: z.enum(['CINETPAY', 'PAIEMENT_LIVRAISON']),
  codeCoupon: z.string().max(40).optional().nullable(),
  pointsUtilises: z.number().int().min(0).optional(),
  codeParrainage: z.string().max(40).optional().nullable(),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantite: z.number().int().min(1).max(100),
        prixUnitaire: z.number().min(0),
      }),
    )
    .min(1, 'La commande doit contenir au moins un article'),
});

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const customer = await getCustomerSession();
    if (!customer) {
      return NextResponse.json(
        { message: 'Connexion requise pour passer commande.' },
        { status: 401 },
      );
    }

    if (!customer.id) {
      return NextResponse.json(
        { message: 'Session invalide. Reconnectez-vous.' },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();
    const validation = creerCommandeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Données invalides', errors: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // 1. Créer la commande liée au compte client
    const commande = await orderService.creerCommande({
      ...validation.data,
      customerId: customer.id,
    });

    // 2. Mettre à jour le profil client (nom / téléphone saisis au checkout)
    await customerAuthRepository.mettreAJourProfil(customer.id, {
      nom: validation.data.clientNom,
      telephone: validation.data.clientTelephone,
    });

    // 3. Si paiement CinetPay → initier le paiement
    if (validation.data.modePaiement === 'CINETPAY') {
      try {
        const { paymentUrl } = await paymentService.initierPaiementCommande(
          commande.id,
          customer.email,
        );
        return NextResponse.json(
          { commandeId: commande.id, paymentUrl, redirect: true },
          { status: 201 },
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Paiement en ligne indisponible. Utilisez le paiement à la livraison.';
        return NextResponse.json({ message }, { status: 503 });
      }
    }

    // 4. Paiement à la livraison → retourner directement la confirmation
    return NextResponse.json(
      { commandeId: commande.id, redirect: false },
      { status: 201 },
    );
  } catch (error) {
    console.error('[POST /api/paiement]', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}
