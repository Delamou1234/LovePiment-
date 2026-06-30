import { NextRequest, NextResponse } from 'next/server';
import { orderService } from '@/modules/commandes/services/order.service';
import { paymentService } from '@/modules/paiement/services/payment.service';
import { OrangeMoneyProvider } from '@/modules/paiement/providers/orange-money.provider';
import { extraireChampsWebhook } from '@/shared/lib/orange-money-webhook';
import { enforceRateLimit } from '@/shared/lib/security/enforce-rate-limit';
import { enregistrerTracePaiement } from '@/modules/paiement/services/payment-trace.service';
import { normaliserTelephoneGuinee } from '@/shared/lib/phone-guinea';

const orangeMoney = new OrangeMoneyProvider();

/**
 * POST /api/webhook-orange-money
 * Notification serveur Orange Money Web Payment (JSON).
 */
export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, 'webhook');
    if (limited) return limited;

    const payload: unknown = await request.json();
    const fields = extraireChampsWebhook(payload);
    const paymentOrderId = fields?.order_id?.trim() ?? '';

    if (!paymentOrderId) {
      return NextResponse.json({ message: 'order_id manquant' }, { status: 400 });
    }

    const commande = await prisma.order.findUnique({
      where: { paymentOrderId },
    });

    if (!commande) {
      console.warn(`[Webhook Orange Money] Commande introuvable pour order_id: ${paymentOrderId}`);
      return NextResponse.json({ message: 'OK' });
    }

    if (!commande.paymentNotifToken) {
      console.warn(`[Webhook Orange Money] notif_token absent en base pour ${commande.id}`);
      return NextResponse.json({ message: 'Session invalide' }, { status: 403 });
    }

    if (!paymentService.validerWebhook(payload, commande.paymentNotifToken)) {
      console.warn('[Webhook Orange Money] notif_token invalide');
      return NextResponse.json({ message: 'Token invalide' }, { status: 403 });
    }

    const amount = fields?.amount;
    if (
      amount != null &&
      !orangeMoney.montantNotificationValide(amount, Number(commande.montantTotal))
    ) {
      console.warn(
        `[Webhook Orange Money] Montant incohérent order_id=${paymentOrderId} notif=${String(amount)} cmd=${commande.montantTotal}`,
      );
      return NextResponse.json({ message: 'Montant invalide' }, { status: 400 });
    }

    const reponse = NextResponse.json({ message: 'OK' });
    const telPaiementDeclare =
      commande.paymentTelephone ?? commande.clientTelephone;
    const telOrange = fields?.subscriber_msisdn
      ? normaliserTelephoneGuinee(fields.subscriber_msisdn) ?? fields.subscriber_msisdn
      : null;

    if (orangeMoney.estPaiementReussi(payload)) {
      if (commande.statutPaiement === 'REUSSIE') {
        return reponse;
      }

      if (!commande.paymentPayToken) {
        console.warn(`[Webhook Orange Money] pay_token manquant pour ${commande.id}`);
        return NextResponse.json({ message: 'Session invalide' }, { status: 403 });
      }

      const verification = await paymentService.verifierPaiementCommande(
        paymentOrderId,
        commande.paymentPayToken,
        Number(commande.montantTotal),
      );

      if (verification.success && verification.statut === 'REUSSIE') {
        await orderService.confirmerPaiement(commande.id, paymentOrderId);
        await enregistrerTracePaiement({
          orderId: commande.id,
          action: 'WEBHOOK_SUCCESS',
          telephoneContact: commande.clientTelephone,
          telephonePaiement: telOrange ?? telPaiementDeclare,
          paymentOrderId,
          statut: 'REUSSIE',
          details: telOrange && telOrange !== telPaiementDeclare
            ? { declare: telPaiementDeclare, confirmeOrange: telOrange }
            : undefined,
        });
        console.log(`[Webhook Orange Money] Paiement confirmé pour commande ${commande.id}`);
      } else {
        console.warn(`[Webhook Orange Money] Statut API non confirmé pour ${commande.id}`);
      }
    } else if (
      commande.statutPaiement !== 'REUSSIE' &&
      orangeMoney.estPaiementEchoue(payload)
    ) {
      await orderService.marquerPaiementEchoue(commande.id);
      await enregistrerTracePaiement({
        orderId: commande.id,
        action: 'WEBHOOK_FAILED',
        telephoneContact: commande.clientTelephone,
        telephonePaiement: telOrange ?? telPaiementDeclare,
        paymentOrderId,
        statut: fields?.status ?? 'ECHOUEE',
      });
      console.log(`[Webhook Orange Money] Paiement échoué pour commande ${commande.id}`);
    }

    return reponse;
  } catch (error) {
    console.error('[Webhook Orange Money]', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
