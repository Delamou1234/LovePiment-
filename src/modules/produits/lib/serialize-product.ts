import type { ProductVariant } from '@prisma/client';
import type { ProduitAvecVariantes } from '../types';

/** Produit sérialisé pour les Client Components (sans Decimal Prisma). */
export type ProduitClient = Omit<ProduitAvecVariantes, 'prix' | 'prixPromo' | 'variantes'> & {
  prix: number;
  prixPromo: number | null;
  variantes: (Omit<ProductVariant, 'prix'> & { prix: number | null })[];
};

export function serialiserProduitPourClient(produit: ProduitAvecVariantes): ProduitClient {
  return {
    ...produit,
    prix: Number(produit.prix),
    prixPromo: produit.prixPromo != null ? Number(produit.prixPromo) : null,
    variantes: produit.variantes.map((v) => ({
      ...v,
      prix: v.prix != null ? Number(v.prix) : null,
    })),
  };
}
