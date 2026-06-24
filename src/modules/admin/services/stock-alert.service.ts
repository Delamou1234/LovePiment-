import { prisma } from '@/shared/lib/prisma';
import { STOCK_FAIBLE_SEUIL } from '../lib/stock-threshold';

export type StockAlerte = {
  id: string;
  stock: number;
  taille: string | null;
  couleur: string | null;
  capacite: string | null;
  sku: string | null;
  produit: {
    id: string;
    nom: string;
    slug: string;
    actif: boolean;
  };
};

export const stockAlertService = {
  async compterAlertes(): Promise<number> {
    return prisma.productVariant.count({
      where: { stock: { lte: STOCK_FAIBLE_SEUIL } },
    });
  },

  async listerAlertes(limit = 30): Promise<StockAlerte[]> {
    const rows = await prisma.productVariant.findMany({
      where: { stock: { lte: STOCK_FAIBLE_SEUIL } },
      select: {
        id: true,
        stock: true,
        taille: true,
        couleur: true,
        capacite: true,
        sku: true,
        produit: {
          select: { id: true, nom: true, slug: true, actif: true },
        },
      },
      orderBy: [{ stock: 'asc' }, { produit: { nom: 'asc' } }],
      take: limit,
    });

    return rows.map((r) => ({
      id: r.id,
      stock: r.stock,
      taille: r.taille,
      couleur: r.couleur,
      capacite: r.capacite,
      sku: r.sku,
      produit: r.produit,
    }));
  },
};
