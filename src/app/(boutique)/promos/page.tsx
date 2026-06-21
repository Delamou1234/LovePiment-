import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, ChevronRight, Percent, Tag, Timer } from 'lucide-react';
import { PromoProductCard } from '@/modules/produits/components/PromoProductCard';
import { PromoHeroStrip } from '@/modules/produits/components/PromoHeroStrip';
import { variantePourCarte } from '@/shared/lib/product-card';
import { productService } from '@/modules/produits/services/product.service';
import { formaterDatePromo } from '@/modules/produits/lib/promo';

export const metadata: Metadata = {
  title: 'Promotions | KabiShop',
  description:
    'Profitez des offres en cours sur parfums et huiles KabiShop à Conakry. Prix réduits mis à jour en temps réel.',
};

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

function trierPromos<
  T extends {
    remisePct: number;
    prixNum: number;
    prixPromoNum: number | null;
    promoFin: Date | null;
  },
>(produits: T[], tri: TriPromo): T[] {
  const sorted = [...produits];

  switch (tri) {
    case 'prix_asc':
      return sorted.sort(
        (a, b) =>
          (a.prixPromoNum ?? a.prixNum) - (b.prixPromoNum ?? b.prixNum),
      );
    case 'fin':
      return sorted.sort((a, b) => {
        if (!a.promoFin && !b.promoFin) return 0;
        if (!a.promoFin) return 1;
        if (!b.promoFin) return -1;
        return a.promoFin.getTime() - b.promoFin.getTime();
      });
    case 'remise':
    default:
      return sorted.sort((a, b) => b.remisePct - a.remisePct);
  }
}

export const revalidate = 60;

