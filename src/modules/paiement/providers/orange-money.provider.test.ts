import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OrangeMoneyProvider } from '@/modules/paiement/providers/orange-money.provider';

describe('OrangeMoneyProvider', () => {
  const provider = new OrangeMoneyProvider();

  beforeEach(() => {
    vi.stubEnv('ORANGE_MONEY_CLIENT_ID', 'client-id');
    vi.stubEnv('ORANGE_MONEY_CLIENT_SECRET', 'client-secret');
    vi.stubEnv('ORANGE_MONEY_MERCHANT_KEY', 'merchant-key');
    vi.stubEnv('ORANGE_MONEY_COUNTRY_CODE', 'dev');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('valide le notif_token du webhook', () => {
    const payload = { notif_token: 'abc123', status: 'SUCCESS', order_id: 'ord-1' };
    expect(provider.validerWebhook(payload, 'abc123')).toBe(true);
    expect(provider.validerWebhook(payload, 'wrong')).toBe(false);
  });

  it('détecte un paiement réussi', () => {
    expect(provider.estPaiementReussi({ status: 'SUCCESS' })).toBe(true);
    expect(provider.estPaiementReussi({ status: 'FAILED' })).toBe(false);
  });

  it('compare le montant notifié', () => {
    expect(provider.montantNotificationValide('150000', 150000)).toBe(true);
    expect(provider.montantNotificationValide(149999, 150000)).toBe(false);
  });

  it('initie un paiement et retourne payment_url + tokens', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token-xyz' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          payment_url: 'https://webpayment-qualif.orange-money.com/pay',
          pay_token: 'pay-token',
          notif_token: 'notif-token',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const result = await provider.initierPaiement({
      transactionId: 'order-uuid',
      montant: 250000,
      description: 'Commande test',
      clientNom: 'Fatou Diallo',
      clientTelephone: '620123456',
      clientEmail: 'fatou@example.com',
      clientAdresse: 'Kaloum',
      clientVille: 'Conakry',
      returnUrl: 'https://shop.test/commande/confirmation?id=1',
      notifyUrl: 'https://shop.test/api/webhook-orange-money',
    });

    expect(result.success).toBe(true);
    expect(result.paymentUrl).toContain('orange-money.com');
    expect(result.payToken).toBe('pay-token');
    expect(result.notifToken).toBe('notif-token');
  });
});
