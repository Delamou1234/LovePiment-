import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { contactService } from '@/modules/contact/services/contact.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

const patchSchema = z.object({
  statut: z.enum(['NOUVEAU', 'LU', 'TRAITE']),
});

/** PATCH /api/admin/contact/[id] */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: 'Statut invalide' }, { status: 400 });
  }

  const updated = await contactService.mettreAJourStatut(id, parsed.data.statut);
  if (!updated) {
    return NextResponse.json({ message: 'Message introuvable' }, { status: 404 });
  }

  return NextResponse.json({ message: updated });
}
