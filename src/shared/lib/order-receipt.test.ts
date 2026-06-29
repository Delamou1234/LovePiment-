import { describe, expect, it } from 'vitest';
import { computeOrderReceiptTotals } from './order-receipt';

describe('computeOrderReceiptTotals', () => {
  it('utilise fraisLivraison réels et sous-total articles', () => {
    const result = computeOrderReceiptTotals({
      montantTotal: 65000,
      fraisLivraison: 15000,
      items: [
        { prixUnitaire: 25000, quantite: 2 },
      ],
    });

    expect(result.montantTotal).toBe(65000);
    expect(result.fraisLivraison).toBe(15000);
    expect(result.sousTotalArticles).toBe(50000);
  });

  it('déduit la livraison du total si pas de lignes articles', () => {
    const result = computeOrderReceiptTotals({
      montantTotal: 40000,
      fraisLivraison: 10000,
    });

    expect(result.sousTotalArticles).toBe(30000);
  });
});
