import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';
import { storeSettingsService } from '@/modules/admin/services/store-settings.service';

const patchSchema = z.object({
  parrainageActif: z.boolean().optional(),
  appelsActifs: z.boolean().optional(),
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

/** PATCH /api/admin/parametres — activer / désactiver des fonctionnalités */
export async function PATCH(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
    }

    if (
      parsed.data.parrainageActif === undefined &&
      parsed.data.appelsActifs === undefined
    ) {
      return NextResponse.json({ message: 'Aucune modification' }, { status: 400 });
    }

    const settings = await storeSettingsService.updateFeatureFlags(parsed.data);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('[PATCH /api/admin/parametres]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
