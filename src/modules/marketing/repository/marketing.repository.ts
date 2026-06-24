import { prisma } from '@/shared/lib/prisma';
import type { CreerCouponDto, CreerFlashSaleDto } from '../types';

export class MarketingRepository {
  async trouverCouponParCode(code: string) {
    return prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
  }

  async trouverCouponParId(id: string) {
    return prisma.coupon.findUnique({ where: { id } });
  }

  async listerCoupons() {
    return prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async listerCouponsActifsPublics(limit = 6) {
    const now = new Date();
    return prisma.coupon.findMany({
      where: {
        actif: true,
        OR: [{ debut: null }, { debut: { lte: now } }],
        AND: [{ OR: [{ fin: null }, { fin: { gte: now } }] }],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async creerCoupon(dto: CreerCouponDto) {
    return prisma.coupon.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        type: dto.type,
        valeur: dto.valeur,
        minCommande: dto.minCommande ?? null,
        maxUtilisations: dto.maxUtilisations ?? null,
        actif: dto.actif ?? true,
        debut: dto.debut ?? null,
        fin: dto.fin ?? null,
      },
    });
  }

  async mettreAJourCoupon(
    id: string,
    data: Partial<CreerCouponDto> & { actif?: boolean },
  ) {
    return prisma.coupon.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code.trim().toUpperCase() }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.valeur !== undefined && { valeur: data.valeur }),
        ...(data.minCommande !== undefined && { minCommande: data.minCommande }),
        ...(data.maxUtilisations !== undefined && { maxUtilisations: data.maxUtilisations }),
        ...(data.actif !== undefined && { actif: data.actif }),
        ...(data.debut !== undefined && { debut: data.debut }),
        ...(data.fin !== undefined && { fin: data.fin }),
      },
    });
  }

  async supprimerCoupon(id: string) {
    await prisma.coupon.delete({ where: { id } });
  }

  async incrementerUtilisationCoupon(id: string) {
    await prisma.coupon.update({
      where: { id },
      data: { utilisations: { increment: 1 } },
    });
  }

  async trouverClientParCodeParrainage(code: string) {
    return prisma.customer.findUnique({
      where: { codeParrainage: code.trim().toUpperCase() },
    });
  }

  async compterCommandesPayees(customerId: string) {
    return prisma.order.count({
      where: {
        customerId,
        statut: { in: ['PAYEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE'] },
      },
    });
  }

  async obtenirParrainageClient(customerId: string) {
    return prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        parrainId: true,
        codeParrainage: true,
        parrain: {
          select: { id: true, nom: true, codeParrainage: true },
        },
      },
    });
  }

  async listerFilleuls(parrainId: string, limit = 20) {
    return prisma.customer.findMany({
      where: { parrainId },
      select: {
        id: true,
        nom: true,
        createdAt: true,
        _count: {
          select: {
            commandes: {
              where: {
                statut: { in: ['PAYEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE'] },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async compterFilleuls(parrainId: string) {
    return prisma.customer.count({ where: { parrainId } });
  }

  async listerFlashSales() {
    return prisma.flashSale.findMany({ orderBy: { debut: 'desc' } });
  }

  async trouverFlashSaleActive() {
    const now = new Date();
    return prisma.flashSale.findFirst({
      where: {
        actif: true,
        debut: { lte: now },
        fin: { gte: now },
      },
      orderBy: { fin: 'asc' },
    });
  }

  async creerFlashSale(dto: CreerFlashSaleDto) {
    return prisma.flashSale.create({
      data: {
        titre: dto.titre.trim(),
        slug: dto.slug.trim().toLowerCase(),
        description: dto.description?.trim() || null,
        debut: dto.debut,
        fin: dto.fin,
        actif: dto.actif ?? true,
        productIds: dto.productIds,
      },
    });
  }

  async mettreAJourFlashSale(
    id: string,
    data: Partial<CreerFlashSaleDto> & { actif?: boolean },
  ) {
    return prisma.flashSale.update({
      where: { id },
      data: {
        ...(data.titre !== undefined && { titre: data.titre.trim() }),
        ...(data.slug !== undefined && { slug: data.slug.trim().toLowerCase() }),
        ...(data.description !== undefined && {
          description: data.description?.trim() || null,
        }),
        ...(data.debut !== undefined && { debut: data.debut }),
        ...(data.fin !== undefined && { fin: data.fin }),
        ...(data.actif !== undefined && { actif: data.actif }),
        ...(data.productIds !== undefined && { productIds: data.productIds }),
      },
    });
  }

  async supprimerFlashSale(id: string) {
    await prisma.flashSale.delete({ where: { id } });
  }
}

export const marketingRepository = new MarketingRepository();
