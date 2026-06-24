import { describe, expect, it } from 'vitest';
import { isStockFaible, STOCK_FAIBLE_SEUIL } from './stock-threshold';

describe('stock-threshold', () => {
  it('expose le seuil à 5', () => {
    expect(STOCK_FAIBLE_SEUIL).toBe(5);
  });

  it('détecte le stock faible', () => {
    expect(isStockFaible(5)).toBe(true);
    expect(isStockFaible(0)).toBe(true);
    expect(isStockFaible(6)).toBe(false);
  });
});
