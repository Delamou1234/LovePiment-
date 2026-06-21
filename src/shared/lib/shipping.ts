/** Règles de livraison KabiShop (Conakry). */
export const LIVRAISON_CONFIG = {
  villeParDefaut: 'Conakry',
  tarifConakry: 15_000,
  tarifHorsConakry: 25_000,
  seuilGratuit: 500_000,
} as const;

export function calculerFraisLivraison(
  sousTotal: number,
  ville: string = LIVRAISON_CONFIG.villeParDefaut,
): number {
  const villeNorm = ville.trim().toLowerCase();

  if (villeNorm === 'conakry' && sousTotal >= LIVRAISON_CONFIG.seuilGratuit) {
    return 0;
  }

  return villeNorm === 'conakry'
    ? LIVRAISON_CONFIG.tarifConakry
    : LIVRAISON_CONFIG.tarifHorsConakry;
}

export function calculerTotauxCommande(
  items: { prix: number; quantite: number }[],
  ville: string = LIVRAISON_CONFIG.villeParDefaut,
) {
  const sousTotal = items.reduce((acc, item) => acc + item.prix * item.quantite, 0);
  const fraisLivraison = calculerFraisLivraison(sousTotal, ville);
  const total = sousTotal + fraisLivraison;

  return { sousTotal, fraisLivraison, total, livraisonGratuite: fraisLivraison === 0 };
}

export function formaterPrixGN(montant: number): string {
  return `${montant.toLocaleString('fr-FR')} GN`;
}
