import type { Product } from '@prisma/client';

/** Clause Prisma : promotion en cours (prix promo + dates valides). */
export function wherePromoActive(now = new Date()) {
  return {
    prixPromo: { not: null },
    OR: [{ promoDebut: null }, { promoDebut: { lte: now } }],
    AND: [{ OR: [{ promoFin: null }, { promoFin: { gte: now } }] }],
  };
}

export function estPromoActive(
  produit: Pick<Product, 'prixPromo' | 'promoDebut' | 'promoFin'>,
  now = new Date(),
): boolean {
  if (produit.prixPromo == null) return false;
  if (produit.promoDebut && produit.promoDebut > now) return false;
  if (produit.promoFin && produit.promoFin < now) return false;
  return true;
}

export function calculerRemisePct(prix: number, prixPromo: number): number {
  if (prix <= 0 || prixPromo >= prix) return 0;
  return Math.round((1 - prixPromo / prix) * 100);
}

export function prixEffectif(
  produit: Pick<Product, 'prix' | 'prixPromo' | 'promoDebut' | 'promoFin'>,
): number {
  const prix = Number(produit.prix);
  if (!estPromoActive(produit)) return prix;
  return Number(produit.prixPromo);
}

export function formaterDatePromo(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  const months = [
    'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
  ];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Normalise une date promo (Prisma Date ou chaîne après cache). */
export function versDatePromo(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  return typeof date === 'string' ? new Date(date) : date;
}

export function promoFinVersIso(date: Date | string | null | undefined): string | null {
  const d = versDatePromo(date);
  return d ? d.toISOString() : null;
}
