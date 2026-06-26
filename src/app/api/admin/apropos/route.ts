import { NextRequest, NextResponse } from 'next/server';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';
import { aproposService } from '@/modules/marketing/services/apropos.service';
import { aproposPatchSchema } from '@/modules/marketing/types/apropos';

/** GET /api/admin/apropos */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  try {
    const apropos = await aproposService.getPublicConfig();
    return NextResponse.json({ apropos });
  } catch (error) {
    console.error('[GET /api/admin/apropos]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

/** PATCH /api/admin/apropos */
export async function PATCH(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  try {
    const body = await request.json();
    const parsed = aproposPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Données invalides', errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ message: 'Aucune modification' }, { status: 400 });
    }

    const apropos = await aproposService.update(parsed.data);
    return NextResponse.json({ apropos });
  } catch (error) {
    console.error('[PATCH /api/admin/apropos]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
