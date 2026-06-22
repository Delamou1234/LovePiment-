import React, { Suspense } from 'react';

import Link from 'next/link';

import { ChevronRight, Filter, Sparkles, X } from 'lucide-react';

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

import type { ProduitAvecCategorie } from '@/modules/produits/types';



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



  const [categories, facettes, catalog] = await Promise.all([

    getCachedCategoriesArbre(),

    productService.obtenirFacettesCatalogue(filtres),

    productService.listerProduits(filtres, catalogTriToRepository(activeTri), { page: 1, limit: 100 }),

  ]);

  const products: ProduitAvecCategorie[] = catalog.produits;



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



  const pageSubtitle = params.categorie

    ? 'Sélection soignée pour votre routine beauté.'

    : params.search

      ? 'Résultats de votre recherche'

      : 'Parfums, huiles & soins du corps — livrés à Conakry.';



  return (

    <div className="animate-fadeIn">

      <header className="catalog-hero">

        <div className="container-kabishop py-8 md:py-12 lg:py-14">

          <nav className="catalog-breadcrumb mb-5" aria-label="Fil d'Ariane">

            <Link href="/">Accueil</Link>

            <ChevronRight className="h-3 w-3 opacity-50" aria-hidden />

            <span className="text-zinc-700">Boutique</span>

            {params.categorie && (

              <>

                <ChevronRight className="h-3 w-3 opacity-50" aria-hidden />

                <span className="text-olive">{pageTitle}</span>

              </>

            )}

          </nav>



          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

            <div className="max-w-2xl">

              <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-olive">

                <Sparkles className="h-3 w-3" aria-hidden />

                Catalogue

              </p>

              <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">

                {pageTitle}

              </h1>

              <p className="mt-3 text-sm leading-relaxed text-zinc-500 md:text-[15px]">{pageSubtitle}</p>

            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-beige-border/80 bg-white/80 px-5 py-3.5 shadow-sm backdrop-blur-sm">

              <span className="font-serif text-2xl font-bold text-zinc-900 tabular-nums">{products.length}</span>

              <span className="text-xs leading-snug text-zinc-500">

                produit{products.length !== 1 ? 's' : ''}

                <br />

                disponible{products.length !== 1 ? 's' : ''}

              </span>

            </div>

          </div>

        </div>

      </header>



      <div className="container-kabishop py-8 md:py-10 lg:py-12">

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[18.5rem_minmax(0,1fr)] lg:gap-10">

          <div className="hidden lg:block">

            <CatalogFilters categories={categories} facettes={facettes} params={params} />

          </div>



          <div className="min-w-0 space-y-6">

            <div className="catalog-toolbar">

              <Suspense fallback={null}>

                <CatalogSearchBar currentParams={params} defaultQuery={params.search ?? ''} />

              </Suspense>



              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">

                <span className="hidden text-xs font-medium text-zinc-400 sm:block">Trier par</span>

                <div className="catalog-sort" role="tablist" aria-label="Tri du catalogue">

                  {CATALOG_TRI_OPTIONS.map((opt) => (

                    <Link

                      key={opt.value}

                      href={buildCatalogUrl(params, { tri: opt.value })}

                      role="tab"

                      aria-selected={activeTri === opt.value}

                      className={`catalog-sort-pill ${activeTri === opt.value ? 'is-active' : ''}`}

                    >

                      {opt.label}

                    </Link>

                  ))}

                </div>

              </div>

            </div>



            <details className="overflow-hidden rounded-2xl border border-beige-border/90 bg-white lg:hidden">

              <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-semibold text-zinc-800 [&::-webkit-details-marker]:hidden">

                <span className="flex items-center justify-between gap-2">

                  Filtres & catégories

                  <Filter className="h-4 w-4 text-olive" aria-hidden />

                </span>

              </summary>

              <div className="border-t border-beige-border/80 p-4">

                <CatalogFilters categories={categories} facettes={facettes} params={params} mobile />

              </div>

            </details>



            {hasActiveFilters && (

              <div className="flex flex-wrap items-center gap-2">

                <span className="mr-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">

                  Filtres

                </span>

                {params.categorie && (

                  <Link

                    href={buildCatalogUrl(params, { categorie: null })}

                    className="catalog-chip"

                  >

                    {findCategoryName(params.categorie)} <X className="h-3 w-3 text-zinc-400" />

                  </Link>

                )}

                {params.marque && (

                  <Link href={buildCatalogUrl(params, { marque: null })} className="catalog-chip">

                    {params.marque} <X className="h-3 w-3 text-zinc-400" />

                  </Link>

                )}

                {params.taille && (

                  <Link href={buildCatalogUrl(params, { taille: null })} className="catalog-chip">

                    {params.taille} <X className="h-3 w-3 text-zinc-400" />

                  </Link>

                )}

                {params.couleur && (

                  <Link href={buildCatalogUrl(params, { couleur: null })} className="catalog-chip">

                    {params.couleur} <X className="h-3 w-3 text-zinc-400" />

                  </Link>

                )}

                {params.enStock === '1' && (

                  <Link href={buildCatalogUrl(params, { enStock: null })} className="catalog-chip">

                    En stock <X className="h-3 w-3 text-zinc-400" />

                  </Link>

                )}

                {params.promo === '1' && (

                  <Link href={buildCatalogUrl(params, { promo: null })} className="catalog-chip">

                    Promo <X className="h-3 w-3 text-zinc-400" />

                  </Link>

                )}

                {params.search && (

                  <Link href={buildCatalogUrl(params, { search: null })} className="catalog-chip">

                    « {params.search} » <X className="h-3 w-3 text-zinc-400" />

                  </Link>

                )}

                <Link

                  href="/produits"

                  className="text-[11px] font-semibold text-olive hover:text-olive-dark transition"

                >

                  Tout effacer

                </Link>

              </div>

            )}



            {products.length > 0 ? (

              <div className="products-grid">

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

              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-beige-border bg-white/70 px-6 py-20 text-center">

                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-olive-light">

                  <Filter className="h-6 w-6 text-olive" />

                </div>

                <h3 className="mb-2 font-serif text-xl font-bold text-zinc-900">

                  Aucun produit trouvé

                </h3>

                <p className="mb-8 max-w-sm text-sm leading-relaxed text-zinc-500">

                  Essayez d&apos;élargir vos critères ou explorez toute la boutique.

                </p>

                <Link href="/produits">

                  <Button className="btn-primary rounded-full px-8">Voir toute la boutique</Button>

                </Link>

              </div>

            )}

          </div>

        </div>

      </div>

    </div>

  );

}


