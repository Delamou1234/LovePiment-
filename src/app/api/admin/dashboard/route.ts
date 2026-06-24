import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';
import { dashboardOverviewService } from '@/modules/admin/services/dashboard-overview.service';
import type { BiPeriode } from '@/modules/admin/services/bi.service';

const querySchema = z.object({
  periode: z.enum(['7j', '30j', '90j', '12m']).optional(),
});

/** GET /api/admin/dashboard — vue d'ensemble tableau de bord */
export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const parsed = querySchema.safeParse({
    periode: request.nextUrl.searchParams.get('periode') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ message: 'Période invalide' }, { status: 400 });
  }

  const periode = (parsed.data.periode ?? '7j') as BiPeriode;
  const overview = await dashboardOverviewService.obtenir(periode);
  return NextResponse.json({ overview });
}
