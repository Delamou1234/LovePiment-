import { productRepository, type ProductRepository } from '../repository/product.repository';
import type {
  ProduitAvecVariantes,
  ProduitAvecCategorie,
  CreerProduitDto,
  ModifierProduitDto,
  FiltresProduits,
  TriProduits,
  SuggestionRecherche,
} from '../types';
import type { Pagination } from '@/types';
import { cache } from 'react';
import { calculerRemisePct } from '../lib/promo';

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

  async obtenirProduitsSimilaires(
    productId: string,
    categorieId: string,
    limit = 4,
  ): Promise<ProduitAvecCategorie[]> {
    return this.repo.trouverSimilaires(productId, categorieId, limit);
  }

  async listerPromotionsActives(filtres?: { categorieSlug?: string }) {
    return getPromotionsActivesCached(filtres?.categorieSlug);
  }

  async obtenirStatsPromos() {
    const produits = await getPromotionsActivesCached();
    const remises = produits
      .map((p) =>
        p.prixPromo != null
          ? calculerRemisePct(Number(p.prix), Number(p.prixPromo))
          : 0,
      )
      .filter((r) => r > 0);
    return {
      total: produits.length,
      remiseMax: remises.length ? Math.max(...remises) : 0,
    };
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

  async suggererRecherche(query: string): Promise<SuggestionRecherche[]> {
    return this.repo.suggererRecherche(query);
  }

  async listerCategories() {
    return this.repo.listerCategories();
  }

  async listerCategoriesArbre() {
    return this.repo.listerCategoriesArbre();
  }

  async listerCategoriesAdmin() {
    return this.repo.listerCategoriesAdmin();
  }

  async listerCategoriesVitrine() {
    return this.repo.listerCategoriesVitrine();
  }

  async creerCategorie(data: {
    nom: string;
    slug?: string;
    image?: string | null;
    parentId?: string | null;
    actif?: boolean;
  }) {
    const slug = data.slug?.trim() || this.genererSlug(data.nom);
    if (!slug) throw new Error('Slug invalide');
    return this.repo.creerCategorie({ ...data, slug });
  }

  async mettreAJourCategorie(
    id: string,
    data: {
      nom?: string;
      slug?: string;
      image?: string | null;
      parentId?: string | null;
      actif?: boolean;
    },
  ) {
    if (data.parentId === id) {
      throw new Error('Une catégorie ne peut pas être sa propre parente');
    }
    return this.repo.mettreAJourCategorie(id, data);
  }

  async supprimerCategorie(id: string) {
    return this.repo.supprimerCategorie(id);
  }

  async obtenirFacettesCatalogue(filtres?: FiltresProduits) {
    return this.repo.obtenirFacettes(filtres);
  }

  async listerPourAdmin() {
    return this.repo.listerPourAdmin();
  }

  async obtenirStockParSlug(slug: string) {
    return this.repo.obtenirStockParSlug(slug);
  }

  async synchroniserVariantes(productId: string, variantes: NonNullable<CreerProduitDto['variantes']>) {
    return this.repo.synchroniserVariantes(productId, variantes);
  }

  async mettreAJourVariante(
    variantId: string,
    data: Parameters<ProductRepository['mettreAJourVariante']>[1],
  ) {
    return this.repo.mettreAJourVariante(variantId, data);
  }

  async obtenirProduitParId(id: string) {
    const produit = await this.repo.trouverParId(id);
    if (!produit) throw new Error(`Produit introuvable : ${id}`);
    return produit;
  }

  async obtenirProduitsParIds(ids: string[]) {
    return this.repo.trouverParIds(ids);
  }

  async listerStocks() {
    return this.repo.listerStocks();
  }

  async mettreAJourStock(variantId: string, stock: number) {
    return this.repo.mettreAJourStock(variantId, stock);
  }

  async mettreAJourPromo(
    id: string,
    data: {
      prixPromo?: number | null;
      promoDebut?: string | null;
      promoFin?: string | null;
      featured?: boolean;
    },
  ) {
    return this.repo.mettreAJourPromo(id, {
      prixPromo: data.prixPromo,
      promoDebut: data.promoDebut ? new Date(data.promoDebut) : data.promoDebut === null ? null : undefined,
      promoFin: data.promoFin ? new Date(data.promoFin) : data.promoFin === null ? null : undefined,
      featured: data.featured,
    });
  }

  genererSlug(nom: string): string {
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

const getPromotionsActivesCached = cache(async (categorieSlug?: string) => {
  const produits = await productRepository.trouverPromotionsActives(
    categorieSlug ? { categorieSlug } : {},
  );
  return produits.map((p) => ({
    ...p,
    prixNum: Number(p.prix),
    prixPromoNum: p.prixPromo != null ? Number(p.prixPromo) : null,
    remisePct:
      p.prixPromo != null ? calculerRemisePct(Number(p.prix), Number(p.prixPromo)) : 0,
  }));
});
