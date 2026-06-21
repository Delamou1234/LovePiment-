import { prisma } from '@/shared/lib/prisma';

const STOCK_FAIBLE_SEUIL = 5;

export type AdminDashboardStats = {
  produitsActifs: number;
  commandesEnAttente: number;
  visites7j: number;
  visitesAujourdhui: number;
  chiffreAffaires: number;
  clientsUniques: number;
  stockFaible: number;
  promotionsActives: number;
  commandesTotal: number;
  commandesAujourdhui: number;
  messagesNonLus: number;
  avisClients: number;
};

export class AdminStatsService {
  async obtenirDashboard(): Promise<AdminDashboardStats> {
    const depuis7j = new Date();
    depuis7j.setDate(depuis7j.getDate() - 7);
    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);
    const now = new Date();

    const [
      produitsActifs,
      commandesEnAttente,
      visites7j,
      visitesAujourdhui,
      caAgg,
      commandesTotal,
      commandesAujourdhui,
      variantesStock,
      promosActives,
      messagesAgg,
      clientsInscrits,
      avisClients,
    ] = await Promise.all([
      prisma.product.count({ where: { actif: true } }),
      prisma.order.count({ where: { statut: 'EN_ATTENTE' } }),
      prisma.analyticsEvent.count({
        where: { type: 'PAGE_VIEW', createdAt: { gte: depuis7j } },
      }),
      prisma.analyticsEvent.count({
        where: { type: 'PAGE_VIEW', createdAt: { gte: debutJour } },
      }),
      prisma.order.aggregate({
        _sum: { montantTotal: true },
        where: {
          statut: { in: ['PAYEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE'] },
        },
      }),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: debutJour } } }),
      prisma.productVariant.findMany({ select: { stock: true } }),
      prisma.product.count({
        where: {
          OR: [
            {
              prixPromo: { not: null },
              OR: [{ promoDebut: null }, { promoDebut: { lte: now } }],
              AND: [{ OR: [{ promoFin: null }, { promoFin: { gte: now } }] }],
            },
            { featured: true },
          ],
        },
      }),
      prisma.conversation.aggregate({ _sum: { nonLuVendeur: true } }),
      prisma.customer.count(),
      prisma.order.count({ where: { satisfactionStatut: { not: null } } }),
    ]);

    const stockFaible = variantesStock.filter((v) => v.stock <= STOCK_FAIBLE_SEUIL).length;

    return {
      produitsActifs,
      commandesEnAttente,
      visites7j,
      visitesAujourdhui,
      chiffreAffaires: Number(caAgg._sum.montantTotal ?? 0),
      clientsUniques: clientsInscrits,
      stockFaible,
      promotionsActives: promosActives,
      commandesTotal,
      commandesAujourdhui,
      messagesNonLus: messagesAgg._sum.nonLuVendeur ?? 0,
      avisClients,
    };
  }
}

export const adminStatsService = new AdminStatsService();
