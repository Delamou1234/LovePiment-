import { describe, expect, it } from 'vitest';
import {
  calculerFraisLivraison,
  calculerTotauxCommande,
  estVilleTarifLocal,
  LIVRAISON_CONFIG_DEFAULT,
  normaliserVilleLivraison,
} from '@/shared/lib/shipping';

describe('calculerFraisLivraison', () => {
  const cfg = LIVRAISON_CONFIG_DEFAULT;

  it('applique le tarif Conakry', () => {
    expect(calculerFraisLivraison(100_000, 'Conakry', cfg)).toBe(cfg.tarifConakry);
  });

  it('applique le tarif hors Conakry', () => {
    expect(calculerFraisLivraison(100_000, 'Kindia', cfg)).toBe(cfg.tarifHorsConakry);
  });

  it('offre la livraison gratuite au seuil à Conakry', () => {
    expect(calculerFraisLivraison(cfg.seuilGratuit, 'Conakry', cfg)).toBe(0);
  });

  it('ne gratifie pas hors ville par défaut', () => {
    expect(calculerFraisLivraison(cfg.seuilGratuit, 'Kindia', cfg)).toBe(cfg.tarifHorsConakry);
  });

  it('respecte gratuiteActive=false', () => {
    expect(
      calculerFraisLivraison(cfg.seuilGratuit, 'Conakry', {
        ...cfg,
        gratuiteActive: false,
      }),
    ).toBe(cfg.tarifConakry);
  });
});

describe('calculerTotauxCommande', () => {
  it('additionne articles + livraison', () => {
    const result = calculerTotauxCommande(
      [
        { prix: 50_000, quantite: 2 },
        { prix: 10_000, quantite: 1 },
      ],
      'Conakry',
    );
    expect(result.sousTotal).toBe(110_000);
    expect(result.fraisLivraison).toBe(LIVRAISON_CONFIG_DEFAULT.tarifConakry);
    expect(result.total).toBe(110_000 + LIVRAISON_CONFIG_DEFAULT.tarifConakry);
    expect(result.livraisonGratuite).toBe(false);
  });
});

describe('normaliserVilleLivraison', () => {
  it('trim et lowercase', () => {
    expect(normaliserVilleLivraison('  Conakry ')).toBe('conakry');
  });

  it('détecte la ville locale', () => {
    expect(estVilleTarifLocal('conakry', LIVRAISON_CONFIG_DEFAULT)).toBe(true);
    expect(estVilleTarifLocal('Labé', LIVRAISON_CONFIG_DEFAULT)).toBe(false);
  });
});
