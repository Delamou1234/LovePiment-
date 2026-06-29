import { describe, expect, it } from 'vitest';
import {
  buildCinetpayHmacPayload,
  generateCinetpayHmacToken,
  verifyCinetpayHmacToken,
} from './cinetpay-hmac';

describe('cinetpay-hmac', () => {
  const fields = {
    cpm_site_id: '123456',
    cpm_trans_id: 'tx-abc',
    cpm_trans_date: '2026-06-27 12:00:00',
    cpm_amount: '50000',
    cpm_currency: 'GNF',
    signature: 'sig',
    payment_method: 'MOBILE_MONEY',
    cel_phone_num: '224620000000',
    cpm_phone_prefixe: '224',
    cpm_language: 'fr',
    cpm_version: 'V4',
    cpm_payment_config: 'Single',
    cpm_page_action: 'Payment',
    cpm_custom: '',
    cpm_designation: 'Commande test',
    cpm_error_message: 'SUCCES',
  };

  it('concatène les champs dans le bon ordre', () => {
    expect(buildCinetpayHmacPayload(fields)).toBe(
      '123456tx-abc2026-06-27 12:00:0050000GNFsigMOBILE_MONEY224620000000224frV4SinglePaymentCommande testSUCCES',
    );
  });

  it('valide un token HMAC cohérent', () => {
    const secret = 'test-secret-key';
    const token = generateCinetpayHmacToken(fields, secret);
    expect(verifyCinetpayHmacToken(token, fields, secret)).toBe(true);
    expect(verifyCinetpayHmacToken('invalid', fields, secret)).toBe(false);
  });
});
