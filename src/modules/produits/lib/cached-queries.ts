import { unstable_cache } from 'next/cache';
import { productService } from '@/modules/produits/services/product.service';
import { avisService } from '@/modules/avis/services/review.service';
import { reviewService } from '@/modules/commandes/services/review.service';
import { marketingService } from '@/modules/marketing/services/marketing.service';
import { categorieVersVitrine } from '@/modules/produits/lib/category-showcase';
import { chargerNotesProduits } from '@/modules/produits/lib/product-ratings';

/** Données homepage — cache partagé entre requêtes (120 s). */
export const getCachedHomeCatalog = unstable_cache(
  async () => {
    const [featured, latest, statsPromos, flashActive, promosActives] = await Promise.all([
      productService.listerProduits(
        { featured: true, actif: true },
        { champ: 'createdAt', ordre: 'desc' },
        { page: 1, limit: 8 },
      ),
      productService.listerProduits(
        { actif: true },
        { champ: 'createdAt', ordre: 'desc' },
        { page: 1, limit: 4 },
      ),
      productService.obtenirStatsPromos(),
      marketingService.obtenirFlashActive(),
      productService.listerPromotionsActives(),
    ]);

    const productIds = [
      ...featured.produits.map((p) => p.id),
      ...latest.produits.map((p) => p.id),
    ];
    const notesProduits = await chargerNotesProduits(productIds, (ids: string[]) =>
      avisService.statsPlusieursProduits(ids),
    );

    const flash = flashActive
      ? {
          titre: flashActive.titre,
          slug: flashActive.slug,
          fin: flashActive.fin.toISOString(),
          productCount: flashActive.productIds.length,
        }
      : null;

    const promoBanniere = promosActives
      .filter((p) => p.images[0])
      .slice(0, 6)
      .map((p) => ({
        src: p.images[0]!,
        alt: p.nom,
        slug: p.slug,
      }));

    return { featured, latest, statsPromos, flash, notesProduits, promoBanniere };
  },
  ['home-catalog'],
  { revalidate: 120, tags: ['products', 'promos', 'reviews'] },
);

export const getCachedHomeCategories = unstable_cache(
  async () => {
    const categories = await productService.listerCategoriesVitrine();
    return categories.map(categorieVersVitrine);
  },
  ['home-categories'],
  { revalidate: 120, tags: ['products', 'categories'] },
);

export const getCachedHomeReviews = unstable_cache(
  async () => {
    const [avisClients, totalAvis] = await Promise.all([
      reviewService.listerAvisPublics(12),
      reviewService.compterAvisSatisfaits(),
    ]);
    return { avisClients, totalAvis };
  },
  ['home-reviews'],
  { revalidate: 300, tags: ['reviews'] },
);

/** Fiche produit — cache 120 s par slug. */
export async function getCachedProduct(slug: string) {
  return unstable_cache(
    () => productService.obtenirProduit(slug),
    ['product-detail', slug],
    { revalidate: 120, tags: ['products', `product-${slug}`] },
  )();
}

/** Stock par slug — cache court (20 s) pour limiter la charge DB. */
export async function getCachedProductStock(slug: string) {
  return unstable_cache(
    () => productService.obtenirStockParSlug(slug),
    ['product-stock', slug],
    { revalidate: 20, tags: ['products', `product-${slug}`, 'stock'] },
  )();
}

/** Produits similaires — cache 5 min. */
export async function getCachedSimilarProducts(productId: string, categorieId: string) {
  return unstable_cache(
    () => productService.obtenirProduitsSimilaires(productId, categorieId, 6),
    ['similar-products', productId, categorieId],
    { revalidate: 300, tags: ['products'] },
  )();
}

export const getCachedCategoriesArbre = unstable_cache(
  async () => productService.listerCategoriesArbre(),
  ['categories-arbre'],
  { revalidate: 300, tags: ['products', 'categories'] },
);

export const getCachedCategoriesApi = unstable_cache(
  async () => {
    const [vitrine, arbre] = await Promise.all([
      productService.listerCategoriesVitrine(),
      productService.listerCategoriesArbre(),
    ]);
    return { vitrine, arbre };
  },
  ['categories-api'],
  { revalidate: 300, tags: ['products', 'categories'] },
);

export async function getCachedPromosPage(categorieSlug?: string) {
  return unstable_cache(
    async () => {
      const { promosPageService } = await import('@/modules/produits/services/promos-page.service');
      return promosPageService.charger(categorieSlug || undefined);
    },
    ['promos-page-v2', categorieSlug ?? 'all'],
    { revalidate: 60, tags: ['products', 'promos'] },
  )();
}
