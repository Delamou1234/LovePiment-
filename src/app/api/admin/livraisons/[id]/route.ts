import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { deliveryRunService } from '@/modules/livraison/services/delivery-run.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

type Params = Promise<{ id: string }>;

const addSchema = z.object({
  orderIds: z.array(z.string().min(1)).min(1),
});

const patchSchema = z.object({
  montantTotalGn: z.number().min(0).optional(),
  montantEspecesGn: z.number().min(0).optional(),
});
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const { id } = await params;
  const tournee = await deliveryRunService.obtenirPourAdmin(id);
  if (!tournee) {
    return NextResponse.json({ message: 'Tournée introuvable' }, { status: 404 });
  }

  return NextResponse.json({ tournee });
}

export async function POST(request: NextRequest, { params }: { params: Params }) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const { id } = await params;
  const parsed = addSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: 'Commandes requises' }, { status: 400 });
  }

  try {
    const tournee = await deliveryRunService.ajouterCommandes(id, parsed.data.orderIds);
    return NextResponse.json({ tournee });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ajout impossible';
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: 'Montants invalides' }, { status: 400 });
  }

  try {
    const tournee = await deliveryRunService.mettreAJourMontants(id, parsed.data);
    return NextResponse.json({ tournee });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Mise à jour impossible';
    return NextResponse.json({ message }, { status: 400 });
  }
}
