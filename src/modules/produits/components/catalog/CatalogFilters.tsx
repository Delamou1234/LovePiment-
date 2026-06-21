import React from 'react';
import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';
import type { CategorieArbre, FacettesCatalogue } from '@/modules/produits/types';
import { buildCatalogUrl, type CatalogSearchParams } from '@/modules/produits/lib/catalog-url';

type Props = {
  categories: CategorieArbre[];
  facettes: FacettesCatalogue;
  params: CatalogSearchParams;
};

export function CatalogFilters({ categories, facettes, params }: Props) {
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

  return (
    <aside className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <h3 className="flex items-center gap-2 text-lg font-extrabold text-zinc-900">
          <SlidersHorizontal className="h-5 w-5 text-primary" /> Filtres
        </h3>
        {hasActiveFilters && (
          <Link href="/produits" className="text-xs font-bold text-primary hover:underline">
            Effacer tout
          </Link>
        )}
      </div>

      {/* Catégories & sous-catégories */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-800">Catégorie</h4>
        <div className="flex flex-col gap-1">
          <Link
            href={buildCatalogUrl(params, { categorie: null })}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              !activeCategorie ? 'bg-primary-50 font-bold text-primary' : 'text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            Tous les produits
          </Link>
          {categories.map((cat) => (
            <div key={cat.id} className="space-y-0.5">
              <Link
                href={buildCatalogUrl(params, { categorie: cat.slug })}
                className={`block rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  activeCategorie === cat.slug
                    ? 'bg-primary-50 font-bold text-primary'
                    : 'text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {cat.nom}
              </Link>
              {cat.children.length > 0 && (
                <div className="ml-3 border-l border-zinc-100 pl-2">
                  {cat.children.map((sub) => (
                    <Link
                      key={sub.id}
                      href={buildCatalogUrl(params, { categorie: sub.slug })}
                      className={`block rounded-lg px-3 py-1 text-sm transition-all ${
                        activeCategorie === sub.slug
                          ? 'font-bold text-primary'
                          : 'text-zinc-500 hover:text-zinc-800'
                      }`}
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

      {/* Prix */}
      {facettes.prixMax > 0 && (
        <div className="space-y-3 border-t border-zinc-100 pt-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-800">Prix (GNF)</h4>
          <form action="/produits" method="GET" className="space-y-2">
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
                className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-primary"
              />
              <input
                type="number"
                name="prixMax"
                placeholder="Max"
                defaultValue={activePrixMax}
                min={0}
                className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-zinc-100 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-200"
            >
              Appliquer
            </button>
          </form>
          <p className="text-xs text-zinc-400">
            {facettes.prixMin.toLocaleString('fr-GN')} – {facettes.prixMax.toLocaleString('fr-GN')} GNF
          </p>
        </div>
      )}

      {/* Marque */}
      {facettes.marques.length > 0 && (
        <div className="space-y-3 border-t border-zinc-100 pt-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-800">Marque</h4>
          <div className="flex flex-col gap-1">
            {facettes.marques.map((m) => (
              <Link
                key={m}
                href={buildCatalogUrl(params, { marque: activeMarque === m ? null : m })}
                className={`rounded-lg px-3 py-1.5 text-sm transition-all ${
                  activeMarque === m
                    ? 'bg-primary-50 font-bold text-primary'
                    : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {m}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Disponibilité */}
      <div className="space-y-3 border-t border-zinc-100 pt-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-800">Disponibilité</h4>
        <div className="flex flex-col gap-2">
          <Link
            href={buildCatalogUrl(params, { enStock: activeEnStock === '1' ? null : '1' })}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
              activeEnStock === '1'
                ? 'border-primary bg-primary-50 text-primary'
                : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
            }`}
          >
            En stock uniquement
          </Link>
          <Link
            href={buildCatalogUrl(params, { promo: activePromo === '1' ? null : '1' })}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
              activePromo === '1'
                ? 'border-primary bg-primary-50 text-primary'
                : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
            }`}
          >
            En promotion
          </Link>
        </div>
      </div>

      {/* Tailles */}
      {facettes.tailles.length > 0 && (
        <div className="space-y-3 border-t border-zinc-100 pt-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-800">Taille</h4>
          <div className="flex flex-wrap gap-2">
            {facettes.tailles.map((t) => {
              const isSelected = activeTaille === t;
              return (
                <Link
                  key={t}
                  href={buildCatalogUrl(params, { taille: isSelected ? null : t })}
                  className={`flex h-10 min-w-10 items-center justify-center rounded-lg border px-2 text-sm font-bold transition-all ${
                    isSelected
                      ? 'border-primary bg-primary text-white'
                      : 'border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50'
                  }`}
                >
                  {t}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Couleurs / fragrances */}
      {facettes.couleurs.length > 0 && (
        <div className="space-y-3 border-t border-zinc-100 pt-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-800">Couleur / fragrance</h4>
          <div className="flex flex-wrap gap-2">
            {facettes.couleurs.map((c) => {
              const isSelected = activeCouleur === c;
              return (
                <Link
                  key={c}
                  href={buildCatalogUrl(params, { couleur: isSelected ? null : c })}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-primary bg-primary-50 font-bold text-primary'
                      : 'border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50'
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
        <p className="text-xs text-zinc-400">
          Filtre : {findCategoryName(activeCategorie)}
        </p>
      )}
    </aside>
  );
}
