import { NextRequest, NextResponse } from 'next/server';
import { biAdminService, type BiPeriode } from '@/modules/admin/services/bi.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

const PERIODES: BiPeriode[] = ['7j', '30j', '90j', '12m'];

/** GET /api/admin/bi?periode=30j */
export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const raw = request.nextUrl.searchParams.get('periode') ?? '30j';
  const periode = PERIODES.includes(raw as BiPeriode) ? (raw as BiPeriode) : '30j';

  const rapport = await biAdminService.genererRapport(periode);
  return NextResponse.json({ rapport });
}
