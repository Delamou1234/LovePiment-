import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminUserAdminService } from '@/modules/admin/services/admin-user-admin.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nom: z.string().min(2).max(120),
});

/** GET /api/admin/utilisateurs/admins */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const admins = await adminUserAdminService.lister();
  return NextResponse.json({ admins });
}

/** POST /api/admin/utilisateurs/admins */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  try {
    const created = await adminUserAdminService.creer(parsed.data);
    return NextResponse.json({ admin: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    const status = message.includes('déjà utilisé') ? 409 : 400;
    return NextResponse.json({ message }, { status });
  }
}