export default async function PromosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { categorie = '', tri = 'remise' } = await searchParams;
  const triActif = (TRI_OPTIONS.some((t) => t.value === tri) ? tri : 'remise') as TriPromo;

  const [categories, stats, produitsBruts] = await Promise.all([
    productService.listerCategories(),
    productService.obtenirStatsPromos(),
    productService.listerPromotionsActives({
      categorieSlug: categorie || undefined,
    }),
  ]);

  const produits = trierPromos(produitsBruts, triActif);
  const prochaineFin = produits
    .filter((p) => p.promoFin)
    .sort((a, b) => (a.promoFin!.getTime() - b.promoFin!.getTime()))[0]?.promoFin;

  const buildUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams();
    if (categorie) params.set('categorie', categorie);
    if (triActif) params.set('tri', triActif);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null) params.delete(key);
      else params.set(key, val);
    });
    return `/promos?${params.toString()}`;
  };

  return (
    <div className="animate-fadeIn">
      {/* Hero */}
      <section className="bg-[#4a5240] text-white">
        <div className="container-kabishop py-10 md:py-14">
          <div className="flex items-center gap-1.5 text-xs text-white/60 mb-6">
            <Link href="/" className="hover:text-white transition font-medium">
              Accueil
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white font-bold">Promotions</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60 mb-3">
                Offres en cours
              </p>
              <h1 className="font-serif text-3xl md:text-4xl font-bold leading-tight">
                {stats.total > 0
                  ? stats.remiseMax > 0
                    ? `Jusqu'à -${stats.remiseMax}% sur ${stats.total} produit${stats.total > 1 ? 's' : ''}`
                    : `${stats.total} promotion${stats.total > 1 ? 's' : ''} active${stats.total > 1 ? 's' : ''}`
                  : 'Promotions KabiShop'}
              </h1>
              <p className="mt-4 text-sm text-white/75 leading-relaxed max-w-lg">
                Parfums et huiles à prix réduit, synchronisés avec notre catalogue.
                {prochaineFin && (
                  <> Prochaine fin d&apos;offre : {formaterDatePromo(prochaineFin)}.</>
                )}
              </p>
              <Link
                href="/produits"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#4a5240] hover:bg-[#faf7f2] transition"
              >
                Voir toute la boutique
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 md:p-5 text-center">
                <Tag className="h-5 w-5 mx-auto text-white/70 mb-2" />
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-[10px] text-white/60 mt-1 uppercase tracking-wider">En promo</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 md:p-5 text-center">
                <Percent className="h-5 w-5 mx-auto text-white/70 mb-2" />
                <p className="text-2xl font-bold">
                  {stats.remiseMax > 0 ? `-${stats.remiseMax}%` : '—'}
                </p>
                <p className="text-[10px] text-white/60 mt-1 uppercase tracking-wider">Remise max</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 md:p-5 text-center">
                <Timer className="h-5 w-5 mx-auto text-white/70 mb-2" />
                <p className="text-sm font-bold leading-snug mt-1">
                  {prochaineFin ? formaterDatePromo(prochaineFin) : 'Illimitées'}
                </p>
                <p className="text-[10px] text-white/60 mt-1 uppercase tracking-wider">Prochaine fin</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PromoHeroStrip
        produits={produits.map((p) => ({
          slug: p.slug,
          nom: p.nom,
          image: p.images[0],
          remisePct: p.remisePct,
          prixPromoNum: p.prixPromoNum ?? p.prixNum,
        }))}
      />

      {/* Filtres + grille */}
      <section className="container-kabishop py-10 md:py-14 bg-[#faf7f2]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-[#ebe4d8] pb-6 mb-8">
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildUrl({ categorie: null })}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                !categorie
                  ? 'bg-[#4a5240] text-white'
                  : 'bg-[#f5f0e8] text-zinc-600 hover:bg-[#ebe4d8]'
              }`}
            >
              Toutes
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={buildUrl({ categorie: cat.slug })}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  categorie === cat.slug
                    ? 'bg-[#4a5240] text-white'
                    : 'bg-[#f5f0e8] text-zinc-600 hover:bg-[#ebe4d8]'
                }`}
              >
                {cat.nom}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-100/80 p-1 rounded-lg self-start">
            {TRI_OPTIONS.map((option) => (
              <Link
                key={option.value}
                href={buildUrl({ tri: option.value })}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition duration-200 whitespace-nowrap ${
                  triActif === option.value
                    ? 'bg-white text-[#4a5240] shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        <p className="text-sm text-zinc-500 mb-6">
          {produits.length} promotion{produits.length !== 1 ? 's' : ''} en cours
          {categorie
            ? ` — ${categories.find((c) => c.slug === categorie)?.nom ?? categorie}`
            : ''}
        </p>

        {produits.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
            {produits.map((p) => (
              <PromoProductCard
                key={p.id}
                id={p.id}
                slug={p.slug}
                nom={p.nom}
                categorie={p.categorie.nom}
                prix={p.prixNum}
                prixPromo={p.prixPromoNum ?? p.prixNum}
                promoFin={p.promoFin?.toISOString() ?? null}
                image={p.images[0]}
                remisePct={p.remisePct}
                variante={variantePourCarte(
                  p.id,
                  p.prixPromoNum ?? p.prixNum,
                  p.variantes?.[0],
                )}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[#ebe4d8] rounded-2xl bg-[#faf7f2]/50">
            <Tag className="h-12 w-12 text-zinc-300 mb-4" />
            <h2 className="text-lg font-bold text-zinc-900 mb-2">Aucune promotion en cours</h2>
            <p className="text-sm text-zinc-500 max-w-md leading-relaxed mb-6">
              {categorie
                ? 'Aucune offre active dans cette catégorie pour le moment. Consultez le catalogue complet ou revenez bientôt.'
                : 'Les promotions seront affichées ici dès qu\'elles seront configurées dans l\'administration.'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {categorie && (
                <Link
                  href="/promos"
                  className="inline-flex items-center gap-2 rounded-full border border-[#4a5240] px-5 py-2.5 text-sm font-semibold text-[#4a5240] hover:bg-[#4a5240] hover:text-white transition"
                >
                  Toutes les promos
                </Link>
              )}
              <Link
                href="/produits"
                className="inline-flex items-center gap-2 rounded-full bg-[#4a5240] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3d4534] transition"
              >
                Voir le catalogue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
