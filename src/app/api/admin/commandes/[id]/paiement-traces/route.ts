import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, adminUnauthorized } from '@/modules/admin/lib/require-admin';
import { listerTracesPaiement } from '@/modules/paiement/services/payment-trace.service';

/** GET /api/admin/commandes/[id]/paiement-traces */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin();
  if (!user) return adminUnauthorized();

  const { id } = await params;
  const traces = await listerTracesPaiement(id);

  return NextResponse.json({
    traces: traces.map((t) => ({
      id: t.id,
      action: t.action,
      telephoneContact: t.telephoneContact,
      telephonePaiement: t.telephonePaiement,
      paymentOrderId: t.paymentOrderId,
      statut: t.statut,
      details: t.details,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}
