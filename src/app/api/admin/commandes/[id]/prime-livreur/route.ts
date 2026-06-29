import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { courierOrderService } from '@/modules/livraison/services/courier-order.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

type Params = Promise<{ id: string }>;

const schema = z.object({
  primeLivreurGn: z.number().min(0).nullable(),
});

/** PATCH /api/admin/commandes/[id]/prime-livreur */
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const { id } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: 'Montant invalide' }, { status: 400 });
  }

  try {
    const order = await courierOrderService.definirPrimeLivreur(id, parsed.data.primeLivreurGn);
    return NextResponse.json({
      ok: true,
      primeLivreurGn:
        order.primeLivreurGn != null ? Number(order.primeLivreurGn) : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Mise à jour impossible';
    return NextResponse.json({ message }, { status: 400 });
  }
}
