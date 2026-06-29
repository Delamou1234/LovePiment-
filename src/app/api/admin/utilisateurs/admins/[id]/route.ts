import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminUserAdminService } from '@/modules/admin/services/admin-user-admin.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

type Params = Promise<{ id: string }>;

const patchSchema = z.object({
  nom: z.string().min(2).max(120).optional(),
  actif: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

/** PATCH /api/admin/utilisateurs/admins/[id] */
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  try {
    const updated = await adminUserAdminService.mettreAJour(id, parsed.data, admin.id);
    return NextResponse.json({ admin: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ message }, { status: 400 });
  }
}
