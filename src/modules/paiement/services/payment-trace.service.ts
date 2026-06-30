import { prisma } from '@/shared/lib/prisma';

export type PaymentTraceAction =
  | 'INITIATION'
  | 'RETRY'
  | 'WEBHOOK_SUCCESS'
  | 'WEBHOOK_FAILED'
  | 'SYNC_SUCCESS'
  | 'SYNC_FAILED';

export async function enregistrerTracePaiement(data: {
  orderId: string;
  action: PaymentTraceAction;
  telephoneContact: string | null;
  telephonePaiement: string;
  paymentOrderId?: string | null;
  statut?: string | null;
  details?: Record<string, unknown> | null;
}): Promise<void> {
  await prisma.paymentTrace.create({
    data: {
      orderId: data.orderId,
      action: data.action,
      telephoneContact: data.telephoneContact,
      telephonePaiement: data.telephonePaiement,
      paymentOrderId: data.paymentOrderId ?? null,
      statut: data.statut ?? null,
      details: data.details ?? undefined,
    },
  });
}

export async function listerTracesPaiement(orderId: string, limit = 20) {
  return prisma.paymentTrace.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
