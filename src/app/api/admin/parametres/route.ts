import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';
import { storeSettingsService } from '@/modules/admin/services/store-settings.service';

const patchSchema = z.object({
  parrainageActif: z.boolean().optional(),
  appelsActifs: z.boolean().optional(),
  livraison: z
    .object({
      tarifConakry: z.number().int().min(0).max(10_000_000).optional(),
      tarifHorsConakry: z.number().int().min(0).max(10_000_000).optional(),
      seuilGratuit: z.number().int().min(0).max(100_000_000).optional(),
      villeParDefaut: z.string().min(2).max(80).optional(),
      gratuiteActive: z.boolean().optional(),
      delaiLabel: z.string().max(80).nullable().optional(),
    })
    .optional(),
  newsletter: z
    .object({
      actif: z.boolean().optional(),
      titre: z.string().min(1).max(120).optional(),
      description: z.string().max(500).nullable().optional(),
      imageUrl: z.string().max(500).nullable().optional(),
      remisePct: z.number().int().min(0).max(100).optional(),
      couponCode: z.string().max(40).nullable().optional(),
    })
    .optional(),
});

/** GET /api/admin/parametres */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  try {
    const settings = await storeSettingsService.getSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('[GET /api/admin/parametres]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

/** PATCH /api/admin/parametres */
export async function PATCH(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
    }

    const { parrainageActif, appelsActifs, livraison, newsletter } = parsed.data;

    if (
      parrainageActif === undefined &&
      appelsActifs === undefined &&
      !livraison &&
      !newsletter
    ) {
      return NextResponse.json({ message: 'Aucune modification' }, { status: 400 });
    }

    let settings = await storeSettingsService.getSettings();

    if (parrainageActif !== undefined || appelsActifs !== undefined) {
      settings = await storeSettingsService.updateFeatureFlags({
        parrainageActif,
        appelsActifs,
      });
    }

    if (livraison) {
      settings = await storeSettingsService.updateLivraisonSettings(livraison);
    }

    if (newsletter) {
      settings = await storeSettingsService.updateNewsletterSettings({
        ...(newsletter.actif !== undefined && { newsletterActif: newsletter.actif }),
        ...(newsletter.titre !== undefined && { newsletterTitre: newsletter.titre }),
        ...(newsletter.description !== undefined && {
          newsletterDescription: newsletter.description,
        }),
        ...(newsletter.imageUrl !== undefined && { newsletterImageUrl: newsletter.imageUrl }),
        ...(newsletter.remisePct !== undefined && { newsletterRemisePct: newsletter.remisePct }),
        ...(newsletter.couponCode !== undefined && {
          newsletterCouponCode: newsletter.couponCode,
        }),
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('[PATCH /api/admin/parametres]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
