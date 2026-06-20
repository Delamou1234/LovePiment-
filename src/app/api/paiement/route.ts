import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { orderService } from '@/modules/commandes/services/order.service';
import { paymentService } from '@/modules/paiement/services/payment.service';

// ─── Schéma de validation commande ───────────────────────────────────────────

const creerCommandeSchema = z.object({
  clientNom: z.string().min(2, 'Nom requis (min 2 caractères)').max(100),
  clientTelephone: z
    .string()
    .min(8, 'Numéro de téléphone invalide')
    .regex(/^[\d+\s\-()]+$/, 'Numéro de téléphone invalide'),
  clientAdresse: z.string().min(5, 'Adresse requise').max(200),
  clientVille: z.string().min(2, 'Ville requise').max(100),
  modePaiement: z.enum(['CINETPAY', 'PAIEMENT_LIVRAISON']),
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

// ─── POST /api/paiement ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const validation = creerCommandeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Données invalides', errors: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // 1. Créer la commande
    const commande = await orderService.creerCommande(validation.data);

    // 2. Si paiement CinetPay → initier le paiement
    if (validation.data.modePaiement === 'CINETPAY') {
      const { paymentUrl } = await paymentService.initierPaiementCommande(commande.id);
      return NextResponse.json(
        { commandeId: commande.id, paymentUrl, redirect: true },
        { status: 201 },
      );
    }

    // 3. Paiement à la livraison → retourner directement la confirmation
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
