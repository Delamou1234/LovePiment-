import {
  getOrangeMoneyConfig,
  orangeMoneyWebpayPath,
  type OrangeMoneyConfig,
} from '@/shared/lib/orange-money-config';
import { extraireChampsWebhook } from '@/shared/lib/orange-money-webhook';
import { msisdnOrangeGuinee } from '@/shared/lib/phone-guinea';
import type {
  PaymentProvider,
  InitierPaiementParams,
  InitierPaiementResult,
  VerifierStatutParams,
  VerifierStatutResult,
} from './payment-provider.interface';

type TokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type WebPaymentBody = {
  status?: number | string;
  message?: string;
  pay_token?: string;
  payment_url?: string;
  notif_token?: string;
  data?: WebPaymentBody;
};

type TransactionStatusBody = {
  status?: string;
  message?: string;
  data?: TransactionStatusBody;
};

function extraireCorps<T extends Record<string, unknown>>(data: T): T {
  const imbrique = data.data;
  if (imbrique && typeof imbrique === 'object') {
    return { ...data, ...(imbrique as T) };
  }
  return data;
}

function estReponsePaiementValide(data: WebPaymentBody): boolean {
  const corps = extraireCorps(data);
  return Boolean(corps.payment_url && corps.pay_token && corps.notif_token);
}

export class OrangeMoneyProvider implements PaymentProvider {
  isConfigured(): boolean {
    return getOrangeMoneyConfig() !== null;
  }

  private getBasicAuth(config: OrangeMoneyConfig): string {
    return Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  }

  async obtenirAccessToken(config: OrangeMoneyConfig): Promise<string> {
    const response = await fetch(`${config.apiBaseUrl}/oauth/v3/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${this.getBasicAuth(config)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: 'grant_type=client_credentials',
    });

    const data = (await response.json()) as TokenResponse;
    if (!response.ok || !data.access_token) {
      const detail = data.error_description ?? data.error ?? 'Token OAuth indisponible';
      throw new Error(`Orange Money OAuth : ${detail}`);
    }
    return data.access_token;
  }

  async initierPaiement(params: InitierPaiementParams): Promise<InitierPaiementResult> {
    const config = getOrangeMoneyConfig();
    if (!config) {
      return {
        success: false,
        error:
          'Paiement Orange Money non configuré. Renseignez ORANGE_MONEY_CLIENT_ID, CLIENT_SECRET et MERCHANT_KEY.',
      };
    }

    try {
      const accessToken = await this.obtenirAccessToken(config);
      const montant = Math.max(100, Math.round(params.montant));
      const cancelUrl = params.returnUrl.includes('?')
        ? `${params.returnUrl}&cancel=1`
        : `${params.returnUrl}?cancel=1`;

      const telephonePaiement = params.telephonePaiement ?? params.clientTelephone;
      const msisdn = msisdnOrangeGuinee(telephonePaiement);
      const corps: Record<string, unknown> = {
        merchant_key: config.merchantKey,
        currency: 'GNF',
        order_id: params.transactionId,
        amount: montant,
        return_url: params.returnUrl,
        cancel_url: cancelUrl,
        notif_url: params.notifyUrl,
        lang: 'fr',
        reference: params.description.slice(0, 30),
      };
      if (msisdn) {
        corps.subscriber_msisdn = msisdn;
        corps.subscriberMsisdn = msisdn;
      }

      const response = await fetch(orangeMoneyWebpayPath(config, 'webpayment'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(corps),
      });

      const data = extraireCorps((await response.json()) as WebPaymentBody);
      const httpOk = response.ok || data.status === 201 || data.status === '201';

      if (httpOk && estReponsePaiementValide(data)) {
        return {
          success: true,
          paymentUrl: data.payment_url,
          transactionId: params.transactionId,
          payToken: data.pay_token,
          notifToken: data.notif_token,
        };
      }

      const error = data.message?.trim() || `Erreur Orange Money (HTTP ${response.status})`;
      return { success: false, error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur Orange Money inconnue',
      };
    }
  }

  async verifierStatut(params: VerifierStatutParams): Promise<VerifierStatutResult> {
    const config = getOrangeMoneyConfig();
    if (!config) {
      return { success: false, statut: 'ECHOUEE', error: 'Orange Money non configuré' };
    }
    if (!params.payToken) {
      return { success: false, statut: 'ECHOUEE', error: 'pay_token manquant' };
    }

    try {
      const accessToken = await this.obtenirAccessToken(config);
      const response = await fetch(orangeMoneyWebpayPath(config, 'transactionstatus'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          order_id: params.transactionId,
          amount: params.montant != null ? Math.round(params.montant) : undefined,
          pay_token: params.payToken,
        }),
      });

      const data = extraireCorps((await response.json()) as TransactionStatusBody);
      const statusMap: Record<string, VerifierStatutResult['statut']> = {
        SUCCESS: 'REUSSIE',
        FAILED: 'ECHOUEE',
        EXPIRED: 'ECHOUEE',
        PENDING: 'EN_ATTENTE',
      };

      if (data.status) {
        return {
          success: true,
          statut: statusMap[data.status.toUpperCase()] ?? 'EN_ATTENTE',
        };
      }

      return {
        success: false,
        statut: 'ECHOUEE',
        error: data.message ?? `Statut Orange Money indisponible (HTTP ${response.status})`,
      };
    } catch (error) {
      return {
        success: false,
        statut: 'ECHOUEE',
        error: error instanceof Error ? error.message : 'Erreur Orange Money inconnue',
      };
    }
  }

  validerWebhook(payload: unknown, notifTokenAttendu: string): boolean {
    const fields = extraireChampsWebhook(payload);
    const recu = fields?.notif_token?.trim();
    const attendu = notifTokenAttendu.trim();
    return Boolean(recu && attendu && recu === attendu);
  }

  montantNotificationValide(montantNotifie: string | number, montantCommande: number): boolean {
    const notifie = Math.round(Number(montantNotifie));
    const attendu = Math.round(montantCommande);
    return Number.isFinite(notifie) && notifie === attendu;
  }

  estPaiementReussi(payload: unknown): boolean {
    const status = extraireChampsWebhook(payload)?.status?.toUpperCase();
    return status === 'SUCCESS';
  }

  estPaiementEchoue(payload: unknown): boolean {
    const status = extraireChampsWebhook(payload)?.status?.toUpperCase();
    return status === 'FAILED' || status === 'EXPIRED' || status === 'CANCELLED';
  }

  extraireOrderId(payload: unknown): string | null {
    return extraireChampsWebhook(payload)?.order_id ?? null;
  }

  extraireMontant(payload: unknown): string | number | null {
    return extraireChampsWebhook(payload)?.amount ?? null;
  }
}
