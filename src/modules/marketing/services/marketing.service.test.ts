import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MarketingService } from './marketing.service';
import type { MarketingRepository } from '../repository/marketing.repository';

function createMockRepo(): MarketingRepository {
  return {
    trouverCouponParCode: vi.fn(),
  } as unknown as MarketingRepository;
}

describe('MarketingService.validerCoupon', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retourne la remise estimée pour un coupon valide', async () => {
    const repo = createMockRepo();
    vi.mocked(repo.trouverCouponParCode).mockResolvedValue({
      id: 'c1',
      code: 'BIENVENUE10',
      type: 'POURCENT',
      valeur: 10,
      minCommande: null,
      maxUtilisations: null,
      utilisations: 0,
      actif: true,
      debut: null,
      fin: null,
    } as unknown as Awaited<ReturnType<MarketingRepository['trouverCouponParCode']>>);

    const service = new MarketingService(repo);
    const result = await service.validerCoupon('bienvenue10', 200_000);

    expect(result.remiseEstimee).toBe(20_000);
    expect(result.code).toBe('BIENVENUE10');
  });

  it('rejette un coupon inconnu', async () => {
    const repo = createMockRepo();
    vi.mocked(repo.trouverCouponParCode).mockResolvedValue(null);

    const service = new MarketingService(repo);
    await expect(service.validerCoupon('FAUX', 10_000)).rejects.toThrow('invalide');
  });
});
