import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { HomeSectionHeader } from '@/shared/components/home/HomeSectionHeader';
import type { CategorieVitrine } from '@/modules/produits/lib/category-showcase';
import { CATEGORIE_IMAGE_DEFAUT } from '@/modules/produits/lib/category-showcase';

type PromoStats = {
  total: number;
  remiseMax: number;
};

type Props = {
  categories: CategorieVitrine[];
  statsPromos: PromoStats;
};

const PROMO_IMAGE =
  'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=900&q=85&auto=format&fit=crop';

export function HomePromoSection({ categories, statsPromos }: Props) {
  const collections = categories.slice(0, 2);
  const promoTitre =
    statsPromos.remiseMax > 0
      ? `Jusqu'à -${statsPromos.remiseMax}% sur une sélection premium`
      : statsPromos.total > 0
        ? `${statsPromos.total} promotion${statsPromos.total > 1 ? 's' : ''} en cours`
        : 'Offres spéciales sur nos parfums & huiles';

  const promoDesc =
    statsPromos.total > 0
      ? 'Parfums et huiles à prix réduit — stock limité, profitez-en maintenant.'
      : 'Consultez régulièrement nos promotions flash et codes promo.';

  return (
    <section className="bg-white border-y border-[#ebe4d8]/60">
      <div className="container-kabishop py-16 md:py-20">
        <HomeSectionHeader
          eyebrow="Sélections"
          title="Collections & offres"
          description="Explorez nos univers parfums et huiles, puis profitez de nos promotions."
          href="/promos"
          linkLabel="Toutes les promos"
        />

        {collections.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 mb-8 md:mb-10">
            {collections.map((col) => (
              <Link
                key={col.slug}
                href={col.href}
                className="group relative aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden shadow-md"
              >
                <Image
                  src={col.image || CATEGORIE_IMAGE_DEFAUT}
                  alt={col.nom}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                  unoptimized={col.image.startsWith('/')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                    Collection
                  </p>
                  <h3 className="font-serif text-2xl md:text-3xl font-bold text-white mt-1">
                    {col.nom}
                  </h3>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white group-hover:gap-2 transition-all">
                    Shop now <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-lg min-h-0">
          <div className="flex flex-col justify-center bg-[#4a5240] p-8 md:p-12 lg:p-14 text-white order-2 lg:order-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60 mb-3">
              Offre spéciale
            </p>
            <h3 className="font-serif text-2xl md:text-3xl font-bold leading-tight">{promoTitre}</h3>
            <p className="mt-4 text-sm text-white/75 leading-relaxed max-w-md">{promoDesc}</p>
            <Link
              href="/promos"
              className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-[#4a5240] transition hover:bg-[#faf7f2]"
            >
              Profiter de l&apos;offre
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[320px] order-1 lg:order-2">
            <Image
              src={collections[0]?.image || PROMO_IMAGE}
              alt="Promo KabiShop"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
              unoptimized={Boolean(collections[0]?.image?.startsWith('/'))}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
