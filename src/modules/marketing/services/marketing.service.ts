import type { Prisma } from '@prisma/client';
import { prisma } from '@/shared/lib/prisma';
import { calculerFraisLivraison } from '@/shared/lib/shipping';
import { LOYALTY } from '../lib/constants';
import { genererCodeParrainage } from '../lib/referral-code';
import {
  marketingRepository,
  type MarketingRepository,
} from '../repository/marketing.repository';
import type {
  CalculRemisesInput,
  CouponClient,
  CreerCouponDto,
  CreerFlashSaleDto,
  TotauxMarketing,
} from '../types';

export class MarketingService {
  constructor(private readonly repo: MarketingRepository = marketingRepository) {}

  async ensureReferralCode(customerId: string): Promise<string> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { codeParrainage: true },
    });
    if (customer?.codeParrainage) return customer.codeParrainage;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = genererCodeParrainage();
      try {
        const updated = await prisma.customer.update({
          where: { id: customerId },
          data: { codeParrainage: code },
          select: { codeParrainage: true },
        });
        return updated.codeParrainage!;
      } catch {
        // collision — réessayer
      }
    }
    throw new Error('Impossible de générer un code parrainage');
  }

  async validerCoupon(code: string, sousTotal: number): Promise<CouponClient> {
    const coupon = await this.repo.trouverCouponParCode(code);
    if (!coupon || !coupon.actif) {
      throw new Error('Code promo invalide ou expiré');
    }

    const now = new Date();
    if (coupon.debut && coupon.debut > now) {
      throw new Error('Ce code promo n\'est pas encore actif');
    }
    if (coupon.fin && coupon.fin < now) {
      throw new Error('Ce code promo a expiré');
    }
    if (coupon.maxUtilisations != null && coupon.utilisations >= coupon.maxUtilisations) {
      throw new Error('Ce code promo a atteint sa limite d\'utilisation');
    }

    const minCommande = coupon.minCommande ? Number(coupon.minCommande) : null;
    if (minCommande != null && sousTotal < minCommande) {
      throw new Error(
        `Minimum de commande : ${minCommande.toLocaleString('fr-FR')} GN`,
      );
    }

    const valeur = Number(coupon.valeur);
    const remiseEstimee =
      coupon.type === 'POURCENT'
        ? Math.min(Math.round((sousTotal * valeur) / 100), sousTotal)
        : Math.min(valeur, sousTotal);

    return {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      valeur,
      minCommande,
      remiseEstimee,
    };
  }

  async calculerTotaux(input: CalculRemisesInput): Promise<TotauxMarketing> {
    const sousTotal = Math.max(0, input.sousTotal);
    let remiseCoupon = 0;
    let couponId: string | null = null;
    let codeParrainageUtilise: string | null = null;

    if (input.codeCoupon?.trim()) {
      const coupon = await this.validerCoupon(input.codeCoupon, sousTotal);
      remiseCoupon = coupon.remiseEstimee;
      couponId = coupon.id;
    }

    let apresCoupon = Math.max(0, sousTotal - remiseCoupon);

    let remisePoints = 0;
    let pointsUtilises = 0;

    if (input.customerId && input.pointsUtilises && input.pointsUtilises > 0) {
      const customer = await prisma.customer.findUnique({
        where: { id: input.customerId },
        select: { pointsFidelite: true },
      });
      if (!customer) throw new Error('Compte client introuvable');

      const maxRemisePoints = Math.round(apresCoupon * LOYALTY.MAX_REMISE_POINTS_PCT);
      const maxPointsUtilisables = Math.min(
        customer.pointsFidelite,
        Math.floor(maxRemisePoints / LOYALTY.VALEUR_POINT_GN),
      );
      pointsUtilises = Math.min(input.pointsUtilises, maxPointsUtilisables);
      remisePoints = pointsUtilises * LOYALTY.VALEUR_POINT_GN;
      remisePoints = Math.min(remisePoints, apresCoupon);
      apresCoupon = Math.max(0, apresCoupon - remisePoints);
    }

    let remiseParrainage = 0;
    if (input.codeParrainage?.trim() && input.customerId) {
      const code = input.codeParrainage.trim().toUpperCase();
      const parrain = await this.repo.trouverClientParCodeParrainage(code);
      if (!parrain) throw new Error('Code parrainage invalide');
      if (parrain.id === input.customerId) {
        throw new Error('Vous ne pouvez pas utiliser votre propre code');
      }

      const commandesPayees = await this.repo.compterCommandesPayees(input.customerId);
      if (commandesPayees === 0) {
        remiseParrainage = Math.round(apresCoupon * LOYALTY.FILLEUL_REMISE_PCT);
        codeParrainageUtilise = code;
        apresCoupon = Math.max(0, apresCoupon - remiseParrainage);
      }
    }

    const fraisLivraison = calculerFraisLivraison(apresCoupon, input.clientVille);
    const montantTotal = apresCoupon + fraisLivraison;
    const pointsGagnes = Math.floor(montantTotal / 1000) * LOYALTY.POINTS_PAR_1000_GN;

    return {
      sousTotal,
      remiseCoupon,
      remisePoints,
      remiseParrainage,
      fraisLivraison,
      montantTotal,
      livraisonGratuite: fraisLivraison === 0,
      pointsUtilises,
      pointsGagnes,
      couponId,
      codeParrainageUtilise,
    };
  }

  async appliquerEffetsCommande(
    tx: Prisma.TransactionClient,
    data: {
      orderId: string;
      customerId: string;
      couponId: string | null;
      pointsUtilises: number;
      pointsGagnes: number;
      codeParrainageUtilise: string | null;
      crediterPoints: boolean;
    },
  ) {
    if (data.couponId) {
      await tx.coupon.update({
        where: { id: data.couponId },
        data: { utilisations: { increment: 1 } },
      });
    }

    if (data.pointsUtilises > 0) {
      await tx.customer.update({
        where: { id: data.customerId },
        data: { pointsFidelite: { decrement: data.pointsUtilises } },
      });
    }

    if (data.codeParrainageUtilise) {
      const parrain = await tx.customer.findUnique({
        where: { codeParrainage: data.codeParrainageUtilise },
      });
      if (parrain) {
        const filleul = await tx.customer.findUnique({
          where: { id: data.customerId },
          select: { parrainId: true },
        });
        if (!filleul?.parrainId) {
          await tx.customer.update({
            where: { id: data.customerId },
            data: { parrainId: parrain.id },
          });
        }
      }
    }

    if (data.crediterPoints && data.pointsGagnes > 0) {
      await tx.customer.update({
        where: { id: data.customerId },
        data: { pointsFidelite: { increment: data.pointsGagnes } },
      });

      if (data.codeParrainageUtilise) {
        const parrain = await tx.customer.findUnique({
          where: { codeParrainage: data.codeParrainageUtilise },
        });
        if (parrain) {
          await tx.customer.update({
            where: { id: parrain.id },
            data: { pointsFidelite: { increment: LOYALTY.PARRAIN_POINTS } },
          });
        }
      }

      await tx.order.update({
        where: { id: data.orderId },
        data: { pointsCredites: true },
      });
    }
  }

  async confirmerPointsApresPaiement(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        customerId: true,
        pointsGagnes: true,
        codeParrainageUtilise: true,
        pointsCredites: true,
      },
    });
    if (!order?.customerId || order.pointsCredites) return;

    await prisma.$transaction(async (tx) => {
      if (order.pointsGagnes > 0) {
        await tx.customer.update({
          where: { id: order.customerId! },
          data: { pointsFidelite: { increment: order.pointsGagnes } },
        });
      }

      if (order.codeParrainageUtilise) {
        const parrain = await tx.customer.findUnique({
          where: { codeParrainage: order.codeParrainageUtilise },
        });
        if (parrain) {
          await tx.customer.update({
            where: { id: parrain.id },
            data: { pointsFidelite: { increment: LOYALTY.PARRAIN_POINTS } },
          });
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: { pointsCredites: true },
      });
    });
  }

  async obtenirFlashActive() {
    return this.repo.trouverFlashSaleActive();
  }

  async listerCouponsAdmin() {
    return this.repo.listerCoupons();
  }

  async creerCoupon(dto: CreerCouponDto) {
    return this.repo.creerCoupon(dto);
  }

  async mettreAJourCoupon(id: string, dto: Partial<CreerCouponDto> & { actif?: boolean }) {
    return this.repo.mettreAJourCoupon(id, dto);
  }

  async supprimerCoupon(id: string) {
    return this.repo.supprimerCoupon(id);
  }

  async listerFlashSalesAdmin() {
    return this.repo.listerFlashSales();
  }

  async creerFlashSale(dto: CreerFlashSaleDto) {
    return this.repo.creerFlashSale(dto);
  }

  async mettreAJourFlashSale(
    id: string,
    dto: Partial<CreerFlashSaleDto> & { actif?: boolean },
  ) {
    return this.repo.mettreAJourFlashSale(id, dto);
  }

  async supprimerFlashSale(id: string) {
    return this.repo.supprimerFlashSale(id);
  }
}

export const marketingService = new MarketingService();
