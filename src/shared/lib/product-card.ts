export type ProductCardVariant = {
  variantId: string;
  productId: string;
  stock: number;
  taille?: string | null;
  couleur?: string | null;
  prix?: number | null;
};

/** Utilisable côté serveur pour préparer les props de ProductCard. */
export function variantePourCarte(
  productId: string,
  prixProduit: number,
  variante?: {
    id: string;
    stock: number;
    taille?: string | null;
    couleur?: string | null;
    prix?: unknown;
  } | null,
): ProductCardVariant | null {
  if (!variante || variante.stock <= 0) return null;
  return {
    variantId: variante.id,
    productId,
    stock: variante.stock,
    taille: variante.taille,
    couleur: variante.couleur,
    prix: variante.prix != null ? Number(variante.prix) : null,
  };
}
