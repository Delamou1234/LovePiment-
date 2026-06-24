import { NextResponse } from 'next/server';
import { STOCK_FAIBLE_SEUIL } from '@/modules/admin/lib/stock-threshold';
import { stockAlertService } from '@/modules/admin/services/stock-alert.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

/** GET /api/admin/stocks/alertes — variantes en stock faible (≤ seuil) */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const [count, alertes] = await Promise.all([
    stockAlertService.compterAlertes(),
    stockAlertService.listerAlertes(),
  ]);

  return NextResponse.json(
    { seuil: STOCK_FAIBLE_SEUIL, count, alertes },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
