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
function normaliserTelephoneCinetPay(telephone: string): string {
  const chiffres = telephone.replace(/\D/g, '');
  if (chiffres.startsWith('224')) return chiffres;
  if (chiffres.startsWith('0')) return `224${chiffres.slice(1)}`;
  return chiffres.length >= 9 ? `224${chiffres}` : chiffres;
}

function decouperNomComplet(nomComplet: string): { prenom: string; nom: string } {
  const parties = nomComplet.trim().split(/\s+/).filter(Boolean);
  if (parties.length === 0) return { prenom: 'Client', nom: 'KabiShop' };
  if (parties.length === 1) return { prenom: parties[0], nom: parties[0] };
  return { prenom: parties[0], nom: parties.slice(1).join(' ') };
}

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
      const { prenom, nom } = decouperNomComplet(params.clientNom);
      const montant = Math.max(100, Math.round(params.montant));

      const response = await fetch(`${this.baseUrl}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey: config.apiKey,
          site_id: config.siteId,
          transaction_id: params.transactionId,
          amount: montant,
          currency: 'GNF',
          description: params.description,
          customer_name: nom,
          customer_surname: prenom,
          customer_email: params.clientEmail,
          customer_phone_number: normaliserTelephoneCinetPay(params.clientTelephone),
          customer_address: params.clientAdresse,
          customer_city: params.clientVille,
          customer_country: 'GN',
          customer_zip_code: '00000',
          return_url: params.returnUrl,
          notify_url: params.notifyUrl,
          channels: 'MOBILE_MONEY',
          lang: 'fr',
        }),
      });

      const data = (await response.json()) as {
        code: string;
        message: string;
        description?: string;
        data?: { payment_url: string };
      };

      if (data.code === '201') {
        return {
          success: true,
          paymentUrl: data.data?.payment_url,
          transactionId: params.transactionId,
        };
      }

      const detail = data.description?.trim();
      const error = detail ? `${data.message}: ${detail}` : data.message;
      return { success: false, error };
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
