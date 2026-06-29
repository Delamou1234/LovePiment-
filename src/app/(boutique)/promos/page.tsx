import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, ChevronRight, Percent, Sparkles, Tag, Zap } from 'lucide-react';
import { ProductCard } from '@/shared/components/ProductCard';
import { PromoSpotlightStrip } from '@/modules/produits/components/PromoSpotlightStrip';
import { variantePourCarte } from '@/shared/lib/product-card';
import { getCachedPromosPage } from '@/modules/produits/lib/cached-queries';
import { formaterDatePromo, promoFinVersIso, versDatePromo } from '@/modules/produits/lib/promo';
import { avisService } from '@/modules/avis/services/review.service';
import { notesPourProduit, chargerNotesProduits } from '@/modules/produits/lib/product-ratings';
import type { PromoProduitEnrichi } from '@/modules/produits/services/promos-page.service';

export const metadata: Metadata = {
  title: 'Promotions | Love Piment&',
  description:
    'Offres en cours sur la boutique Love Piment& à Conakry — prix réduits synchronisés avec le catalogue.',
};

export const revalidate = 60;

type SearchParams = Promise<{
  categorie?: string;
  tri?: string;
}>;

const TRI_OPTIONS = [
  { value: 'remise', label: 'Meilleure remise' },
  { value: 'prix_asc', label: 'Prix croissant' },
  { value: 'fin', label: 'Fin proche' },
] as const;

type TriPromo = (typeof TRI_OPTIONS)[number]['value'];

function trierPromos(produits: PromoProduitEnrichi[], tri: TriPromo): PromoProduitEnrichi[] {
  const sorted = [...produits];

  switch (tri) {
    case 'prix_asc':
      return sorted.sort(
        (a, b) => (a.prixPromoNum ?? a.prixNum) - (b.prixPromoNum ?? b.prixNum),
      );
    case 'fin':
      return sorted.sort((a, b) => {
        const finA = versDatePromo(a.promoFin);
        const finB = versDatePromo(b.promoFin);
        if (!finA && !finB) return 0;
        if (!finA) return 1;
        if (!finB) return -1;
        return finA.getTime() - finB.getTime();
      });
    case 'remise':
    default:
      return sorted.sort((a, b) => b.remisePct - a.remisePct);
  }
}

