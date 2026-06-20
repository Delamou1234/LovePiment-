import { productRepository, type ProductRepository } from '../repository/product.repository';
import type {
  ProduitAvecVariantes,
  ProduitAvecCategorie,
  CreerProduitDto,
  ModifierProduitDto,
  FiltresProduits,
  TriProduits,
} from '../types';
import type { Pagination } from '@/types';

// ─── ProductService — logique métier ──────────────────────────────────────────
// Principe SOLID S : responsabilité unique — gestion des produits.
// Principe SOLID D : dépend du repository (abstraction), pas de Prisma directement.

export class ProductService {
  constructor(private readonly repo: ProductRepository = productRepository) {}

  async listerProduits(
    filtres?: FiltresProduits,
    tri?: TriProduits,
    pagination?: { page: number; limit: number },
  ): Promise<{ produits: ProduitAvecCategorie[]; pagination: Pagination }> {
    return this.repo.trouverTous(filtres, tri, pagination);
  }

  async obtenirProduit(slug: string): Promise<ProduitAvecVariantes> {
    const produit = await this.repo.trouverParSlug(slug);
    if (!produit) {
      throw new Error(`Produit introuvable : ${slug}`);
    }
    return produit;
  }

  async obtenirProduitsSimilaires(productId: string, categorieId: string): Promise<ProduitAvecCategorie[]> {
    return this.repo.trouverSimilaires(productId, categorieId);
  }

  async creerProduit(dto: CreerProduitDto): Promise<ProduitAvecVariantes> {
    // Génération du slug si absent
    if (!dto.slug) {
      dto.slug = this.genererSlug(dto.nom);
    }
    return this.repo.creer(dto);
  }

  async modifierProduit(id: string, dto: ModifierProduitDto): Promise<ProduitAvecVariantes> {
    const existant = await this.repo.trouverParId(id);
    if (!existant) {
      throw new Error(`Produit introuvable : ${id}`);
    }
    return this.repo.modifier(id, dto);
  }

  async supprimerProduit(id: string): Promise<void> {
    return this.repo.supprimer(id);
  }

  async toggleActif(id: string): Promise<{ actif: boolean }> {
    return this.repo.toggleActif(id);
  }

  private genererSlug(nom: string): string {
    return nom
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // supprime accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

// Singleton exporté
export const productService = new ProductService();
