import Link from 'next/link';
import { ArrowRight, Percent, Sparkles, Tag } from 'lucide-react';
import { HomePromoBannerImages, type PromoBannerSlide } from '@/shared/components/home/HomePromoBannerImages';
import type { CategorieVitrine } from '@/modules/produits/lib/category-showcase';
import { CATEGORIE_IMAGE_DEFAUT } from '@/modules/produits/lib/category-showcase';

type PromoStats = {
  total: number;
  remiseMax: number;
};

type Props = {
  categories: CategorieVitrine[];
  statsPromos: PromoStats;
  promoBanniere: PromoBannerSlide[];
};

function construireSlides(
  promoBanniere: PromoBannerSlide[],
  categories: CategorieVitrine[],
): PromoBannerSlide[] {
  if (promoBanniere.length > 0) return promoBanniere;

  const fromCategories = categories
    .filter((c) => c.image)
    .slice(0, 4)
    .map((c) => ({ src: c.image, alt: c.nom, slug: undefined }));

  if (fromCategories.length > 0) return fromCategories;

  return [{ src: CATEGORIE_IMAGE_DEFAUT, alt: 'Promo Love Piment&' }];
}

export function HomePromoSection({ categories, statsPromos, promoBanniere }: Props) {
  const bannerSlides = construireSlides(promoBanniere, categories);

  const promoTitre =
    statsPromos.remiseMax > 0
      ? `Jusqu'à -${statsPromos.remiseMax}% sur une sélection premium`
      : statsPromos.total > 0
        ? `${statsPromos.total} promotion${statsPromos.total > 1 ? 's' : ''} en cours`
        : 'Offres spéciales plaisir & intimité';

  const promoDesc =
    statsPromos.total > 0
      ? 'Produits intimes à prix réduit — stock limité, livraison discrète à Conakry.'
      : 'Retrouvez bientôt nos ventes flash et codes promo exclusifs.';

  return (
    <section className="relative w-full overflow-hidden" aria-label="Offre promotionnelle">
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:min-h-[min(520px,70vh)]">
        {/* Panneau texte — pleine largeur fond olive */}
        <div className="relative flex flex-col justify-center order-2 lg:order-1 bg-primary text-white overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
            aria-hidden
          />
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/[0.04] pointer-events-none" aria-hidden />
          <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-black/10 pointer-events-none" aria-hidden />

          <div className="relative z-10 px-6 py-12 sm:px-12 md:px-16 lg:px-20 xl:px-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/90">
              <Sparkles className="h-3 w-3" />
              Offre spéciale
            </span>

            <h2 className="mt-6 font-serif text-[1.75rem] sm:text-3xl md:text-4xl xl:text-[2.75rem] font-bold leading-[1.12] tracking-tight">
              {promoTitre}
            </h2>

            <p className="mt-5 text-sm md:text-base text-white/75 leading-relaxed max-w-md">
              {promoDesc}
            </p>

            {statsPromos.total > 0 && (
              <div className="mt-8 flex flex-wrap gap-3">
                {statsPromos.remiseMax > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-4 py-2.5 text-sm font-semibold">
                    <Percent className="h-4 w-4 text-white/70" />
                    -{statsPromos.remiseMax}% max
                  </span>
                )}
                <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-4 py-2.5 text-sm font-semibold">
                  <Tag className="h-4 w-4 text-white/70" />
                  {statsPromos.total} produit{statsPromos.total > 1 ? 's' : ''}
                </span>
              </div>
            )}

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/promos"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-[#9B1B2E] shadow-lg shadow-black/10 transition hover:bg-[#FFF8F6] hover:scale-[1.02]"
              >
                Profiter de l&apos;offre
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/produits"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Toute la boutique
              </Link>
            </div>
          </div>
        </div>

        {/* Visuels dynamiques — pleine hauteur */}
        <div className="relative order-1 lg:order-2 min-h-[300px] lg:min-h-0">
          <HomePromoBannerImages slides={bannerSlides} />
        </div>
      </div>
    </section>
  );
}
