import { unstable_cache } from 'next/cache';
import { productService } from '@/modules/produits/services/product.service';
import { reviewService } from '@/modules/commandes/services/review.service';
import { avisService } from '@/modules/avis/services/review.service';
import { marketingService } from '@/modules/marketing/services/marketing.service';
import { categorieVersVitrine } from '@/modules/produits/lib/category-showcase';
import { chargerNotesProduits } from '@/modules/produits/lib/product-ratings';

/** Données homepage — cache partagé entre requêtes (120 s). */
export const getCachedHomeCatalog = unstable_cache(
  async () => {
    const [featured, latest, statsPromos, flashActive] = await Promise.all([
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

    return { featured, latest, statsPromos, flash, notesProduits };
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
      reviewService.listerAvisPublics(6),
      reviewService.compterAvisSatisfaits(),
    ]);
    return { avisClients, totalAvis };
  },
  ['home-reviews'],
  { revalidate: 300, tags: ['reviews'] },
);

export const getCachedPromosPage = unstable_cache(
  async () => {
    const [categories, stats, produits] = await Promise.all([
      productService.listerCategories(),
      productService.obtenirStatsPromos(),
      productService.listerPromotionsActives(),
    ]);
    return { categories, stats, produits };
  },
  ['promos-page'],
  { revalidate: 60, tags: ['products', 'promos'] },
);
