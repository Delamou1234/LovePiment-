import { NextResponse } from 'next/server';
import { adminUserAdminService } from '@/modules/admin/services/admin-user-admin.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

/** GET /api/admin/utilisateurs/overview — compteurs par type d'utilisateur */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const stats = await adminUserAdminService.obtenirVueEnsemble();
  return NextResponse.json(stats);
}
