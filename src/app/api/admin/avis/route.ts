import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { avisService } from '@/modules/avis/services/review.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';
import { revalidateBoutique } from '@/modules/produits/lib/revalidate-boutique';

/** GET /api/admin/avis */
export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const statut = request.nextUrl.searchParams.get('statut');
  const avis = await avisService.listerAdmin(
    statut === 'EN_ATTENTE' || statut === 'APPROUVE' || statut === 'REFUSE' ? statut : undefined,
  );
  return NextResponse.json({ avis });
}

const patchSchema = z.object({
  id: z.string(),
  statut: z.enum(['APPROUVE', 'REFUSE', 'EN_ATTENTE']),
});

/** PATCH /api/admin/avis */
export async function PATCH(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  await avisService.moderer(parsed.data.id, parsed.data.statut);
  revalidateBoutique({ reviews: true });
  return NextResponse.json({ ok: true });
}

const deleteSchema = z.object({
  id: z.string(),
});

/** DELETE /api/admin/avis */
export async function DELETE(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  await avisService.supprimer(parsed.data.id);
  revalidateBoutique({ reviews: true });
  return NextResponse.json({ ok: true });
}
