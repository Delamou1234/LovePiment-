import type { Prisma } from '@prisma/client';

export type LigneStockCommande = {
  variantId: string;
  quantite: number;
};

/** Décrémente le stock de façon atomique (évite les ventes en double). */
export async function decrementerStockPourArticles(
  tx: Prisma.TransactionClient,
  items: LigneStockCommande[],
) {
  for (const item of items) {
    const { count } = await tx.productVariant.updateMany({
      where: { id: item.variantId, stock: { gte: item.quantite } },
      data: { stock: { decrement: item.quantite } },
    });
    if (count === 0) {
      throw new Error('Stock insuffisant pour un ou plusieurs articles');
    }
  }
}

/** Réincrémente le stock lors d'une annulation ou d'un paiement échoué. */
export async function restaurerStockPourArticles(
  tx: Prisma.TransactionClient,
  items: LigneStockCommande[],
) {
  for (const item of items) {
    await tx.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { increment: item.quantite } },
    });
  }
}
