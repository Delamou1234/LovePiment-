import { NextResponse } from 'next/server';
import { adminStatsService } from '@/modules/admin/services/admin-stats.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

/** GET /api/admin/stats */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const stats = await adminStatsService.obtenirDashboard();
  return NextResponse.json({ stats });
}
