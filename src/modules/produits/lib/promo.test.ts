import { describe, expect, it } from 'vitest';
import {
  calculerRemisePct,
  estPromoActive,
  formaterDatePromo,
  prixEffectif,
  promoFinVersIso,
  versDatePromo,
} from './promo';

type ProduitPromoTest = Parameters<typeof estPromoActive>[0];
type ProduitPrixTest = Parameters<typeof prixEffectif>[0];

describe('estPromoActive', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');

  it('retourne false sans prix promo', () => {
    expect(estPromoActive({ prixPromo: null, promoDebut: null, promoFin: null }, now)).toBe(false);
  });

  it('retourne true pendant la fenêtre promo', () => {
    expect(
      estPromoActive(
        {
          prixPromo: 40_000,
          promoDebut: new Date('2026-06-01'),
          promoFin: new Date('2026-06-30'),
        } as unknown as ProduitPromoTest,
        now,
      ),
    ).toBe(true);
  });

  it('retourne false avant le début', () => {
    expect(
      estPromoActive(
        {
          prixPromo: 40_000,
          promoDebut: new Date('2026-07-01'),
          promoFin: null,
        } as unknown as ProduitPromoTest,
        now,
      ),
    ).toBe(false);
  });

  it('retourne false après la fin', () => {
    expect(
      estPromoActive(
        {
          prixPromo: 40_000,
          promoDebut: null,
          promoFin: new Date('2026-06-01'),
        } as unknown as ProduitPromoTest,
        now,
      ),
    ).toBe(false);
  });
});

describe('calculerRemisePct', () => {
  it('calcule le pourcentage arrondi', () => {
    expect(calculerRemisePct(100_000, 75_000)).toBe(25);
  });

  it('retourne 0 si pas de remise', () => {
    expect(calculerRemisePct(50_000, 50_000)).toBe(0);
    expect(calculerRemisePct(0, 0)).toBe(0);
  });
});

describe('prixEffectif', () => {
  it('applique le prix promo si actif', () => {
    expect(
      prixEffectif({
        prix: 100_000,
        prixPromo: 80_000,
        promoDebut: null,
        promoFin: null,
      } as unknown as ProduitPrixTest),
    ).toBe(80_000);
  });

  it('garde le prix normal hors promo', () => {
    expect(
      prixEffectif({
        prix: 100_000,
        prixPromo: 80_000,
        promoDebut: new Date('2099-01-01'),
        promoFin: null,
      } as unknown as ProduitPrixTest),
    ).toBe(100_000);
  });
});

describe('dates promo (cache sérialisé)', () => {
  it('normalise une chaîne ISO', () => {
    const d = versDatePromo('2026-06-20T00:00:00.000Z');
    expect(d).toBeInstanceOf(Date);
    expect(promoFinVersIso('2026-06-20T00:00:00.000Z')).toBe('2026-06-20T00:00:00.000Z');
  });

  it('formate une date en français', () => {
    expect(formaterDatePromo(new Date('2026-06-20T00:00:00.000Z'))).toBe('20 juin 2026');
  });
});
