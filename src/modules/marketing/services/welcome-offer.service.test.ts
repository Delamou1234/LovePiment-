import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/shared/lib/prisma', () => ({
  prisma: {
    storeSettings: { findUnique: vi.fn() },
    coupon: { findUnique: vi.fn() },
  },
}));

vi.mock('@/modules/admin/services/store-settings.service', () => ({
  STORE_SETTINGS_ID: 'lovepiment-settings',
  storeSettingsService: { ensureSettings: vi.fn() },
}));

import { prisma } from '@/shared/lib/prisma';
import { resoudreOffreBienvenue } from './welcome-offer.service';

describe('resoudreOffreBienvenue', () => {
  beforeEach(() => {
    vi.mocked(prisma.storeSettings.findUnique).mockReset();
    vi.mocked(prisma.coupon.findUnique).mockReset();
  });

  it('retourne inactif si admin a désactivé l’offre', async () => {
    vi.mocked(prisma.storeSettings.findUnique).mockResolvedValue({
      newsletterActif: false,
      newsletterCouponCode: 'BIENVENUE10',
      newsletterRemisePct: 10,
    } as never);

    const offre = await resoudreOffreBienvenue();
    expect(offre.actif).toBe(false);
    expect(offre.code).toBeNull();
  });

  it('retourne actif si admin activé et coupon actif', async () => {
    vi.mocked(prisma.storeSettings.findUnique).mockResolvedValue({
      newsletterActif: true,
      newsletterCouponCode: 'bienvenue10',
      newsletterRemisePct: 10,
    } as never);
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      actif: true,
      type: 'POURCENT',
      valeur: 10,
      premiereCommandeOnly: true,
    } as never);

    const offre = await resoudreOffreBienvenue();
    expect(offre).toEqual({ actif: true, code: 'BIENVENUE10', remisePct: 10 });
  });
});
