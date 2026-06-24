import { CinetPayProvider } from '../providers/cinetpay.provider';
import type { PaymentProvider } from '../providers/payment-provider.interface';
import { orderService } from '@/modules/commandes/services/order.service';
import { randomUUID } from 'crypto';

export class PaymentService {
  private readonly provider: PaymentProvider;

  constructor(provider?: PaymentProvider) {
    // Injection de dépendance — implémentation interchangeable (tests, providers)
    this.provider = provider ?? new CinetPayProvider();
  }

  async initierPaiementCommande(
    commandeId: string,
    clientEmail?: string,
  ): Promise<{ paymentUrl: string }> {
    const commande = await orderService.obtenirCommande(commandeId);
    const transactionId = randomUUID();

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const email =
      clientEmail?.trim() ||
      `commande+${commande.id.slice(0, 8)}@lovepiment.local`;

    if (/localhost|127\.0\.0\.1/i.test(appUrl)) {
      throw new Error(
        'Paiement CinetPay indisponible en local (URL publique requise). Choisissez « Paiement à la livraison » ou configurez NEXT_PUBLIC_APP_URL (ex. ngrok).',
      );
    }

    const result = await this.provider.initierPaiement({
      transactionId,
      montant: Number(commande.montantTotal),
      description: `Commande Love Piment& #${commande.id.slice(0, 8)}`,
      clientNom: commande.clientNom,
      clientTelephone: commande.clientTelephone,
      clientEmail: email,
      clientAdresse: commande.clientAdresse,
      clientVille: commande.clientVille,
      returnUrl: `${appUrl}/commande/confirmation?id=${commandeId}`,
      notifyUrl: `${appUrl}/api/webhook-cinetpay`,
    });

    if (!result.success || !result.paymentUrl) {
      throw new Error(result.error ?? 'Impossible d\'initier le paiement CinetPay');
    }

    // Sauvegarder le transactionId CinetPay (paiement encore en attente)
    await orderService.enregistrerTransactionCinetPay(commandeId, transactionId);

    return { paymentUrl: result.paymentUrl };
  }

  async traiterWebhook(transactionId: string): Promise<void> {
    const verification = await this.provider.verifierStatut({ transactionId });

    if (!verification.success) {
      throw new Error(verification.error ?? 'Erreur de vérification du paiement');
    }

    // Trouver la commande par transactionId et mettre à jour le statut
    // (la recherche par cinetpayTxId est gérée dans le OrderRepository)
    if (verification.statut === 'REUSSIE') {
      // La mise à jour sera faite depuis la route webhook avec l'ID commande
    }
  }

  validerWebhook(payload: unknown, signature: string): boolean {
    return this.provider.validerWebhook(payload, signature);
  }
}

export const paymentService = new PaymentService();
