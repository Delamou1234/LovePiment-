import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { orderService } from '@/modules/commandes/services/order.service';
import { paymentService } from '@/modules/paiement/services/payment.service';
import { getCustomerSessionWithCourierFallback } from '@/shared/lib/auth/customer-from-courier';
import { customerAuthRepository } from '@/modules/auth/repository/customer-auth.repository';
import { enforceRateLimit } from '@/shared/lib/security/enforce-rate-limit';
import { validerTelephoneGuinee } from '@/shared/lib/phone-guinea';
import { MODE_PAIEMENT_BOUTIQUE } from '@/shared/lib/payment-labels';

const creerCommandeSchema = z.object({
  clientNom: z.string().min(2, 'Nom requis (min 2 caractères)').max(100),
  clientTelephone: z
    .string()
    .min(8, 'Numéro de téléphone invalide')
    .regex(/^[\d+\s\-()]+$/, 'Numéro de téléphone invalide'),
  clientAdresse: z.string().min(5, 'Adresse requise').max(200),
  clientVille: z.string().min(2, 'Ville requise').max(100),
  clientCommune: z.string().min(2).max(80).optional().nullable(),
  clientQuartier: z.string().max(120).optional().nullable(),
  clientRepere: z.string().max(200).optional().nullable(),
  creneauLivraison: z.enum(['MATIN', 'APRES_MIDI', 'FLEXIBLE']).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  clientLatitude: z.number().min(-90).max(90).optional().nullable(),
  clientLongitude: z.number().min(-180).max(180).optional().nullable(),
  codeCoupon: z.string().max(40).optional().nullable(),
  pointsUtilises: z.number().int().min(0).optional(),
  codeParrainage: z.string().max(40).optional().nullable(),
  telephonePaiement: z
    .string()
    .max(20)
    .regex(/^[\d+\s\-()]*$/, 'Numéro de téléphone invalide')
    .optional()
    .nullable(),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantite: z.number().int().min(1).max(100),
        prixUnitaire: z.number().min(0).optional(),
      }),
    )
    .min(1, 'La commande doit contenir au moins un article'),
});

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'checkout');
    if (limited) return limited;

    const customer = await getCustomerSessionWithCourierFallback();
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

    if (
      validation.data.telephonePaiement?.trim() &&
      !validerTelephoneGuinee(validation.data.telephonePaiement)
    ) {
      return NextResponse.json(
        { message: 'Numéro Orange Money invalide. Exemple : 620 00 00 00' },
        { status: 400 },
      );
    }

    const { telephonePaiement, ...commandeData } = validation.data;

    const commande = await orderService.creerCommande({
      ...commandeData,
      modePaiement: MODE_PAIEMENT_BOUTIQUE,
      customerId: customer.id,
      paymentTelephone:
        telephonePaiement?.trim() &&
        telephonePaiement.trim() !== commandeData.clientTelephone.trim()
          ? telephonePaiement.trim()
          : null,
    });

    await customerAuthRepository.mettreAJourProfil(customer.id, {
      nom: validation.data.clientNom,
      telephone: validation.data.clientTelephone,
    });

    try {
      const { paymentUrl } = await paymentService.initierPaiementCommande(commande.id);
      return NextResponse.json(
        { commandeId: commande.id, paymentUrl, redirect: true },
        { status: 201 },
      );
    } catch (err) {
      await orderService.annulerApresEchecPaiement(commande.id);
      const message =
        err instanceof Error
          ? err.message
          : 'Paiement Orange Money indisponible. Réessayez dans un instant.';
      return NextResponse.json({ message }, { status: 503 });
    }
  } catch (error) {
    console.error('[POST /api/paiement]', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}
