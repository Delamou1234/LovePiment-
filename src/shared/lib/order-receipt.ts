export type OrderReceiptLine = {
  prixUnitaire: number | string | { toString(): string };
  quantite: number;
};

export type OrderReceiptInput = {
  montantTotal: number | string | { toString(): string };
  fraisLivraison?: number | string | { toString(): string } | null;
  items?: OrderReceiptLine[];
};

function toNumber(value: number | string | { toString(): string }): number {
  return Number(value);
}

/** Totaux affichés sur la confirmation commande (données réelles, pas de montant fixe). */
export function computeOrderReceiptTotals(order: OrderReceiptInput) {
  const montantTotal = toNumber(order.montantTotal);
  const fraisLivraison =
    order.fraisLivraison != null ? toNumber(order.fraisLivraison) : 0;

  const sousTotalArticles =
    order.items && order.items.length > 0
      ? order.items.reduce(
          (sum, item) => sum + toNumber(item.prixUnitaire) * item.quantite,
          0,
        )
      : Math.max(0, montantTotal - fraisLivraison);

  return {
    montantTotal,
    fraisLivraison,
    sousTotalArticles,
  };
}
