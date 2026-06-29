import { createHmac, timingSafeEqual } from 'crypto';

/** Champs concaténés dans l'ordre officiel CinetPay pour le token HMAC. */
const HMAC_FIELD_ORDER = [
  'cpm_site_id',
  'cpm_trans_id',
  'cpm_trans_date',
  'cpm_amount',
  'cpm_currency',
  'signature',
  'payment_method',
  'cel_phone_num',
  'cpm_phone_prefixe',
  'cpm_language',
  'cpm_version',
  'cpm_payment_config',
  'cpm_page_action',
  'cpm_custom',
  'cpm_designation',
  'cpm_error_message',
] as const;

export type CinetpayNotificationFields = Partial<
  Record<(typeof HMAC_FIELD_ORDER)[number] | 'cpm_result', string>
>;

function formValue(fields: CinetpayNotificationFields, key: string): string {
  const v = fields[key as keyof CinetpayNotificationFields];
  return v == null ? '' : String(v);
}

/** Construit la chaîne à signer selon la doc CinetPay HMAC. */
export function buildCinetpayHmacPayload(fields: CinetpayNotificationFields): string {
  return HMAC_FIELD_ORDER.map((key) => formValue(fields, key)).join('');
}

/** Génère le token HMAC-SHA256 attendu par CinetPay. */
export function generateCinetpayHmacToken(
  fields: CinetpayNotificationFields,
  secretKey: string,
): string {
  return createHmac('sha256', secretKey).update(buildCinetpayHmacPayload(fields)).digest('hex');
}

/** Compare le token reçu (header x-token) au token calculé. */
export function verifyCinetpayHmacToken(
  receivedToken: string | null | undefined,
  fields: CinetpayNotificationFields,
  secretKey: string,
): boolean {
  if (!receivedToken?.trim() || !secretKey.trim()) return false;
  const expected = generateCinetpayHmacToken(fields, secretKey);
  try {
    const a = Buffer.from(receivedToken.trim(), 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Extrait les champs notification depuis FormData CinetPay. */
export function parseCinetpayFormData(form: FormData): CinetpayNotificationFields {
  const out: CinetpayNotificationFields = {};
  for (const key of [...HMAC_FIELD_ORDER, 'cpm_result'] as const) {
    const v = form.get(key);
    if (v != null) out[key] = String(v);
  }
  return out;
}
