/**
 * Configuration Orange Money Web Payment (Guinée).
 * Documentation : https://developer.orange.com/apis/om-webpay
 */

export type OrangeMoneyConfig = {
  clientId: string;
  clientSecret: string;
  merchantKey: string;
  /** Segment d'URL pays : `gn` (prod Guinée) ou `dev` (sandbox). */
  countryCode: string;
  apiBaseUrl: string;
};

export type OrangeMoneyConfigStatus = {
  pret: boolean;
  manques: string[];
  countryCode: string;
  appUrl: string | null;
  appUrlValide: boolean;
};

export function getOrangeMoneyConfig(): OrangeMoneyConfig | null {
  const clientId = process.env.ORANGE_MONEY_CLIENT_ID?.trim();
  const clientSecret = process.env.ORANGE_MONEY_CLIENT_SECRET?.trim();
  const merchantKey = process.env.ORANGE_MONEY_MERCHANT_KEY?.trim();
  if (!clientId || !clientSecret || !merchantKey) return null;

  return {
    clientId,
    clientSecret,
    merchantKey,
    countryCode: process.env.ORANGE_MONEY_COUNTRY_CODE?.trim() || 'gn',
    apiBaseUrl: (process.env.ORANGE_MONEY_API_BASE_URL?.trim() || 'https://api.orange.com').replace(
      /\/$/,
      '',
    ),
  };
}

export function orangeMoneyWebpayPath(config: OrangeMoneyConfig, suffix: string): string {
  return `${config.apiBaseUrl}/orange-money-webpay/${config.countryCode}/v1/${suffix}`;
}

export function getAppUrlPaiement(): string {
  const url = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim().replace(/\/$/, '');
  if (!url) {
    throw new Error('NEXT_PUBLIC_APP_URL est manquant dans la configuration.');
  }
  if (/localhost|127\.0\.0\.1/i.test(url)) {
    throw new Error(
      'Paiement Orange Money indisponible en local. Utilisez une URL publique HTTPS (ex. ngrok) ou déployez en production.',
    );
  }
  if (!/^https:\/\//i.test(url)) {
    throw new Error('NEXT_PUBLIC_APP_URL doit commencer par https:// pour Orange Money.');
  }
  return url;
}

export function diagnostiquerOrangeMoney(): OrangeMoneyConfigStatus {
  const manques: string[] = [];
  if (!process.env.ORANGE_MONEY_CLIENT_ID?.trim()) manques.push('ORANGE_MONEY_CLIENT_ID');
  if (!process.env.ORANGE_MONEY_CLIENT_SECRET?.trim()) manques.push('ORANGE_MONEY_CLIENT_SECRET');
  if (!process.env.ORANGE_MONEY_MERCHANT_KEY?.trim()) manques.push('ORANGE_MONEY_MERCHANT_KEY');

  const rawUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim().replace(/\/$/, '');
  let appUrlValide = false;
  if (!rawUrl) {
    manques.push('NEXT_PUBLIC_APP_URL');
  } else if (/localhost|127\.0\.0\.1/i.test(rawUrl)) {
    manques.push('NEXT_PUBLIC_APP_URL (doit être une URL publique HTTPS, pas localhost)');
  } else if (!/^https:\/\//i.test(rawUrl)) {
    manques.push('NEXT_PUBLIC_APP_URL (doit être en HTTPS)');
  } else {
    appUrlValide = true;
  }

  return {
    pret: manques.length === 0,
    manques,
    countryCode: process.env.ORANGE_MONEY_COUNTRY_CODE?.trim() || 'gn',
    appUrl: rawUrl || null,
    appUrlValide,
  };
}
