import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { trackingService } from '@/modules/livraison/services/tracking.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

const patchSchema = z.object({
  statut: z.enum([
    'EN_ATTENTE',
    'PAYEE',
    'EN_PREPARATION',
    'EXPEDIEE',
    'ANNULEE',
  ]),
  carrierId: z.string().nullable().optional(),
  numeroSuivi: z.string().nullable().optional(),
  message: z.string().optional(),
  notifier: z.boolean().optional(),
});

type Params = Promise<{ id: string }>;

/** PATCH /api/admin/commandes/[id] */
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  const order = await trackingService.mettreAJourStatut(id, parsed.data.statut, {
    carrierId: parsed.data.carrierId,
    numeroSuivi: parsed.data.numeroSuivi,
    message: parsed.data.message,
    notifier: parsed.data.notifier,
  });

  const suivi = await trackingService.obtenirSuiviParId(order.id);
  return NextResponse.json({ suivi });
}
