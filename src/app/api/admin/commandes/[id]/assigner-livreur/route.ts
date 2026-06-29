import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { courierOrderService } from '@/modules/livraison/services/courier-order.service';
import { adminUnauthorized, requireAdmin } from '@/modules/admin/lib/require-admin';

type Params = Promise<{ id: string }>;

const schema = z.object({
  courierId: z.string().min(1),
  primeLivreurGn: z.number().min(0).nullable().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Params }) {
  const admin = await requireAdmin();
  if (!admin) return adminUnauthorized();

  const { id } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: 'Livreur requis' }, { status: 400 });
  }

  try {
    const order = await courierOrderService.assignerLivreur(id, parsed.data.courierId, {
      primeLivreurGn: parsed.data.primeLivreurGn,
    });
    return NextResponse.json({ ok: true, orderId: order.id, statut: order.statut });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Assignation impossible';
    return NextResponse.json({ message }, { status: 400 });
  }
}
