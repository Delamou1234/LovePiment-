import { NextRequest, NextResponse } from 'next/server';
import {
  analyticsAdminService,
  type RapportPeriode,
} from '@/modules/admin/services/analytics-admin.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

/** GET /api/admin/rapports?periode=7j|30j|90j */
export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const periode = (request.nextUrl.searchParams.get('periode') ?? '7j') as RapportPeriode;
  const rapport = await analyticsAdminService.genererRapport(
    ['7j', '30j', '90j'].includes(periode) ? periode : '7j',
  );

  return NextResponse.json({ rapport });
}
