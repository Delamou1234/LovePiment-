import { prisma } from '@/shared/lib/prisma';

export type RapportPeriode = '7j' | '30j' | '90j';

export type RapportAnalytics = {
  periode: RapportPeriode;
  visites: number;
  vuesProduits: number;
  ajoutsPanier: number;
  checkouts: number;
  commandes: number;
  chiffreAffaires: number;
  evenementsParType: { type: string; count: number }[];
  commandesParStatut: { statut: string; count: number }[];
  topProduits: { productId: string; nom: string; vues: number }[];
  visitesParJour: { date: string; count: number }[];
};

function periodeEnDate(periode: RapportPeriode): Date {
  const d = new Date();
  const jours = periode === '7j' ? 7 : periode === '30j' ? 30 : 90;
  d.setDate(d.getDate() - jours);
  d.setHours(0, 0, 0, 0);
  return d;
}

export class AnalyticsAdminService {
  async genererRapport(periode: RapportPeriode = '7j'): Promise<RapportAnalytics> {
    const depuis = periodeEnDate(periode);

    const [
      evenementsParType,
      commandesParStatut,
      topRaw,
      events,
      caAgg,
      commandesCount,
    ] = await Promise.all([
      prisma.analyticsEvent.groupBy({
        by: ['type'],
        _count: { id: true },
        where: { createdAt: { gte: depuis } },
      }),
      prisma.order.groupBy({
        by: ['statut'],
        _count: { id: true },
        where: { createdAt: { gte: depuis } },
      }),
      prisma.analyticsEvent.groupBy({
        by: ['productId'],
        _count: { id: true },
        where: {
          type: 'PRODUCT_VIEW',
          productId: { not: null },
          createdAt: { gte: depuis },
        },
        orderBy: { _count: { id: 'desc' } },
        take: 8,
      }),
      prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: depuis } },
        select: { type: true, createdAt: true },
      }),
      prisma.order.aggregate({
        _sum: { montantTotal: true },
        where: {
          createdAt: { gte: depuis },
          statut: { in: ['PAYEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE'] },
        },
      }),
      prisma.order.count({ where: { createdAt: { gte: depuis } } }),
    ]);

    const productIds = topRaw
      .map((t) => t.productId)
      .filter((id): id is string => Boolean(id));
    const produits = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, nom: true },
        })
      : [];
    const noms = new Map(produits.map((p) => [p.id, p.nom]));

    const visitesParJourMap = new Map<string, number>();
    for (const e of events) {
      if (e.type !== 'PAGE_VIEW') continue;
      const key = e.createdAt.toISOString().slice(0, 10);
      visitesParJourMap.set(key, (visitesParJourMap.get(key) ?? 0) + 1);
    }

    const countType = (type: string) =>
      evenementsParType.find((e) => e.type === type)?._count.id ?? 0;

    return {
      periode,
      visites: countType('PAGE_VIEW'),
      vuesProduits: countType('PRODUCT_VIEW'),
      ajoutsPanier: countType('ADD_TO_CART'),
      checkouts: countType('CHECKOUT_START'),
      commandes: commandesCount,
      chiffreAffaires: Number(caAgg._sum.montantTotal ?? 0),
      evenementsParType: evenementsParType.map((e) => ({
        type: e.type,
        count: e._count.id,
      })),
      commandesParStatut: commandesParStatut.map((c) => ({
        statut: c.statut,
        count: c._count.id,
      })),
      topProduits: topRaw
        .filter((t) => t.productId)
        .map((t) => ({
          productId: t.productId!,
          nom: noms.get(t.productId!) ?? 'Produit',
          vues: t._count.id,
        })),
      visitesParJour: Array.from(visitesParJourMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
    };
  }
}

export const analyticsAdminService = new AnalyticsAdminService();
