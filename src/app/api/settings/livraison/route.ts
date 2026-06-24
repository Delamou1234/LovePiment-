import { NextResponse } from 'next/server';
import { storeSettingsService } from '@/modules/admin/services/store-settings.service';

/** GET /api/settings/livraison — tarifs et règles de livraison (public) */
export async function GET() {
  try {
    const livraison = await storeSettingsService.getLivraisonConfig();
    return NextResponse.json({ livraison });
  } catch (error) {
    console.error('[GET /api/settings/livraison]', error);
    return NextResponse.json(
      {
        livraison: {
          villeParDefaut: 'Conakry',
          tarifConakry: 15_000,
          tarifHorsConakry: 25_000,
          seuilGratuit: 500_000,
          gratuiteActive: true,
          delaiLabel: '24–48 h',
        },
      },
      { status: 200 },
    );
  }
}
