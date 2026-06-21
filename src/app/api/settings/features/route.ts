import { NextResponse } from 'next/server';
import { storeSettingsService } from '@/modules/admin/services/store-settings.service';

/** GET /api/settings/features — drapeaux publics (parrainage, appels) */
export async function GET() {
  try {
    const features = await storeSettingsService.getFeatureFlags();
    return NextResponse.json({ features });
  } catch (error) {
    console.error('[GET /api/settings/features]', error);
    return NextResponse.json(
      { features: { parrainageActif: true, appelsActifs: true } },
      { status: 200 },
    );
  }
}
