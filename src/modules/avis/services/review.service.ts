import type { ReviewStatus } from '@prisma/client';
import { reviewRepository, type ReviewRepository } from '../repository/review.repository';
import { anonymiserNomClient } from '../lib/anonymiser';
import type {
  AvisAdmin,
  AvisEligible,
  AvisProduitPublic,
  AvisProduitStats,
  CreerAvisDto,
} from '../types';

const MAX_PHOTOS = 3;
const MAX_COMMENTAIRE = 2000;

export class AvisService {
  constructor(private readonly repo: ReviewRepository = reviewRepository) {}

  async listerAvisProduit(
    productId: string,
    page = 1,
    limit = 10,
  ): Promise<{ avis: AvisProduitPublic[]; pagination: { page: number; total: number; totalPages: number } }> {
    const { rows, total, totalPages, page: p } = await this.repo.listerParProduit(productId, page, limit);

    return {
      avis: rows.map((r) => ({
        id: r.id,
        nom: anonymiserNomClient(r.customer.nom),
        ville: r.order.clientVille,
        note: r.note,
        commentaire: r.commentaire,
        photos: r.photos,
        achatVerifie: r.achatVerifie,
        date: r.createdAt.toISOString(),
      })),
      pagination: { page: p, total, totalPages },
    };
  }

  async statsProduit(productId: string): Promise<AvisProduitStats> {
    return this.repo.statsProduit(productId);
  }

  async statsPlusieursProduits(productIds: string[]) {
    return this.repo.statsPlusieursProduits(productIds);
  }

  async listerAvisRecents(limit = 6): Promise<AvisProduitPublic[]> {
    const rows = await this.repo.listerRecentsApprouves(limit);
    return rows.map((r) => ({
      id: r.id,
      nom: anonymiserNomClient(r.customer.nom),
      ville: r.order.clientVille,
      note: r.note,
      commentaire: r.commentaire,
      photos: r.photos,
      achatVerifie: r.achatVerifie,
      date: r.createdAt.toISOString(),
      productNom: r.product.nom,
    }));
  }

  async compterAvisApprouves() {
    return this.repo.compterApprouves();
  }

  async listerEligibles(customerId: string): Promise<AvisEligible[]> {
    return this.repo.listerEligibles(customerId);
  }

  async creerAvis(customerId: string, dto: CreerAvisDto) {
    if (dto.note < 1 || dto.note > 5 || !Number.isInteger(dto.note)) {
      throw new Error('La note doit être entre 1 et 5 étoiles');
    }

    const commentaire = dto.commentaire.trim();
    if (commentaire.length < 10) {
      throw new Error('Le commentaire doit contenir au moins 10 caractères');
    }
    if (commentaire.length > MAX_COMMENTAIRE) {
      throw new Error(`Commentaire trop long (max ${MAX_COMMENTAIRE} caractères)`);
    }

    const photos = (dto.photos ?? []).slice(0, MAX_PHOTOS);

    const achatOk = await this.repo.verifierAchat(customerId, dto.orderId, dto.productId);
    if (!achatOk) {
      throw new Error('Achat non vérifié — seuls les clients ayant reçu ce produit peuvent laisser un avis');
    }

    const existing = await this.repo.trouverParOrderEtProduit(dto.orderId, dto.productId);
    if (existing) {
      throw new Error('Vous avez déjà noté ce produit pour cette commande');
    }

    return this.repo.creer({
      productId: dto.productId,
      customerId,
      orderId: dto.orderId,
      note: dto.note,
      commentaire,
      photos,
    });
  }

  async listerAdmin(filtre?: ReviewStatus): Promise<AvisAdmin[]> {
    const rows = await this.repo.listerAdmin(filtre);
    return rows.map((r) => ({
      id: r.id,
      note: r.note,
      commentaire: r.commentaire,
      photos: r.photos,
      achatVerifie: r.achatVerifie,
      statut: r.statut,
      createdAt: r.createdAt.toISOString(),
      clientNom: r.customer.nom,
      clientVille: r.order.clientVille,
      productNom: r.product.nom,
      productSlug: r.product.slug,
    }));
  }

  async moderer(id: string, statut: ReviewStatus) {
    return this.repo.moderer(id, statut);
  }
}

export const avisService = new AvisService();
