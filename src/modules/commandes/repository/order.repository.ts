import { prisma } from '@/shared/lib/prisma';
import { marketingService } from '@/modules/marketing/services/marketing.service';
import { marketingRepository } from '@/modules/marketing/repository/marketing.repository';
import { codeCouponBienvenueAuto } from '@/modules/marketing/services/welcome-offer.service';
import { decrementerStockPourArticles, restaurerStockPourArticles } from '@/modules/produits/lib/order-stock';
import { normaliserTelephoneGuinee } from '@/shared/lib/phone-guinea';
import type { CommandeAvecItems, CreerCommandeDto, FiltresCommandes } from '../types';
import type { Pagination } from '@/types';
import type { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';

const orderInclude = {
  items: {
    include: {
      variante: {
        include: {
          produit: { select: { nom: true, images: true, slug: true } },
        },
      },
    },
  },
} as const;

export class OrderRepository {
  async creer(dto: CreerCommandeDto): Promise<CommandeAvecItems> {
    const sousTotalBrut = dto.items.reduce(
      (acc, item) => acc + item.prixUnitaire * item.quantite,
      0,
    );

    let estPremiereCommande = false;
    if (dto.customerId) {
      const payees = await marketingRepository.compterCommandesPayees(dto.customerId);
      estPremiereCommande = payees === 0;
    }

    let codeCoupon = dto.codeCoupon?.trim() || null;
    if (!codeCoupon && estPremiereCommande) {
      codeCoupon = await codeCouponBienvenueAuto(true);
    }

    const totaux = await marketingService.calculerTotaux({
      sousTotal: sousTotalBrut,
      clientVille: dto.clientVille,
      clientCommune: dto.clientCommune,
      customerId: dto.customerId,
      codeCoupon,
      pointsUtilises: dto.pointsUtilises,
      codeParrainage: dto.codeParrainage,
      estPremiereCommande,
    });

    const crediterPoints = false;
    const telephonePaiement =
      normaliserTelephoneGuinee(dto.paymentTelephone ?? dto.clientTelephone) ??
      dto.paymentTelephone?.trim() ??
      dto.clientTelephone;

    return prisma.$transaction(async (tx) => {
      await decrementerStockPourArticles(tx, dto.items);

      const order = await tx.order.create({
        data: {
          customerId: dto.customerId,
          clientNom: dto.clientNom,
          clientTelephone: dto.clientTelephone,
          paymentTelephone: telephonePaiement,
          clientAdresse: dto.clientAdresse,
          clientVille: dto.clientVille,
          clientCommune: dto.clientCommune?.trim() || null,
          clientQuartier: dto.clientQuartier?.trim() || null,
          clientRepere: dto.clientRepere?.trim() || null,
          creneauLivraison: dto.creneauLivraison?.trim() || null,
          notes: dto.notes?.trim() || null,
          estPremiereCommande,
          clientLatitude: dto.clientLatitude ?? undefined,
          clientLongitude: dto.clientLongitude ?? undefined,
          modePaiement: dto.modePaiement,
          sousTotal: totaux.sousTotal,
          fraisLivraison: totaux.fraisLivraison,
          remiseCoupon: totaux.remiseCoupon,
          remisePoints: totaux.remisePoints,
          remiseParrainage: totaux.remiseParrainage,
          pointsUtilises: totaux.pointsUtilises,
          pointsGagnes: totaux.pointsGagnes,
          pointsCredites: crediterPoints,
          montantTotal: totaux.montantTotal,
          couponId: totaux.couponId,
          codeParrainageUtilise: totaux.codeParrainageUtilise,
          items: {
            create: dto.items.map((item) => ({
              variantId: item.variantId,
              quantite: item.quantite,
              prixUnitaire: item.prixUnitaire,
            })),
          },
        },
        include: orderInclude,
      });

      if (dto.customerId) {
        await marketingService.appliquerEffetsCommande(tx, {
          orderId: order.id,
          customerId: dto.customerId,
          couponId: totaux.couponId,
          pointsUtilises: totaux.pointsUtilises,
          pointsGagnes: totaux.pointsGagnes,
          codeParrainageUtilise: totaux.codeParrainageUtilise,
          crediterPoints,
        });
      }

      return order as CommandeAvecItems;
    });
  }

  async trouverParId(id: string): Promise<CommandeAvecItems | null> {
    return prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    }) as Promise<CommandeAvecItems | null>;
  }

  async lister(
    filtres: FiltresCommandes = {},
    pagination = { page: 1, limit: 20 },
  ): Promise<{ commandes: CommandeAvecItems[]; pagination: Pagination }> {
    const where: Prisma.OrderWhereInput = {
      ...(filtres.statut && { statut: filtres.statut as OrderStatus }),
      ...(filtres.statutIn?.length && { statut: { in: filtres.statutIn as OrderStatus[] } }),
      ...(filtres.statutNotIn?.length && { statut: { notIn: filtres.statutNotIn as OrderStatus[] } }),
      ...(filtres.statutPaiement && { statutPaiement: filtres.statutPaiement as PaymentStatus }),
      ...(filtres.statutPaiementNot && {
        statutPaiement: { not: filtres.statutPaiementNot as PaymentStatus },
      }),
      ...(filtres.modePaiement && { modePaiement: filtres.modePaiement as PaymentMethod }),
      ...(filtres.dateDebut || filtres.dateFin
        ? {
            createdAt: {
              ...(filtres.dateDebut && { gte: filtres.dateDebut }),
              ...(filtres.dateFin && { lte: filtres.dateFin }),
            },
          }
        : {}),
      ...(filtres.customerId && { customerId: filtres.customerId }),
    };

    const skip = (pagination.page - 1) * pagination.limit;
    const [commandes, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          courier: { select: { id: true, nom: true } },
          deliveryRun: { select: { id: true, label: true } },
          ...orderInclude,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pagination.limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      commandes: commandes as CommandeAvecItems[],
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async mettreAJourStatut(id: string, statut: string): Promise<void> {
    await prisma.order.update({
      where: { id },
      data: { statut: statut as OrderStatus },
    });
  }

  async mettreAJourTelephonePaiement(id: string, paymentTelephone: string): Promise<void> {
    await prisma.order.update({
      where: { id },
      data: { paymentTelephone },
    });
  }

  async mettreAJourPaiement(id: string, data: {
    statutPaiement: string;
    paymentOrderId?: string;
    paymentPayToken?: string;
    paymentNotifToken?: string;
  }): Promise<void> {
    await prisma.order.update({
      where: { id },
      data: {
        statutPaiement: data.statutPaiement as PaymentStatus,
        ...(data.paymentOrderId && { paymentOrderId: data.paymentOrderId }),
        ...(data.paymentPayToken && { paymentPayToken: data.paymentPayToken }),
        ...(data.paymentNotifToken && { paymentNotifToken: data.paymentNotifToken }),
        ...(data.statutPaiement === 'REUSSIE' && { statut: 'PAYEE' as OrderStatus }),
      },
    });

    if (data.statutPaiement === 'REUSSIE') {
      await marketingService.confirmerPointsApresPaiement(id);
    }
  }

  async annulerEtRestaurerStock(
    id: string,
    options: { statutPaiement?: string } = {},
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order || order.statut === 'ANNULEE') return;

      await restaurerStockPourArticles(tx, order.items);

      await tx.order.update({
        where: { id },
        data: {
          statut: 'ANNULEE',
          ...(options.statutPaiement && {
            statutPaiement: options.statutPaiement as PaymentStatus,
          }),
        },
      });
    });
  }

  async listerAvisSatisfaits(limit = 6) {
    return prisma.order.findMany({
      where: { satisfactionStatut: 'SATISFAIT' },
      orderBy: { satisfactionLe: 'desc' },
      take: limit,
      select: {
        id: true,
        clientNom: true,
        clientVille: true,
        satisfactionCommentaire: true,
        satisfactionLe: true,
      },
    });
  }

  async compterAvisSatisfaits() {
    return prisma.order.count({ where: { satisfactionStatut: 'SATISFAIT' } });
  }
}

export const orderRepository = new OrderRepository();
