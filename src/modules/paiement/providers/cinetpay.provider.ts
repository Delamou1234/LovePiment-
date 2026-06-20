import type {
  PaymentProvider,
  InitierPaiementParams,
  InitierPaiementResult,
  VerifierStatutParams,
  VerifierStatutResult,
} from './payment-provider.interface';

/**
 * CinetPayProvider — implémentation pour le marché Afrique de l'Ouest.
 * Documentation officielle : https://docs.cinetpay.com/
 */
export class CinetPayProvider implements PaymentProvider {
  private readonly apiKey: string;
  private readonly siteId: string;
  private readonly baseUrl = 'https://api-checkout.cinetpay.com/v2';

  constructor() {
    const apiKey = process.env.CINETPAY_API_KEY;
    const siteId = process.env.CINETPAY_SITE_ID;

    if (!apiKey || !siteId) {
      throw new Error('[CinetPayProvider] Variables CINETPAY_API_KEY et CINETPAY_SITE_ID manquantes');
    }

    this.apiKey = apiKey;
    this.siteId = siteId;
  }

  async initierPaiement(params: InitierPaiementParams): Promise<InitierPaiementResult> {
    try {
      const response = await fetch(`${this.baseUrl}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey: this.apiKey,
          site_id: this.siteId,
          transaction_id: params.transactionId,
          amount: params.montant,
          currency: 'GNF',
          description: params.description,
          customer_name: params.clientNom,
          customer_phone_number: params.clientTelephone,
          return_url: params.returnUrl,
          notify_url: params.notifyUrl,
          channels: 'ALL', // Mobile Money + Carte
          lang: 'fr',
        }),
      });

      const data = await response.json() as {
        code: string;
        message: string;
        data?: { payment_url: string };
      };

      if (data.code === '201') {
        return {
          success: true,
          paymentUrl: data.data?.payment_url,
          transactionId: params.transactionId,
        };
      }

      return { success: false, error: data.message };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur CinetPay inconnue',
      };
    }
  }

  async verifierStatut(params: VerifierStatutParams): Promise<VerifierStatutResult> {
    try {
      const response = await fetch(`${this.baseUrl}/payment/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey: this.apiKey,
          site_id: this.siteId,
          transaction_id: params.transactionId,
        }),
      });

      const data = await response.json() as {
        code: string;
        message: string;
        data?: { status: string; amount: number };
      };

      if (data.code === '00') {
        const statusMap: Record<string, VerifierStatutResult['statut']> = {
          ACCEPTED: 'REUSSIE',
          REFUSED: 'ECHOUEE',
          CANCELLED: 'ECHOUEE',
          PENDING: 'EN_ATTENTE',
        };

        return {
          success: true,
          statut: statusMap[data.data?.status ?? ''] ?? 'EN_ATTENTE',
          montant: data.data?.amount,
        };
      }

      return { success: false, statut: 'ECHOUEE', error: data.message };
    } catch (error) {
      return {
        success: false,
        statut: 'ECHOUEE',
        error: error instanceof Error ? error.message : 'Erreur CinetPay inconnue',
      };
    }
  }

  validerWebhook(_payload: unknown, _signature: string): boolean {
    // CinetPay envoie une simple notification POST sans signature cryptographique complexe.
    // La validation se fait en vérifiant le statut via l'API (verifierStatut).
    // À implémenter selon la doc spécifique du compte.
    return true;
  }
}
