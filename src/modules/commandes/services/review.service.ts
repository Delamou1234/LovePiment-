import { orderRepository, type OrderRepository } from '../repository/order.repository';
import { avisService } from '@/modules/avis/services/review.service';
import { anonymiserNomClient } from '@/modules/avis/lib/anonymiser';
import type { AvisClientPublic } from '../types/avis';

export class ReviewService {
  constructor(private readonly repo: OrderRepository = orderRepository) {}

  async listerAvisPublics(limit = 6): Promise<AvisClientPublic[]> {
    const [productReviews, orderReviews] = await Promise.all([
      avisService.listerAvisRecents(limit),
      this.repo.listerAvisSatisfaits(limit),
    ]);

    const fromProducts = productReviews.map((a) => ({
      id: a.id,
      nom: a.nom,
      ville: a.ville ?? 'Conakry',
      commentaire: a.commentaire,
      date: a.date,
      note: a.note,
      photos: a.photos,
      achatVerifie: a.achatVerifie,
      productNom: a.productNom,
    }));

    if (fromProducts.length >= limit) return fromProducts.slice(0, limit);

    const fromOrders = orderReviews
      .filter((o) => !fromProducts.some((p) => p.id === o.id))
      .map((o) => ({
        id: o.id,
        nom: anonymiserNomClient(o.clientNom),
        ville: o.clientVille,
        commentaire:
          o.satisfactionCommentaire?.trim() ||
          'Client satisfait de sa commande Love Piment&.',
        date: (o.satisfactionLe ?? new Date()).toISOString(),
        note: 5 as number,
        photos: [] as string[],
        achatVerifie: true,
      }));

    return [...fromProducts, ...fromOrders].slice(0, limit);
  }

  async compterAvisSatisfaits(): Promise<number> {
    const [productCount, orderCount] = await Promise.all([
      avisService.compterAvisApprouves(),
      this.repo.compterAvisSatisfaits(),
    ]);
    return productCount + orderCount;
  }
}

export const reviewService = new ReviewService();
