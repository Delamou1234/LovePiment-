import { describe, it, expect } from 'vitest';
import { isClientPwaRoute } from '@/shared/lib/pwa';

describe('pwa', () => {
  it('autorise la PWA sur la boutique et le compte client', () => {
    expect(isClientPwaRoute('/')).toBe(true);
    expect(isClientPwaRoute('/produits')).toBe(true);
    expect(isClientPwaRoute('/compte/commandes')).toBe(true);
    expect(isClientPwaRoute('/panier')).toBe(true);
  });

  it('exclut admin et livreur', () => {
    expect(isClientPwaRoute('/admin')).toBe(false);
    expect(isClientPwaRoute('/livreur/commandes')).toBe(false);
    expect(isClientPwaRoute('/api/paiement')).toBe(false);
  });
});
