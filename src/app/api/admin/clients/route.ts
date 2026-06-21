import { NextResponse } from 'next/server';
import { clientAdminService } from '@/modules/admin/services/client-admin.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

/** GET /api/admin/clients */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const clients = await clientAdminService.listerClients();
  return NextResponse.json({ clients });
}
