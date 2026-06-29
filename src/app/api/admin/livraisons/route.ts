import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { deliveryRunService } from '@/modules/livraison/services/delivery-run.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

const createSchema = z.object({
  courierId: z.string().min(1),
  orderIds: z.array(z.string().min(1)).min(1),
  notes: z.string().max(500).optional().nullable(),
  primesParCommande: z.record(z.string(), z.number().min(0)).optional(),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const tournees = await deliveryRunService.listerPourAdmin();
  return NextResponse.json({
    tournees: tournees.map((t) => ({
      id: t.id,
      label: t.label,
      statut: t.statut,
      assignedAt: t.assignedAt?.toISOString() ?? null,
      montantTotalGn: t.montantTotalGn != null ? Number(t.montantTotalGn) : null,
      montantEspecesGn: t.montantEspecesGn != null ? Number(t.montantEspecesGn) : null,
      courier: t.courier,
      commandes: t.commandes.map((c) => ({
        id: c.id,
        clientNom: c.clientNom,
        clientVille: c.clientVille,
        montantTotal: Number(c.montantTotal),
        statut: c.statut,
        ordreLivraison: c.ordreLivraison,
      })),
    })),
  });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: 'Données invalides' }, { status: 400 });
  }

  try {
    const tournee = await deliveryRunService.creerTournee(parsed.data);
    return NextResponse.json({ tournee }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Création impossible';
    return NextResponse.json({ message }, { status: 400 });
  }
}
