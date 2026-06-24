import { prisma } from '@/shared/lib/prisma';
import { productService } from '@/modules/produits/services/product.service';
import { newsletterService } from '@/modules/marketing/services/newsletter.service';
import { STORE_SETTINGS_ID } from '@/modules/admin/services/store-settings.service';

export type DashboardStats = {
  commandes: number;
  enCours: number;
  livrees: number;
  favoris: number;
  bonsReduction: number;
  avisEnAttente: number;
  notifications: number;
};

export type DashboardRecommandation = {
  id: string;
  slug: string;
  nom: string;
  image: string | null;
  prix: number;
  prixPromo: number | null;
  rating: number;
  reviews: number;
};

export type DashboardOffre = {
  code: string;
  remisePct: number;
  titre: string;
};

export type CustomerDashboardPayload = {
  stats: DashboardStats;
  recommandations: DashboardRecommandation[];
  offreBienvenue: DashboardOffre | null;
};

export class CustomerDashboardService {
  async obtenirTableauDeBord(
    customerId: string,
    favorisCount: number,
    avisEnAttente: number,
  ): Promise<CustomerDashboardPayload> {
    const [statsOrders, bonsReduction, recommandations, offreBienvenue] = await Promise.all([
      this.statsCommandes(customerId),
      this.compterBonsDisponibles(customerId),
      this.obtenirRecommandations(),
      this.obtenirOffreBienvenue(),
    ]);

    const stats: DashboardStats = {
      commandes: statsOrders.total,
      enCours: statsOrders.enCours,
      livrees: statsOrders.livrees,
      favoris: favorisCount,
      bonsReduction,
      avisEnAttente,
      notifications: avisEnAttente + statsOrders.enCours,
    };

    return { stats, recommandations, offreBienvenue };
  }

  private async statsCommandes(customerId: string) {
    const [total, enCours, livrees] = await Promise.all([
      prisma.order.count({
        where: { customerId, statut: { not: 'ANNULEE' } },
      }),
      prisma.order.count({
        where: { customerId, statut: { notIn: ['LIVREE', 'ANNULEE'] } },
      }),
      prisma.order.count({
        where: { customerId, statut: 'LIVREE' },
      }),
    ]);
    return { total, enCours, livrees };
  }

  private async compterBonsDisponibles(customerId: string) {
    const ordersWithCoupon = await prisma.order.findMany({
      where: { customerId, couponId: { not: null } },
      select: { couponId: true },
      distinct: ['couponId'],
    });
    const usedIds = ordersWithCoupon
      .map((o) => o.couponId)
      .filter((id): id is string => Boolean(id));

    return prisma.coupon.count({
      where: {
        actif: true,
        ...(usedIds.length > 0 ? { id: { notIn: usedIds } } : {}),
        OR: [{ fin: null }, { fin: { gte: new Date() } }],
      },
    });
  }

  private async obtenirRecommandations(): Promise<DashboardRecommandation[]> {
    const { produits } = await productService.listerProduits(
      { featured: true, actif: true },
      { champ: 'createdAt', ordre: 'desc' },
      { page: 1, limit: 4 },
    );

    return produits.map((p) => ({
      id: p.id,
      slug: p.slug,
      nom: p.nom,
      image: p.images[0] ?? null,
      prix: Number(p.prix),
      prixPromo: p.prixPromo != null ? Number(p.prixPromo) : null,
      rating: 4.5,
      reviews: 0,
    }));
  }

  private async obtenirOffreBienvenue(): Promise<DashboardOffre | null> {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: STORE_SETTINGS_ID },
      select: { newsletterCouponCode: true, newsletterRemisePct: true },
    });

    const code = settings?.newsletterCouponCode?.trim() || 'BIENVENUE10';
    const coupon = await prisma.coupon.findUnique({
      where: { code },
      select: { code: true, type: true, valeur: true, actif: true },
    });

    if (coupon?.actif) {
      const remisePct =
        coupon.type === 'POURCENT'
          ? Math.round(Number(coupon.valeur))
          : (settings?.newsletterRemisePct ?? 10);
      return {
        code: coupon.code,
        remisePct,
        titre: `-${remisePct}% sur votre première commande`,
      };
    }

    const config = await newsletterService.getPublicConfig();
    if (!config.couponCode) return null;

    return {
      code: config.couponCode,
      remisePct: config.remisePct,
      titre: `-${config.remisePct}% sur votre première commande`,
    };
  }
}

export const customerDashboardService = new CustomerDashboardService();
