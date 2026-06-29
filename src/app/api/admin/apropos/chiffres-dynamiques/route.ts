import { NextResponse } from 'next/server';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';
import { aproposService } from '@/modules/marketing/services/apropos.service';

/** GET /api/admin/apropos/chiffres-dynamiques — chiffres clés calculés depuis la boutique */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  try {
    const chiffres = await aproposService.computeChiffresDynamiques();
    return NextResponse.json({ chiffres });
  } catch (error) {
    console.error('[GET /api/admin/apropos/chiffres-dynamiques]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
