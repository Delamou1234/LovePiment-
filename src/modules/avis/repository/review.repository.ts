import { prisma } from '@/shared/lib/prisma';
import type { ReviewStatus } from '@prisma/client';

export class ReviewRepository {
  async listerParProduit(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = { productId, statut: 'APPROUVE' as ReviewStatus };

    const [rows, total] = await Promise.all([
      prisma.productReview.findMany({
        where,
        include: {
          customer: { select: { nom: true } },
          order: { select: { clientVille: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.productReview.count({ where }),
    ]);

    return { rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async statsProduit(productId: string) {
    const [aggregate, groups] = await Promise.all([
      prisma.productReview.aggregate({
        where: { productId, statut: 'APPROUVE' },
        _avg: { note: true },
        _count: true,
      }),
      prisma.productReview.groupBy({
        by: ['note'],
        where: { productId, statut: 'APPROUVE' },
        _count: true,
      }),
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
    for (const row of groups) {
      const n = Math.min(5, Math.max(1, row.note)) as 1 | 2 | 3 | 4 | 5;
      distribution[n] = row._count;
    }

    const total = aggregate._count;
    const moyenne =
      total > 0 && aggregate._avg.note != null
        ? Math.round(aggregate._avg.note * 10) / 10
        : 0;

    return { moyenne, total, distribution };
  }

  async statsPlusieursProduits(productIds: string[]) {
    if (productIds.length === 0) return new Map<string, { moyenne: number; total: number }>();

    const rows = await prisma.productReview.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds }, statut: 'APPROUVE' },
      _avg: { note: true },
      _count: { id: true },
    });

    return new Map(
      rows.map((r) => [
        r.productId,
        {
          moyenne: Math.round((r._avg.note ?? 0) * 10) / 10,
          total: r._count.id,
        },
      ]),
    );
  }

  async listerRecentsApprouves(limit = 6) {
    return prisma.productReview.findMany({
      where: { statut: 'APPROUVE' },
      include: {
        customer: { select: { nom: true } },
        order: { select: { clientVille: true } },
        product: { select: { nom: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async compterApprouves() {
    return prisma.productReview.count({ where: { statut: 'APPROUVE' } });
  }

  async trouverParOrderEtProduit(orderId: string, productId: string) {
    return prisma.productReview.findUnique({
      where: { orderId_productId: { orderId, productId } },
    });
  }

  async creer(data: {
    productId: string;
    customerId: string;
    orderId: string;
    note: number;
    commentaire: string;
    photos: string[];
  }) {
    return prisma.productReview.create({
      data: {
        ...data,
        achatVerifie: true,
        statut: 'APPROUVE',
      },
    });
  }

  async listerEligibles(customerId: string) {
    const commandes = await prisma.order.findMany({
      where: {
        customerId,
        statut: 'LIVREE',
      },
      include: {
        items: {
          include: {
            variante: {
              include: {
                produit: { select: { id: true, nom: true, slug: true, images: true } },
              },
            },
          },
        },
        avis: { select: { productId: true } },
      },
      orderBy: { livreeLe: 'desc' },
    });

    const dejaAvis = new Set<string>();
    const eligibles: {
      orderId: string;
      productId: string;
      productNom: string;
      productSlug: string;
      productImage: string | null;
      commandeDate: string;
    }[] = [];

    for (const cmd of commandes) {
      const avisProduits = new Set(cmd.avis.map((a) => a.productId));
      const seenInOrder = new Set<string>();

      for (const item of cmd.items) {
        const productId = item.variante.produit.id;
        if (avisProduits.has(productId) || seenInOrder.has(productId)) continue;
        seenInOrder.add(productId);

        const globalKey = `${cmd.id}-${productId}`;
        if (dejaAvis.has(globalKey)) continue;
        dejaAvis.add(globalKey);

        eligibles.push({
          orderId: cmd.id,
          productId,
          productNom: item.variante.produit.nom,
          productSlug: item.variante.produit.slug,
          productImage: item.variante.produit.images[0] ?? null,
          commandeDate: (cmd.livreeLe ?? cmd.createdAt).toISOString(),
        });
      }
    }

    return eligibles;
  }

  async verifierAchat(customerId: string, orderId: string, productId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, customerId, statut: 'LIVREE' },
      include: {
        items: { include: { variante: { select: { productId: true } } } },
      },
    });
    if (!order) return false;
    return order.items.some((i) => i.variante.productId === productId);
  }

  async listerAdmin(filtre?: ReviewStatus) {
    return prisma.productReview.findMany({
      where: filtre ? { statut: filtre } : undefined,
      include: {
        customer: { select: { nom: true } },
        order: { select: { clientVille: true } },
        product: { select: { nom: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async moderer(id: string, statut: ReviewStatus) {
    return prisma.productReview.update({
      where: { id },
      data: { statut, modereLe: new Date() },
    });
  }

  async supprimer(id: string) {
    return prisma.productReview.delete({ where: { id } });
  }
}

export const reviewRepository = new ReviewRepository();
