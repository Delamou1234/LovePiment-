import React from 'react';
import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';
import type { CategorieArbre, FacettesCatalogue } from '@/modules/produits/types';
import { buildCatalogUrl, type CatalogSearchParams } from '@/modules/produits/lib/catalog-url';

type Props = {
  categories: CategorieArbre[];
  facettes: FacettesCatalogue;
  params: CatalogSearchParams;
  mobile?: boolean;
};

export function CatalogFilters({ categories, facettes, params, mobile = false }: Props) {
  const {
    categorie: activeCategorie = '',
    taille: activeTaille = '',
    couleur: activeCouleur = '',
    marque: activeMarque = '',
    prixMin: activePrixMin = '',
    prixMax: activePrixMax = '',
    enStock: activeEnStock = '',
    promo: activePromo = '',
  } = params;

  const hasActiveFilters = Boolean(
    activeCategorie ||
      activeTaille ||
      activeCouleur ||
      activeMarque ||
      params.search ||
      activePrixMin ||
      activePrixMax ||
      activeEnStock ||
      activePromo,
  );

  const findCategoryName = (slug: string) => {
    for (const root of categories) {
      if (root.slug === slug) return root.nom;
      const child = root.children.find((c) => c.slug === slug);
      if (child) return child.nom;
    }
    return slug;
  };

  const wrapperClass = mobile ? 'space-y-6' : 'catalog-sidebar space-y-6';

  return (
    <aside className={wrapperClass}>
      <div className="flex items-center justify-between border-b border-beige-border/70 pb-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900">
          <SlidersHorizontal className="h-4 w-4 text-olive" strokeWidth={2} />
          Affiner
        </h3>
        {hasActiveFilters && (
          <Link href="/produits" className="text-[11px] font-semibold text-olive hover:text-olive-dark">
            Réinitialiser
          </Link>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="catalog-filter-title">Catégorie</h4>
        <div className="flex flex-col gap-0.5">
          <Link
            href={buildCatalogUrl(params, { categorie: null })}
            className={`catalog-filter-link ${!activeCategorie ? 'is-active' : ''}`}
          >
            Tous les produits
          </Link>
          {categories.map((cat) => (
            <div key={cat.id} className="space-y-0.5">
              <Link
                href={buildCatalogUrl(params, { categorie: cat.slug })}
                className={`catalog-filter-link ${activeCategorie === cat.slug ? 'is-active' : ''}`}
              >
                {cat.nom}
              </Link>
              {cat.children.length > 0 && (
                <div className="ml-2 border-l border-beige-border pl-2">
                  {cat.children.map((sub) => (
                    <Link
                      key={sub.id}
                      href={buildCatalogUrl(params, { categorie: sub.slug })}
                      className={`catalog-filter-sublink ${activeCategorie === sub.slug ? 'is-active' : ''}`}
                    >
                      {sub.nom}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {facettes.prixMax > 0 && (
        <div className="space-y-3 border-t border-beige-border/70 pt-5">
          <h4 className="catalog-filter-title">Budget (GNF)</h4>
          <form action="/produits" method="GET" className="space-y-2.5">
            {Object.entries(params).map(([key, val]) =>
              key !== 'prixMin' && key !== 'prixMax' && val ? (
                <input key={key} type="hidden" name={key} value={val} />
              ) : null,
            )}
            <div className="flex gap-2">
              <input
                type="number"
                name="prixMin"
                placeholder="Min"
                defaultValue={activePrixMin}
                min={0}
                className="input-kabishop !rounded-xl !py-2 !text-xs"
              />
              <input
                type="number"
                name="prixMax"
                placeholder="Max"
                defaultValue={activePrixMax}
                min={0}
                className="input-kabishop !rounded-xl !py-2 !text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-olive-light py-2 text-xs font-semibold text-olive transition hover:bg-olive/10"
            >
              Appliquer
            </button>
          </form>
          <p className="text-[11px] text-zinc-400">
            {facettes.prixMin.toLocaleString('fr-GN')} – {facettes.prixMax.toLocaleString('fr-GN')} GNF
          </p>
        </div>
      )}

      {facettes.marques.length > 0 && (
        <div className="space-y-3 border-t border-beige-border/70 pt-5">
          <h4 className="catalog-filter-title">Marque</h4>
          <div className="flex flex-col gap-0.5">
            {facettes.marques.map((m) => (
              <Link
                key={m}
                href={buildCatalogUrl(params, { marque: activeMarque === m ? null : m })}
                className={`catalog-filter-link ${activeMarque === m ? 'is-active' : ''}`}
              >
                {m}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 border-t border-beige-border/70 pt-5">
        <h4 className="catalog-filter-title">Offres</h4>
        <div className="flex flex-col gap-2">
          <Link
            href={buildCatalogUrl(params, { enStock: activeEnStock === '1' ? null : '1' })}
            className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
              activeEnStock === '1'
                ? 'border-olive/30 bg-olive-light text-olive'
                : 'border-beige-border text-zinc-600 hover:border-olive/20 hover:bg-cream'
            }`}
          >
            En stock uniquement
          </Link>
          <Link
            href={buildCatalogUrl(params, { promo: activePromo === '1' ? null : '1' })}
            className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
              activePromo === '1'
                ? 'border-olive/30 bg-olive-light text-olive'
                : 'border-beige-border text-zinc-600 hover:border-olive/20 hover:bg-cream'
            }`}
          >
            En promotion
          </Link>
        </div>
      </div>

      {facettes.tailles.length > 0 && (
        <div className="space-y-3 border-t border-beige-border/70 pt-5">
          <h4 className="catalog-filter-title">Format</h4>
          <div className="flex flex-wrap gap-1.5">
            {facettes.tailles.map((t) => {
              const isSelected = activeTaille === t;
              return (
                <Link
                  key={t}
                  href={buildCatalogUrl(params, { taille: isSelected ? null : t })}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-xs font-semibold transition ${
                    isSelected
                      ? 'border-olive bg-olive text-white'
                      : 'border-beige-border text-zinc-600 hover:border-olive/25 hover:bg-cream'
                  }`}
                >
                  {t}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {facettes.couleurs.length > 0 && (
        <div className="space-y-3 border-t border-beige-border/70 pt-5">
          <h4 className="catalog-filter-title">Fragrance / nuance</h4>
          <div className="flex flex-wrap gap-1.5">
            {facettes.couleurs.map((c) => {
              const isSelected = activeCouleur === c;
              return (
                <Link
                  key={c}
                  href={buildCatalogUrl(params, { couleur: isSelected ? null : c })}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                    isSelected
                      ? 'border-olive bg-olive-light text-olive'
                      : 'border-beige-border text-zinc-600 hover:border-olive/20 hover:bg-cream'
                  }`}
                >
                  {c}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {activeCategorie && (
        <p className="text-[11px] text-zinc-400">
          Sélection : {findCategoryName(activeCategorie)}
        </p>
      )}
    </aside>
  );
}
