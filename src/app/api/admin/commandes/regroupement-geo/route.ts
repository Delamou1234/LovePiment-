import { NextRequest, NextResponse } from 'next/server';
import { orderGeoClusteringService } from '@/modules/livraison/services/order-geo-clustering.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

/** GET /api/admin/commandes/regroupement-geo — suggestions de tournées par zone */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const rayonKm = Number(request.nextUrl.searchParams.get('rayonKm') ?? '2.5');
  const geocoder = request.nextUrl.searchParams.get('geocoder') === 'true';

  try {
    const result = await orderGeoClusteringService.regrouperCommandesEligibles({
      rayonKm: Number.isFinite(rayonKm) && rayonKm > 0 ? rayonKm : 2.5,
      geocoderManquants: geocoder,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Regroupement impossible';
    return NextResponse.json({ message }, { status: 500 });
  }
}
