/** Seuil stock faible : l'admin est notifié si quantité ≤ cette valeur */
export const STOCK_FAIBLE_SEUIL = 5;

export function isStockFaible(stock: number) {
  return stock <= STOCK_FAIBLE_SEUIL;
}