export default async function PromosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { categorie = '', tri = 'remise' } = await searchParams;
  const triActif = (TRI_OPTIONS.some((t) => t.value === tri) ? tri : 'remise') as TriPromo;

  const { categories, produits: produitsBruts, stats, prochaineFin, flash, coupons } =
    await getCachedPromosPage(categorie || undefined);

  const produits = trierPromos(produitsBruts, triActif);

  const notesMap = await chargerNotesProduits(
    produits.map((p) => p.id),
    (ids: string[]) => avisService.statsPlusieursProduits(ids),
  );

  const buildUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams();
    if (categorie) params.set('categorie', categorie);
    if (triActif) params.set('tri', triActif);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null) params.delete(key);
      else params.set(key, val);
    });
    const qs = params.toString();
    return qs ? `/promos?${qs}` : '/promos';
  };

  const titrePage =
    stats.total > 0
      ? stats.remiseMax > 0
        ? `Jusqu'à −${stats.remiseMax}% sur ${stats.total} produit${stats.total > 1 ? 's' : ''}`
        : `${stats.total} promotion${stats.total > 1 ? 's' : ''} en cours`
      : 'Promotions';

  const categorieLabel = categorie
    ? categories.find((c) => c.slug === categorie)?.nom ?? categorie
    : null;

  return (
    <div className="shop-promos animate-fadeIn">
      <div className="container-shop shop-promos-inner">
        <header className="shop-promos-header">
          <nav className="shop-promos-breadcrumb" aria-label="Fil d'Ariane">
            <Link href="/">Accueil</Link>
            <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
            <span className="is-current">Promotions</span>
          </nav>

          <div className="shop-promos-header-main">
            <p className="shop-promos-kicker">
              <Percent className="h-3.5 w-3.5" strokeWidth={1.75} />
              Offres en cours
            </p>
            <h1 className="shop-promos-title">{titrePage}</h1>
            <p className="shop-promos-subtitle">
              Prix réduits issus du catalogue — mis à jour automatiquement.
              {prochaineFin && (
                <> Prochaine fin : {formaterDatePromo(prochaineFin)}.</>
              )}
            </p>
            <Link href="/produits" className="shop-promos-catalog-link">
              Voir toute la boutique
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {flash && flash.produits.length > 0 && (
          <section className="shop-promos-flash" aria-label="Vente flash">
            <div className="shop-promos-flash-head">
              <div className="shop-promos-flash-icon">
                <Zap className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <p className="shop-promos-flash-kicker">Vente flash active</p>
                <h2 className="shop-promos-flash-title">{flash.titre}</h2>
                {flash.description && (
                  <p className="shop-promos-flash-desc">{flash.description}</p>
                )}
                <p className="shop-promos-flash-end">
                  Se termine le {formaterDatePromo(flash.fin)}
                </p>
              </div>
            </div>
            <p className="shop-promos-flash-count">
              {flash.produits.length} produit{flash.produits.length > 1 ? 's' : ''} en vedette
            </p>
          </section>
        )}

        {coupons.length > 0 && (
          <section className="shop-promos-coupons" aria-label="Codes promo">
            <div className="shop-promos-panel-head">
              <h2>
                <Tag className="h-4 w-4 text-[#e91e8c]" strokeWidth={1.75} />
                Codes promo actifs
              </h2>
              <Link href="/commande" className="shop-promos-link">
                Utiliser au checkout →
              </Link>
            </div>
            <div className="shop-promos-coupon-grid">
              {coupons.map((c) => (
                <div key={c.id} className="shop-promos-coupon-card">
                  <span className="shop-promos-coupon-code">{c.code}</span>
                  <span className="shop-promos-coupon-value">{c.label}</span>
                  {c.minCommande != null && c.minCommande > 0 && (
                    <span className="shop-promos-coupon-meta">
                      Dès {c.minCommande.toLocaleString('fr-FR')} GN
                    </span>
                  )}
                  {c.fin && (
                    <span className="shop-promos-coupon-meta">Jusqu&apos;au {c.fin}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {produitsBruts.length > 0 && <PromoSpotlightStrip produits={produitsBruts} />}

        <section className="shop-promos-catalog" aria-label="Catalogue en promotion">
          <div className="shop-promos-toolbar">
            <div className="shop-promos-filters">
              <Link
                href={buildUrl({ categorie: null })}
                className={`shop-promos-filter-pill ${!categorie ? 'is-active' : ''}`}
              >
                Toutes
                {stats.total > 0 && (
                  <span className="shop-promos-filter-count">{stats.total}</span>
                )}
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={buildUrl({ categorie: cat.slug })}
                  className={`shop-promos-filter-pill ${categorie === cat.slug ? 'is-active' : ''}`}
                >
                  {cat.nom}
                  <span className="shop-promos-filter-count">{cat.promoCount}</span>
                </Link>
              ))}
            </div>

            <div className="shop-promos-sort" role="tablist" aria-label="Tri des promotions">
              {TRI_OPTIONS.map((option) => (
                <Link
                  key={option.value}
                  href={buildUrl({ tri: option.value })}
                  role="tab"
                  aria-selected={triActif === option.value}
                  className={`shop-promos-sort-pill ${triActif === option.value ? 'is-active' : ''}`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>

          <p className="shop-promos-result-meta">
            <Sparkles className="h-4 w-4 text-[#e91e8c]" strokeWidth={1.75} />
            <span>
              <strong>{produits.length}</strong> promotion{produits.length !== 1 ? 's' : ''}
              {categorieLabel ? ` — ${categorieLabel}` : ''}
            </span>
          </p>

          {produits.length > 0 ? (
            <div className="products-grid shop-promos-grid">
              {produits.map((p, index) => {
                const notes = notesPourProduit(notesMap, p.id);
                return (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    slug={p.slug}
                    nom={p.nom}
                    categorie={p.categorie.nom}
                    prix={p.prixNum}
                    prixPromo={p.prixPromoNum}
                    promoFin={promoFinVersIso(p.promoFin)}
                    image={p.images[0] ?? ''}
                    rating={notes.rating}
                    reviews={notes.reviews}
                    variante={variantePourCarte(
                      p.id,
                      p.prixPromoNum ?? p.prixNum,
                      p.variantes?.[0],
                    )}
                    priority={index < 4}
                  />
                );
              })}
            </div>
          ) : (
            <div className="shop-promos-empty">
              <div className="shop-promos-empty-icon">
                <Tag className="h-6 w-6 text-[#e91e8c]" />
              </div>
              <h2>Aucune promotion dans cette catégorie</h2>
              <p>
                Essayez une autre catégorie ou parcourez tout le catalogue.
              </p>
              <div className="shop-promos-empty-actions">
                {categorie && (
                  <Link href="/promos" className="shop-promos-btn-outline">
                    Toutes les promos
                  </Link>
                )}
                <Link href="/produits" className="shop-promos-btn-primary">
                  Voir la boutique
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
