import { prisma } from '@/shared/lib/prisma';
import { mockDb } from '@/shared/lib/mock-db';
import type { CommandeAvecItems, CreerCommandeDto, FiltresCommandes } from '../types';
import type { Pagination } from '@/types';

// ─── OrderRepository — accès aux données (Prisma ou Mock) ─────────────────────

export class OrderRepository {
  private isMock = process.env.MOCK_DATABASE === 'true';

  async creer(dto: CreerCommandeDto): Promise<CommandeAvecItems> {
    if (this.isMock) {
      return mockDb.createOrder(dto) as any;
    }

    const montantTotal = dto.items.reduce(
      (acc, item) => acc + item.prixUnitaire * item.quantite,
      0,
    );

    return prisma.order.create({
      data: {
        clientNom: dto.clientNom,
        clientTelephone: dto.clientTelephone,
        clientAdresse: dto.clientAdresse,
        clientVille: dto.clientVille,
        modePaiement: dto.modePaiement,
        montantTotal,
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
    }) as any;
  }

  async trouverParId(id: string): Promise<CommandeAvecItems | null> {
    if (this.isMock) {
      return (mockDb.getOrderById(id) as any) || null;
    }

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
    if (this.isMock) {
      let orders = [...mockDb.getOrders()];

      // Filtre statut
      if (filtres.statut) {
        orders = orders.filter((o) => o.statut === filtres.statut);
      }

      // Filtre modePaiement
      if (filtres.modePaiement) {
        orders = orders.filter((o) => o.modePaiement === filtres.modePaiement);
      }

      // Filtres dates
      if (filtres.dateDebut) {
        orders = orders.filter((o) => o.createdAt >= filtres.dateDebut!);
      }
      if (filtres.dateFin) {
        orders = orders.filter((o) => o.createdAt <= filtres.dateFin!);
      }

      // Pagination
      const total = orders.length;
      const skip = (pagination.page - 1) * pagination.limit;
      const paginated = orders.slice(skip, skip + pagination.limit);

      return {
        commandes: paginated as any,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      };
    }

    const where = {
      ...(filtres.statut && { statut: filtres.statut as any }),
      ...(filtres.modePaiement && { modePaiement: filtres.modePaiement as any }),
      ...(filtres.dateDebut || filtres.dateFin
        ? {
            createdAt: {
              ...(filtres.dateDebut && { gte: filtres.dateDebut }),
              ...(filtres.dateFin && { lte: filtres.dateFin }),
            },
          }
        : {}),
    };

    const skip = (pagination.page - 1) * pagination.limit;
    const [commandes, total] = await Promise.all([
      prisma.order.findMany({
        where,
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
    if (this.isMock) {
      mockDb.updateOrderStatus(id, statut);
      return;
    }

    await prisma.order.update({
      where: { id },
      data: { statut: statut as any },
    });
  }

  async mettreAJourPaiement(id: string, data: {
    statutPaiement: string;
    cinetpayTxId?: string;
  }): Promise<void> {
    if (this.isMock) {
      mockDb.updateOrderPayment(id, data);
      return;
    }

    await prisma.order.update({
      where: { id },
      data: {
        statutPaiement: data.statutPaiement as any,
        ...(data.cinetpayTxId && { cinetpayTxId: data.cinetpayTxId }),
        ...(data.statutPaiement === 'REUSSIE' && { statut: 'PAYEE' as any }),
      },
    });
  }
}

export const orderRepository = new OrderRepository();
