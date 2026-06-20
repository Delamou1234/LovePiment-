import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '@/modules/commandes/services/order.service';
import { prisma } from '@/shared/lib/prisma';

/**
 * POST /api/webhook-cinetpay
 * Reçoit la notification de paiement de CinetPay et met à jour le statut de la commande.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.formData(); // CinetPay envoie en form-data
    const cpm_trans_id = body.get('cpm_trans_id') as string | null;
    const cpm_result = body.get('cpm_result') as string | null;

    if (!cpm_trans_id) {
      return NextResponse.json({ message: 'transaction_id manquant' }, { status: 400 });
    }

    // Trouver la commande par le transactionId CinetPay
    const commande = await prisma.order.findUnique({
      where: { cinetpayTxId: cpm_trans_id },
    });

    if (!commande) {
      console.warn(`[Webhook CinetPay] Commande introuvable pour tx: ${cpm_trans_id}`);
      return NextResponse.json({ message: 'Commande introuvable' }, { status: 404 });
    }

    // Mettre à jour selon le résultat
    if (cpm_result === '00') {
      // Paiement réussi
      await orderService.confirmerPaiement(commande.id, cpm_trans_id);
      console.log(`[Webhook CinetPay] ✅ Paiement confirmé pour commande ${commande.id}`);
    } else {
      // Paiement échoué
      await orderService.echecPaiement(commande.id);
      console.log(`[Webhook CinetPay] ❌ Paiement échoué pour commande ${commande.id}`);
    }

    return NextResponse.json({ message: 'OK' });
  } catch (error) {
    console.error('[Webhook CinetPay]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
