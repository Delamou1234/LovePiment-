import { describe, expect, it } from 'vitest';
import { extraireChampsWebhook } from '@/shared/lib/orange-money-webhook';

describe('extraireChampsWebhook', () => {
  it('lit un payload JSON plat', () => {
    const fields = extraireChampsWebhook({
      status: 'SUCCESS',
      notif_token: 'abc123',
      order_id: 'uuid-order',
      amount: '15000',
    });
    expect(fields).toEqual({
      status: 'SUCCESS',
      notif_token: 'abc123',
      order_id: 'uuid-order',
      amount: '15000',
    });
  });

  it('lit un payload imbriqué dans data', () => {
    const fields = extraireChampsWebhook({
      data: {
        status: 'FAILED',
        notifToken: 'tok-xyz',
        orderId: 'ord-99',
        amount: 25000,
      },
    });
    expect(fields?.status).toBe('FAILED');
    expect(fields?.notif_token).toBe('tok-xyz');
    expect(fields?.order_id).toBe('ord-99');
    expect(fields?.amount).toBe(25000);
  });

  it('retourne null pour un payload invalide', () => {
    expect(extraireChampsWebhook(null)).toBeNull();
    expect(extraireChampsWebhook('texte')).toBeNull();
  });
});
