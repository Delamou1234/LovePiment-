import { prisma } from '@/shared/lib/prisma';
import { marketingService } from '@/modules/marketing/services/marketing.service';
import { decrementerStockPourArticles, restaurerStockPourArticles } from '@/modules/produits/lib/order-stock';
import type { CommandeAvecItems, CreerCommandeDto, FiltresCommandes } from '../types';
import type { Pagination } from '@/types';

export class OrderRepository {
  async creer(dto: CreerCommandeDto): Promise<CommandeAvecItems> {
    const sousTotalBrut = dto.items.reduce(
      (acc, item) => acc + item.prixUnitaire * item.quantite,
      0,
    );

    const totaux = await marketingService.calculerTotaux({
      sousTotal: sousTotalBrut,
      clientVille: dto.clientVille,
      customerId: dto.customerId,
      codeCoupon: dto.codeCoupon,
      pointsUtilises: dto.pointsUtilises,
      codeParrainage: dto.codeParrainage,
    });

    const crediterPoints = dto.modePaiement === 'PAIEMENT_LIVRAISON';

    return prisma.$transaction(async (tx) => {
      await decrementerStockPourArticles(tx, dto.items);

      const order = await tx.order.create({
        data: {
          customerId: dto.customerId,
          clientNom: dto.clientNom,
          clientTelephone: dto.clientTelephone,
          clientAdresse: dto.clientAdresse,
          clientVille: dto.clientVille,
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
        include: {
          items: {
            include: {
              variante: {
                include: {
                  produit: { select: { nom: true, images: true, slug: true } },
                },
              },
            },
          },
        },
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
      include: {
        items: {
          include: {
            variante: {
              include: {
                produit: { select: { nom: true, images: true, slug: true } },
              },
            },
          },
        },
      },
    }) as any;
  }

  async lister(
    filtres: FiltresCommandes = {},
    pagination = { page: 1, limit: 20 },
  ): Promise<{ commandes: CommandeAvecItems[]; pagination: Pagination }> {
    const where = {
      ...(filtres.statut && { statut: filtres.statut as any }),
      ...(filtres.statutIn?.length && { statut: { in: filtres.statutIn as any } }),
      ...(filtres.statutNotIn?.length && { statut: { notIn: filtres.statutNotIn as any } }),
      ...(filtres.statutPaiement && { statutPaiement: filtres.statutPaiement as any }),
      ...(filtres.statutPaiementNot && {
        statutPaiement: { not: filtres.statutPaiementNot as any },
      }),
      ...(filtres.modePaiement && { modePaiement: filtres.modePaiement as any }),
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
          items: {
            include: {
              variante: {
                include: {
                  produit: { select: { nom: true, images: true, slug: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pagination.limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      commandes: commandes as any,
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
      data: { statut: statut as any },
    });
  }

  async mettreAJourPaiement(id: string, data: {
    statutPaiement: string;
    cinetpayTxId?: string;
  }): Promise<void> {
    await prisma.order.update({
      where: { id },
      data: {
        statutPaiement: data.statutPaiement as any,
        ...(data.cinetpayTxId && { cinetpayTxId: data.cinetpayTxId }),
        ...(data.statutPaiement === 'REUSSIE' && { statut: 'PAYEE' as any }),
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
            statutPaiement: options.statutPaiement as any,
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
