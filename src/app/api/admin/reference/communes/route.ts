import { NextResponse } from 'next/server';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';
import { referenceDataService } from '@/modules/admin/services/reference-data.service';

/** GET /api/admin/reference/communes — liste dynamique des communes */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  try {
    const communes = await referenceDataService.listCommunes();
    return NextResponse.json({ communes });
  } catch (error) {
    console.error('[GET /api/admin/reference/communes]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
