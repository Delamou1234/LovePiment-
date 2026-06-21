import React, { Suspense } from 'react';
import Link from 'next/link';
import { ChevronRight, Filter, X } from 'lucide-react';
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
  CATALOG_TRI_OPTIONS,
  type CatalogSearchParams,
} from '@/modules/produits/lib/catalog-url';

export const revalidate = 60;

type SearchParams = Promise<CatalogSearchParams>;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const activeTri = params.tri || 'nouveautes';

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

  const [categories, facettes, { produits: products }] = await Promise.all([
    getCachedCategoriesArbre(),
    productService.obtenirFacettesCatalogue(filtres),
    productService.listerProduits(filtres, catalogTriToRepository(activeTri), { page: 1, limit: 100 }),
  ]);

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
      ? `Résultats : « ${params.search} »`
      : 'Parfums & Huiles';

  return (
    <div className="container-kabishop animate-fadeIn py-8 md:py-14">
      <div className="mb-8 flex items-center gap-1.5 text-xs text-zinc-500">
        <Link href="/" className="font-medium transition hover:text-olive">
          Accueil
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-zinc-800">{pageTitle}</span>
      </div>

      <div className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-olive mb-2">Catalogue</p>
        <h1 className="font-serif text-2xl font-bold text-zinc-900 md:text-3xl tracking-tight">{pageTitle}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {products.length} produit{products.length !== 1 ? 's' : ''} — parfums, huiles & crèmes
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="hidden lg:block">
          <CatalogFilters categories={categories} facettes={facettes} params={params} />
        </div>

        <div className="space-y-6 lg:col-span-3">
          <div className="flex flex-col gap-4 border-b border-beige-border pb-5 sm:flex-row sm:items-center sm:justify-between">
            <Suspense fallback={null}>
              <CatalogSearchBar currentParams={params} defaultQuery={params.search ?? ''} />
            </Suspense>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <span className="text-sm font-medium text-zinc-500 shrink-0">
                <span className="font-bold text-zinc-800">{products.length}</span> article(s)
              </span>
              <div className="flex flex-nowrap items-center gap-1 overflow-x-auto rounded-xl border border-beige-border bg-cream p-1 scrollbar-hide">
                {CATALOG_TRI_OPTIONS.map((opt) => (
                  <Link
                    key={opt.value}
                    href={buildCatalogUrl(params, { tri: opt.value })}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition duration-200 ${
                      activeTri === opt.value
                        ? 'bg-white text-olive shadow-sm ring-1 ring-beige-border'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Filtres mobile */}
          <details className="rounded-xl border border-beige-border bg-cream lg:hidden">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-zinc-800">
              Filtres & catégories
            </summary>
            <div className="border-t border-beige-border p-4">
              <CatalogFilters categories={categories} facettes={facettes} params={params} />
            </div>
          </details>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Filtres actifs :
              </span>
              {params.categorie && (
                <Link
                  href={buildCatalogUrl(params, { categorie: null })}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700 transition hover:bg-zinc-200"
                >
                  {findCategoryName(params.categorie)} <X className="h-3.5 w-3.5 text-zinc-400" />
                </Link>
              )}
              {params.marque && (
                <Link
                  href={buildCatalogUrl(params, { marque: null })}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700 transition hover:bg-zinc-200"
                >
                  {params.marque} <X className="h-3.5 w-3.5 text-zinc-400" />
                </Link>
              )}
              {params.taille && (
                <Link
                  href={buildCatalogUrl(params, { taille: null })}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700 transition hover:bg-zinc-200"
                >
                  {params.taille} <X className="h-3.5 w-3.5 text-zinc-400" />
                </Link>
              )}
              {params.couleur && (
                <Link
                  href={buildCatalogUrl(params, { couleur: null })}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700 transition hover:bg-zinc-200"
                >
                  {params.couleur} <X className="h-3.5 w-3.5 text-zinc-400" />
                </Link>
              )}
              {params.enStock === '1' && (
                <Link
                  href={buildCatalogUrl(params, { enStock: null })}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700 transition hover:bg-zinc-200"
                >
                  En stock <X className="h-3.5 w-3.5 text-zinc-400" />
                </Link>
              )}
              {params.search && (
                <Link
                  href={buildCatalogUrl(params, { search: null })}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700 transition hover:bg-zinc-200"
                >
                  « {params.search} » <X className="h-3.5 w-3.5 text-zinc-400" />
                </Link>
              )}
            </div>
          )}

          {products.length > 0 ? (
            <div className="products-grid">
              {products.map((p) => {
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
                />
              );})}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-beige-border bg-white py-16 text-center">
              <Filter className="mb-4 h-12 w-12 text-zinc-300" />
              <h3 className="mb-2 text-lg font-bold text-zinc-950">
                Aucun article ne correspond à votre recherche
              </h3>
              <p className="mb-6 max-w-sm text-sm leading-relaxed text-zinc-500">
                Essayez d&apos;élargir vos critères ou retirez certains filtres.
              </p>
              <Link href="/produits">
                <Button className="btn-primary rounded-full px-6">Voir tous les articles</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
