import { OrangeMoneyProvider } from '../providers/orange-money.provider';
import type { PaymentProvider } from '../providers/payment-provider.interface';
import { orderService } from '@/modules/commandes/services/order.service';
import { diagnostiquerOrangeMoney, getAppUrlPaiement } from '@/shared/lib/orange-money-config';
import { normaliserTelephoneGuinee } from '@/shared/lib/phone-guinea';
import { enregistrerTracePaiement } from '@/modules/paiement/services/payment-trace.service';
import { randomUUID } from 'crypto';

export type StatutPaiementCommande = {
  statutPaiement: string;
  statutCommande: string;
  paye: boolean;
};

function resoudreTelephonePaiement(
  commande: { clientTelephone: string; paymentTelephone?: string | null },
  override?: string | null,
): string {
  const brut = override?.trim() || commande.paymentTelephone?.trim() || commande.clientTelephone;
  return normaliserTelephoneGuinee(brut) ?? brut.trim();
}

export class PaymentService {
  private readonly provider: PaymentProvider;

  constructor(provider?: PaymentProvider) {
    this.provider = provider ?? new OrangeMoneyProvider();
  }

  diagnostiquer() {
    return diagnostiquerOrangeMoney();
  }

  private async initierSession(
    commandeId: string,
    options: { telephonePaiement?: string | null; action: 'INITIATION' | 'RETRY' } = {
      action: 'INITIATION',
    },
  ): Promise<{ paymentUrl: string }> {
    const diag = diagnostiquerOrangeMoney();
    if (!diag.pret) {
      throw new Error(
        `Configuration Orange Money incomplète : ${diag.manques.join(', ')}`,
      );
    }

    const commande = await orderService.obtenirCommande(commandeId);
    if (commande.statut === 'ANNULEE') {
      throw new Error('Cette commande est annulée.');
    }
    if (commande.statutPaiement === 'REUSSIE') {
      throw new Error('Cette commande est déjà payée.');
    }

    const telephonePaiement = resoudreTelephonePaiement(commande, options.telephonePaiement);
    if (!normaliserTelephoneGuinee(telephonePaiement)) {
      throw new Error('Numéro Orange Money invalide. Utilisez un numéro guinéen (ex. 620 00 00 00).');
    }

    const paymentOrderId = randomUUID();
    const appUrl = getAppUrlPaiement();

    const result = await this.provider.initierPaiement({
      transactionId: paymentOrderId,
      montant: Number(commande.montantTotal),
      description: `Commande Love Piment #${commande.id.slice(0, 8)}`,
      clientNom: commande.clientNom,
      clientTelephone: commande.clientTelephone,
      telephonePaiement,
      clientEmail: `commande+${commande.id.slice(0, 8)}@lovepiment.local`,
      clientAdresse: commande.clientAdresse,
      clientVille: commande.clientVille,
      returnUrl: `${appUrl}/commande/confirmation?id=${commandeId}`,
      notifyUrl: `${appUrl}/api/webhook-orange-money`,
    });

    if (!result.success || !result.paymentUrl || !result.payToken || !result.notifToken) {
      throw new Error(result.error ?? 'Impossible d\'initier le paiement Orange Money');
    }

    await orderService.enregistrerSessionPaiement(commandeId, {
      paymentOrderId,
      paymentPayToken: result.payToken,
      paymentNotifToken: result.notifToken,
      paymentTelephone: telephonePaiement,
    });

    await enregistrerTracePaiement({
      orderId: commandeId,
      action: options.action,
      telephoneContact: commande.clientTelephone,
      telephonePaiement,
      paymentOrderId,
      statut: 'EN_ATTENTE',
    });

    return { paymentUrl: result.paymentUrl };
  }

  async initierPaiementCommande(commandeId: string): Promise<{ paymentUrl: string }> {
    return this.initierSession(commandeId, { action: 'INITIATION' });
  }

  async relancerPaiementCommande(
    commandeId: string,
    telephonePaiement?: string | null,
  ): Promise<{ paymentUrl: string }> {
    return this.initierSession(commandeId, { telephonePaiement, action: 'RETRY' });
  }

  async synchroniserPaiementCommande(commandeId: string): Promise<StatutPaiementCommande> {
    const commande = await orderService.obtenirCommande(commandeId);

    if (commande.statutPaiement === 'REUSSIE') {
      return {
        statutPaiement: commande.statutPaiement,
        statutCommande: commande.statut,
        paye: true,
      };
    }

    if (!commande.paymentOrderId || !commande.paymentPayToken) {
      return {
        statutPaiement: commande.statutPaiement,
        statutCommande: commande.statut,
        paye: false,
      };
    }

    const verification = await this.provider.verifierStatut({
      transactionId: commande.paymentOrderId,
      payToken: commande.paymentPayToken,
      montant: Number(commande.montantTotal),
    });

    const telPaiement =
      commande.paymentTelephone ?? commande.clientTelephone;

    if (verification.success && verification.statut === 'REUSSIE') {
      await orderService.confirmerPaiement(commandeId, commande.paymentOrderId);
      await enregistrerTracePaiement({
        orderId: commandeId,
        action: 'SYNC_SUCCESS',
        telephoneContact: commande.clientTelephone,
        telephonePaiement: telPaiement,
        paymentOrderId: commande.paymentOrderId,
        statut: 'REUSSIE',
      });
      return { statutPaiement: 'REUSSIE', statutCommande: 'PAYEE', paye: true };
    }

    if (verification.success && verification.statut === 'ECHOUEE') {
      await orderService.marquerPaiementEchoue(commandeId);
      await enregistrerTracePaiement({
        orderId: commandeId,
        action: 'SYNC_FAILED',
        telephoneContact: commande.clientTelephone,
        telephonePaiement: telPaiement,
        paymentOrderId: commande.paymentOrderId,
        statut: 'ECHOUEE',
      });
      return { statutPaiement: 'ECHOUEE', statutCommande: commande.statut, paye: false };
    }

    return {
      statutPaiement: commande.statutPaiement,
      statutCommande: commande.statut,
      paye: false,
    };
  }

  async verifierPaiementCommande(
    paymentOrderId: string,
    payToken: string,
    montant: number,
  ): Promise<VerifierStatutResult> {
    return this.provider.verifierStatut({
      transactionId: paymentOrderId,
      payToken,
      montant,
    });
  }

  validerWebhook(payload: unknown, notifTokenAttendu: string): boolean {
    return this.provider.validerWebhook(payload, notifTokenAttendu);
  }
}

type VerifierStatutResult = Awaited<ReturnType<PaymentProvider['verifierStatut']>>;

export const paymentService = new PaymentService();
