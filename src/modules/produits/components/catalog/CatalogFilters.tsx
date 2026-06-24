import React from 'react';
import Link from 'next/link';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { CategorieArbre, FacettesCatalogue } from '@/modules/produits/types';
import { buildCatalogUrl, type CatalogSearchParams } from '@/modules/produits/lib/catalog-url';

const CATEGORY_ORDER = [
  'sextoys',
  'lingerie',
  'lubrifiants',
  'accessoires',
  'bien-etre-intime',
  'cadeaux-couple',
];

function sortCategories(categories: CategorieArbre[]) {
  return [...categories].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a.slug);
    const ib = CATEGORY_ORDER.indexOf(b.slug);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

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

  const sortedCategories = sortCategories(categories);

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

  const wrapperClass = mobile ? 'catalog-sidebar catalog-sidebar--embedded' : 'catalog-sidebar';

  return (
    <aside className={wrapperClass}>
      <div className="catalog-sidebar-head">
        <h3 className="catalog-sidebar-title">
          <span className="catalog-sidebar-icon" aria-hidden>
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
          </span>
          Affiner
        </h3>
        {hasActiveFilters && (
          <Link href="/produits" className="catalog-sidebar-reset">
            <RotateCcw className="h-3 w-3" aria-hidden />
            Réinitialiser
          </Link>
        )}
      </div>

      <section className="catalog-filter-section catalog-filter-section--first">
        <h4 className="catalog-filter-title">Catégorie</h4>
        <nav className="catalog-filter-nav" aria-label="Catégories produits">
          <Link
            href={buildCatalogUrl(params, { categorie: null })}
            className={`catalog-filter-link ${!activeCategorie ? 'is-active' : ''}`}
          >
            Tous les produits
          </Link>

          {sortedCategories.map((cat) => {
            const parentActive = activeCategorie === cat.slug;
            const childActive = cat.children.some((c) => c.slug === activeCategorie);

            return (
              <div
                key={cat.id}
                className={`catalog-filter-group ${parentActive || childActive ? 'is-expanded' : ''}`}
              >
                <Link
                  href={buildCatalogUrl(params, { categorie: cat.slug })}
                  className={`catalog-filter-link catalog-filter-link--parent ${parentActive ? 'is-active' : ''}`}
                >
                  {cat.nom}
                </Link>

                {cat.children.length > 0 && (
                  <div className="catalog-filter-children">
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
            );
          })}
        </nav>
      </section>

      {facettes.prixMax > 0 && (
        <section className="catalog-filter-section">
          <h4 className="catalog-filter-title">Budget (GNF)</h4>
          <form action="/produits" method="GET" className="catalog-filter-form">
            {Object.entries(params).map(([key, val]) =>
              key !== 'prixMin' && key !== 'prixMax' && val ? (
                <input key={key} type="hidden" name={key} value={val} />
              ) : null,
            )}
            <div className="catalog-filter-price-row">
              <input
                type="number"
                name="prixMin"
                placeholder="Min"
                defaultValue={activePrixMin}
                min={0}
                className="catalog-filter-input"
              />
              <input
                type="number"
                name="prixMax"
                placeholder="Max"
                defaultValue={activePrixMax}
                min={0}
                className="catalog-filter-input"
              />
            </div>
            <button type="submit" className="catalog-filter-submit">
              Appliquer
            </button>
          </form>
          <p className="catalog-filter-hint">
            {facettes.prixMin.toLocaleString('fr-GN')} – {facettes.prixMax.toLocaleString('fr-GN')} GNF
          </p>
        </section>
      )}

      {facettes.marques.length > 0 && (
        <section className="catalog-filter-section">
          <h4 className="catalog-filter-title">Marque</h4>
          <nav className="catalog-filter-nav catalog-filter-nav--compact">
            {facettes.marques.map((m) => (
              <Link
                key={m}
                href={buildCatalogUrl(params, { marque: activeMarque === m ? null : m })}
                className={`catalog-filter-link ${activeMarque === m ? 'is-active' : ''}`}
              >
                {m}
              </Link>
            ))}
          </nav>
        </section>
      )}

      <section className="catalog-filter-section">
        <h4 className="catalog-filter-title">Offres</h4>
        <div className="catalog-filter-toggles">
          <Link
            href={buildCatalogUrl(params, { enStock: activeEnStock === '1' ? null : '1' })}
            className={`catalog-filter-toggle ${activeEnStock === '1' ? 'is-active' : ''}`}
          >
            En stock uniquement
          </Link>
          <Link
            href={buildCatalogUrl(params, { promo: activePromo === '1' ? null : '1' })}
            className={`catalog-filter-toggle ${activePromo === '1' ? 'is-active' : ''}`}
          >
            En promotion
          </Link>
        </div>
      </section>

      {facettes.tailles.length > 0 && (
        <section className="catalog-filter-section">
          <h4 className="catalog-filter-title">Taille / format</h4>
          <div className="catalog-filter-chips">
            {facettes.tailles.map((t) => {
              const isSelected = activeTaille === t;
              return (
                <Link
                  key={t}
                  href={buildCatalogUrl(params, { taille: isSelected ? null : t })}
                  className={`catalog-filter-chip ${isSelected ? 'is-active' : ''}`}
                >
                  {t}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {facettes.couleurs.length > 0 && (
        <section className="catalog-filter-section">
          <h4 className="catalog-filter-title">Couleur</h4>
          <div className="catalog-filter-chips catalog-filter-chips--round">
            {facettes.couleurs.map((c) => {
              const isSelected = activeCouleur === c;
              return (
                <Link
                  key={c}
                  href={buildCatalogUrl(params, { couleur: isSelected ? null : c })}
                  className={`catalog-filter-chip catalog-filter-chip--round ${isSelected ? 'is-active' : ''}`}
                >
                  {c}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {activeCategorie && (
        <p className="catalog-filter-selection">
          Sélection : <strong>{findCategoryName(activeCategorie)}</strong>
        </p>
      )}
    </aside>
  );
}
