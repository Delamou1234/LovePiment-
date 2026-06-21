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
  private readonly baseUrl = 'https://api-checkout.cinetpay.com/v2';

  private getConfig(): { apiKey: string; siteId: string } | null {
    const apiKey = process.env.CINETPAY_API_KEY?.trim();
    const siteId = process.env.CINETPAY_SITE_ID?.trim();
    if (!apiKey || !siteId) return null;
    return { apiKey, siteId };
  }

  isConfigured(): boolean {
    return this.getConfig() !== null;
  }

  async initierPaiement(params: InitierPaiementParams): Promise<InitierPaiementResult> {
    const config = this.getConfig();
    if (!config) {
      return {
        success: false,
        error:
          'Paiement en ligne non configuré (CINETPAY_API_KEY / CINETPAY_SITE_ID manquants). Choisissez « Paiement à la livraison ».',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey: config.apiKey,
          site_id: config.siteId,
          transaction_id: params.transactionId,
          amount: params.montant,
          currency: 'GNF',
          description: params.description,
          customer_name: params.clientNom,
          customer_phone_number: params.clientTelephone,
          return_url: params.returnUrl,
          notify_url: params.notifyUrl,
          channels: 'ALL',
          lang: 'fr',
        }),
      });

      const data = (await response.json()) as {
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
    const config = this.getConfig();
    if (!config) {
      return { success: false, statut: 'ECHOUEE', error: 'CinetPay non configuré' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/payment/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey: config.apiKey,
          site_id: config.siteId,
          transaction_id: params.transactionId,
        }),
      });

      const data = (await response.json()) as {
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
    return true;
  }
}
