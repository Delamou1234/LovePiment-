import { NextRequest, NextResponse } from 'next/server';
import type { RapportPeriode } from '@/modules/admin/services/analytics-admin.service';
import { googleAnalyticsService } from '@/modules/admin/services/google-analytics.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

/** GET /api/admin/analytics/google?periode=7j|30j|90j */
export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const periode = (request.nextUrl.searchParams.get('periode') ?? '7j') as RapportPeriode;
  const safePeriode = (['7j', '30j', '90j'] as const).includes(periode) ? periode : '7j';

  const [rapport, setup] = await Promise.all([
    googleAnalyticsService.genererRapport(safePeriode),
    Promise.resolve(googleAnalyticsService.getStatutConfiguration()),
  ]);

  return NextResponse.json({ rapport, setup });
}
