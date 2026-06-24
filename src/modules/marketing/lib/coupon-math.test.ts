import { describe, expect, it } from 'vitest';
import { calculerRemiseCoupon, getCouponValidationError } from './coupon-math';

describe('calculerRemiseCoupon', () => {
  it('calcule une remise en pourcentage', () => {
    expect(
      calculerRemiseCoupon({ type: 'POURCENT', valeur: 10, sousTotal: 100_000 }),
    ).toBe(10_000);
  });

  it('plafonne la remise au sous-total', () => {
    expect(
      calculerRemiseCoupon({ type: 'POURCENT', valeur: 150, sousTotal: 50_000 }),
    ).toBe(50_000);
  });

  it('calcule une remise fixe', () => {
    expect(
      calculerRemiseCoupon({ type: 'MONTANT_FIXE', valeur: 5_000, sousTotal: 100_000 }),
    ).toBe(5_000);
  });

  it('ne dépasse pas le sous-total en montant fixe', () => {
    expect(
      calculerRemiseCoupon({ type: 'MONTANT_FIXE', valeur: 20_000, sousTotal: 10_000 }),
    ).toBe(10_000);
  });
});

describe('getCouponValidationError', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');
  const base = {
    actif: true,
    debut: null,
    fin: null,
    utilisations: 0,
    maxUtilisations: null,
    minCommande: null,
    sousTotal: 100_000,
  };

  it('accepte un coupon valide', () => {
    expect(getCouponValidationError(base, now)).toBeNull();
  });

  it('rejette un coupon inactif', () => {
    expect(getCouponValidationError({ ...base, actif: false }, now)).toContain('invalide');
  });

  it('rejette un coupon pas encore actif', () => {
    expect(
      getCouponValidationError({ ...base, debut: new Date('2026-07-01') }, now),
    ).toContain('pas encore actif');
  });

  it('rejette un coupon expiré', () => {
    expect(
      getCouponValidationError({ ...base, fin: new Date('2026-06-01') }, now),
    ).toContain('expiré');
  });

  it('rejette si limite d’utilisations atteinte', () => {
    expect(
      getCouponValidationError({ ...base, maxUtilisations: 5, utilisations: 5 }, now),
    ).toContain('limite');
  });

  it('rejette si minimum de commande non atteint', () => {
    expect(
      getCouponValidationError({ ...base, minCommande: 200_000, sousTotal: 50_000 }, now),
    ).toContain('Minimum');
  });
});
