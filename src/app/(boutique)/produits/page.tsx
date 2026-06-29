import React, { Suspense } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Filter,
  Grid3X3,
  Lock,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/shared/components/ProductCard';
import { variantePourCarte } from '@/shared/lib/product-card';
import { getCachedCategoriesArbre } from '@/modules/produits/lib/cached-queries';
import { productService } from '@/modules/produits/services/product.service';
import { avisService } from '@/modules/avis/services/review.service';
import { notesPourProduit, chargerNotesProduits } from '@/modules/produits/lib/product-ratings';
import { CatalogFilters } from '@/modules/produits/components/catalog/CatalogFilters';
import { CatalogSearchBar } from '@/modules/produits/components/catalog/CatalogSearchBar';
import {
  buildCatalogUrl,
  catalogTriToRepository,
  CATALOG_PAGE_SIZE,
  CATALOG_TRI_OPTIONS,
  type CatalogSearchParams,
} from '@/modules/produits/lib/catalog-url';
import { CatalogPagination } from '@/modules/produits/components/catalog/CatalogPagination';
import type { ProduitAvecCategorie } from '@/modules/produits/types';

type SearchParams = Promise<CatalogSearchParams>;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const activeTri = params.tri || 'nouveautes';
  const currentPage = Math.max(1, Number(params.page) || 1);

  const filtres = {
    categorieSlug: params.categorie || undefined,
    taille: params.taille || undefined,
    couleur: params.couleur || undefined,
    marque: params.marque || undefined,
    search: params.search || undefined,
    enStock: params.enStock === '1' ? true : undefined,
    enPromo: params.promo === '1' ? true : undefined,
    prix: {
      min: params.prixMin ? Number(params.prixMin) : undefined,
      max: params.prixMax ? Number(params.prixMax) : undefined,
    },
  };

  const [categories, facettes, catalog] = await Promise.all([
    getCachedCategoriesArbre(),
    productService.obtenirFacettesCatalogue(filtres),
    productService.listerProduits(filtres, catalogTriToRepository(activeTri), {
      page: currentPage,
      limit: CATALOG_PAGE_SIZE,
    }),
  ]);
  const products: ProduitAvecCategorie[] = catalog.produits;
  const { pagination } = catalog;

  const notesMap = await chargerNotesProduits(
    products.map((p) => p.id),
    (ids: string[]) => avisService.statsPlusieursProduits(ids),
  );

  const hasActiveFilters = Boolean(
    params.categorie ||
      params.taille ||
      params.couleur ||
      params.marque ||
      params.search ||
      params.prixMin ||
      params.prixMax ||
      params.enStock ||
      params.promo,
  );

  const findCategoryName = (slug: string) => {
    for (const root of categories) {
      if (root.slug === slug) return root.nom;
      const child = root.children.find((c) => c.slug === slug);
      if (child) return child.nom;
    }
    return slug;
  };

  const pageTitle = params.categorie
    ? findCategoryName(params.categorie)
    : params.search
      ? `« ${params.search} »`
      : 'Notre boutique';

  const showCategoryShortcuts = !params.categorie && !params.search;

  return (
    <div className="animate-fadeIn shop-dash">
      <div className="container-shop shop-dash-inner">
        <header className="shop-dash-header">
          <div className="shop-dash-header-main">
            <nav className="shop-dash-breadcrumb" aria-label="Fil d'Ariane">
              <Link href="/">Accueil</Link>
              <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
              <span className="is-current">Boutique</span>
              {params.categorie && (
                <>
                  <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
                  <span className="text-[#e91e8c]">{pageTitle}</span>
                </>
              )}
            </nav>
            <h1 className="shop-dash-title">{pageTitle}</h1>
            <p className="shop-dash-subtitle">
              {params.search
                ? 'Résultats pour votre recherche dans le catalogue.'
                : 'Parcourez, filtrez et commandez en toute discrétion.'}
            </p>
          </div>

          <div className="shop-dash-header-search">
            <Suspense fallback={null}>
              <CatalogSearchBar currentParams={params} defaultQuery={params.search ?? ''} />
            </Suspense>
          </div>
        </header>

        {showCategoryShortcuts && (
          <section className="shop-dash-categories" aria-label="Accès rapide par catégorie">
            <div className="shop-dash-panel-head">
              <h2>
                <Grid3X3 className="h-4 w-4 text-[#e91e8c]" strokeWidth={1.75} />
                Parcourir par univers
              </h2>
              <Link href="/promos" className="shop-dash-link">
                Voir les promos →
              </Link>
            </div>
            <div className="shop-dash-category-grid">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={buildCatalogUrl(params, { categorie: cat.slug })}
                  className="shop-dash-category-card"
                >
                  <span className="shop-dash-category-icon" aria-hidden>
                    <Tag className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className="shop-dash-category-name">{cat.nom}</span>
                  {cat.children.length > 0 && (
                    <span className="shop-dash-category-meta">
                      {cat.children.length} sous-catégorie{cat.children.length > 1 ? 's' : ''}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="shop-dash-body">
          <aside className="shop-dash-sidebar-col">
            <div className="shop-dash-panel shop-dash-panel--filters">
              <div className="shop-dash-panel-head">
                <h2>
                  <Filter className="h-4 w-4 text-[#e91e8c]" strokeWidth={1.75} />
                  Filtres
                </h2>
              </div>
              <CatalogFilters categories={categories} facettes={facettes} params={params} />
            </div>
            <div className="shop-dash-trust-card">
              <Lock className="h-4 w-4 text-[#e91e8c]" strokeWidth={1.75} />
              <div>
                <p className="shop-dash-trust-title">Achat discret</p>
                <p className="shop-dash-trust-text">
                  Emballage neutre, paiement sécurisé et support 7j/7.
                </p>
              </div>
            </div>
          </aside>

          <div className="shop-dash-main">
            <details className="shop-dash-mobile-filters lg:hidden">
              <summary className="shop-dash-mobile-filters-summary">
                <span className="flex items-center justify-between gap-2">
                  Filtres & catégories
                  <Filter className="h-4 w-4 text-[#e91e8c]" aria-hidden />
                </span>
              </summary>
              <div className="shop-dash-mobile-filters-body">
                <CatalogFilters categories={categories} facettes={facettes} params={params} mobile />
              </div>
            </details>

            <div className="shop-dash-panel">
              <div className="shop-dash-toolbar">
                <div className="shop-dash-toolbar-meta">
                  <Sparkles className="h-4 w-4 text-[#e91e8c]" strokeWidth={1.75} />
                  <span>
                    <strong>{pagination.total}</strong> produit{pagination.total !== 1 ? 's' : ''}
                    {pagination.totalPages > 1 && (
                      <>
                        {' '}
                        — page {pagination.page}/{pagination.totalPages}
                      </>
                    )}
                  </span>
                </div>
                <div className="shop-dash-sort" role="tablist" aria-label="Tri du catalogue">
                  {CATALOG_TRI_OPTIONS.map((opt) => (
                    <Link
                      key={opt.value}
                      href={buildCatalogUrl(params, { tri: opt.value })}
                      role="tab"
                      aria-selected={activeTri === opt.value}
                      className={`shop-dash-sort-pill ${activeTri === opt.value ? 'is-active' : ''}`}
                    >
                      {opt.label}
                    </Link>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <div className="shop-dash-chips">
                  <span className="shop-dash-chips-label">Filtres actifs</span>
                  {params.categorie && (
                    <Link
                      href={buildCatalogUrl(params, { categorie: null })}
                      className="shop-dash-chip"
                    >
                      {findCategoryName(params.categorie)} <X className="h-3 w-3" />
                    </Link>
                  )}
                  {params.marque && (
                    <Link href={buildCatalogUrl(params, { marque: null })} className="shop-dash-chip">
                      {params.marque} <X className="h-3 w-3" />
                    </Link>
                  )}
                  {params.taille && (
                    <Link href={buildCatalogUrl(params, { taille: null })} className="shop-dash-chip">
                      {params.taille} <X className="h-3 w-3" />
                    </Link>
                  )}
                  {params.couleur && (
                    <Link href={buildCatalogUrl(params, { couleur: null })} className="shop-dash-chip">
                      {params.couleur} <X className="h-3 w-3" />
                    </Link>
                  )}
                  {params.enStock === '1' && (
                    <Link href={buildCatalogUrl(params, { enStock: null })} className="shop-dash-chip">
                      En stock <X className="h-3 w-3" />
                    </Link>
                  )}
                  {params.promo === '1' && (
                    <Link href={buildCatalogUrl(params, { promo: null })} className="shop-dash-chip">
                      Promo <X className="h-3 w-3" />
                    </Link>
                  )}
                  {params.search && (
                    <Link href={buildCatalogUrl(params, { search: null })} className="shop-dash-chip">
                      « {params.search} » <X className="h-3 w-3" />
                    </Link>
                  )}
                  <Link href="/produits" className="shop-dash-link">
                    Tout effacer
                  </Link>
                </div>
              )}

              {products.length > 0 ? (
                <div className="products-grid shop-dash-products">
                  {products.map((p, index) => {
                    const notes = notesPourProduit(notesMap, p.id);
                    return (
                      <ProductCard
                        key={p.id}
                        id={p.id}
                        slug={p.slug}
                        nom={p.nom}
                        categorie={p.categorie.nom}
                        prix={Number(p.prix)}
                        image={p.images[0]}
                        featured={p.featured}
                        rating={notes.rating}
                        reviews={notes.reviews}
                        variante={variantePourCarte(p.id, Number(p.prix), p.variantes?.[0])}
                        priority={index < 4}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="shop-dash-empty">
                  <div className="shop-dash-empty-icon">
                    <Filter className="h-6 w-6 text-[#e91e8c]" />
                  </div>
                  <h3>Aucun produit trouvé</h3>
                  <p>Essayez une autre catégorie ou explorez tout le catalogue.</p>
                  <Link href="/produits">
                    <Button className="btn-primary rounded-full px-8">Voir toute la boutique</Button>
                  </Link>
                </div>
              )}

              <CatalogPagination
                params={params}
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
