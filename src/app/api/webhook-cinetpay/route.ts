import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '@/modules/commandes/services/order.service';
import { paymentService } from '@/modules/paiement/services/payment.service';
import { CinetPayProvider } from '@/modules/paiement/providers/cinetpay.provider';
import { parseCinetpayFormData } from '@/shared/lib/cinetpay-hmac';
import { enforceRateLimit } from '@/shared/lib/security/enforce-rate-limit';
import { prisma } from '@/shared/lib/prisma';

const cinetpay = new CinetPayProvider();

/**
 * POST /api/webhook-cinetpay
 * Notification serveur CinetPay (form-data + header x-token HMAC).
 */
export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'webhook');
    if (limited) return limited;

    const body = await request.formData();
    const fields = parseCinetpayFormData(body);
    const cpm_trans_id = fields.cpm_trans_id;
    const cpm_result = fields.cpm_result;
    const cpm_amount = fields.cpm_amount;
    const receivedToken = request.headers.get('x-token');

    if (!cpm_trans_id) {
      return NextResponse.json({ message: 'transaction_id manquant' }, { status: 400 });
    }

    if (!paymentService.validerWebhook(fields, receivedToken ?? '')) {
      console.warn('[Webhook CinetPay] Token HMAC invalide ou secret manquant');
      return NextResponse.json({ message: 'Signature invalide' }, { status: 403 });
    }

    const commande = await prisma.order.findUnique({
      where: { cinetpayTxId: cpm_trans_id },
    });

    if (!commande) {
      console.warn(`[Webhook CinetPay] Commande introuvable pour tx: ${cpm_trans_id}`);
      return NextResponse.json({ message: 'OK' });
    }

    if (
      cpm_amount != null &&
      !cinetpay.montantNotificationValide(cpm_amount, Number(commande.montantTotal))
    ) {
      console.warn(
        `[Webhook CinetPay] Montant incohérent tx=${cpm_trans_id} notif=${cpm_amount} cmd=${commande.montantTotal}`,
      );
      return NextResponse.json({ message: 'Montant invalide' }, { status: 400 });
    }

    if (cpm_result === '00') {
      if (commande.statutPaiement === 'REUSSIE') {
        return NextResponse.json({ message: 'OK' });
      }

      const verification = await cinetpay.verifierStatut({ transactionId: cpm_trans_id });
      if (verification.success && verification.statut === 'REUSSIE') {
        await orderService.confirmerPaiement(commande.id, cpm_trans_id);
        console.log(`[Webhook CinetPay] Paiement confirmé pour commande ${commande.id}`);
      } else {
        console.warn(`[Webhook CinetPay] Statut API non confirmé pour ${commande.id}`);
        return NextResponse.json({ message: 'Paiement non confirmé' }, { status: 409 });
      }
    } else if (commande.statutPaiement !== 'REUSSIE') {
      await orderService.echecPaiement(commande.id);
      console.log(`[Webhook CinetPay] Paiement échoué pour commande ${commande.id}`);
    }

    return NextResponse.json({ message: 'OK' });
  } catch (error) {
    console.error('[Webhook CinetPay]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
