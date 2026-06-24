'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Sparkles, Truck } from 'lucide-react';

const SLIDE_DURATION_MS = 6500;

const FALLBACK_SLIDES = [
  {
    id: 'boutique',
    src: '/images/love-piment-secret.png',
    alt: 'Love Piment& — boutique intime',
    position: 'object-center',
    tag: 'Boutique intime',
    title: 'Osez le plaisir, en toute discrétion',
    subtitle: 'Sextoys, lingerie, lubrifiants et accessoires pour adultes — livraison discrète à Conakry.',
    cta: { label: 'Découvrir la boutique', href: '/produits' },
  },
];

type HeroSlide = (typeof FALLBACK_SLIDES)[number];

export type HeroCategoryLink = {
  nom: string;
  slug: string;
  image: string;
  desc?: string;
};

export type HeroFeaturedPeek = {
  nom: string;
  slug: string;
  image: string;
  prix: number;
  categorie: string;
};

type HomeHeroProps = {
  categories?: HeroCategoryLink[];
  featured?: HeroFeaturedPeek | null;
};

function heroImageSrc(url: string): string {
  if (url.includes('images.unsplash.com') && /[?&]w=\d+/.test(url)) {
    return url.replace(/w=\d+/, 'w=1920').replace(/q=\d+/, 'q=85');
  }
  return url;
}

function buildHeroSlides(categories: HeroCategoryLink[]): HeroSlide[] {
  if (categories.length === 0) return FALLBACK_SLIDES;

  return categories.map((cat) => ({
    id: cat.slug,
    src: heroImageSrc(cat.image),
    alt: cat.nom,
    position: 'object-center',
    tag: cat.nom,
    title: cat.nom,
    subtitle: cat.desc ?? 'Découvrez notre sélection.',
    cta: { label: `Voir ${cat.nom}`, href: `/produits?categorie=${cat.slug}` },
  }));
}

export function HomeHero({ categories = [], featured }: HomeHeroProps) {
  const slides = useMemo(() => buildHeroSlides(categories), [categories]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);

  useEffect(() => {
    setSlideIndex(0);
    setProgressKey((k) => k + 1);
  }, [slides.length]);

  const goToSlide = useCallback((index: number) => {
    setSlideIndex(index);
    setProgressKey((k) => k + 1);
  }, []);

  const nextSlide = useCallback(() => {
    setSlideIndex((i) => (i + 1) % slides.length);
    setProgressKey((k) => k + 1);
  }, [slides.length]);

  useEffect(() => {
    const interval = setInterval(nextSlide, SLIDE_DURATION_MS);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const slide = slides[slideIndex];
  const quickCategories = categories.slice(0, 3);

  return (
    <section className="relative isolate min-h-[420px] h-[min(480px,78vh)] sm:min-h-[500px] sm:h-[min(540px,82vh)] md:min-h-[620px] md:h-[min(680px,88vh)] overflow-hidden bg-[#1a1a18]">
      <div className="absolute inset-0">
        {slides.map((s, index) => {
          const active = index === slideIndex;
          const prev =
            slides.length > 1
              ? (slideIndex - 1 + slides.length) % slides.length
              : slideIndex;
          const shouldRender =
            slides.length <= 1 || index === slideIndex || index === prev;
          if (!shouldRender) return null;

          return (
            <div
              key={s.id}
              className={`absolute inset-0 overflow-hidden transition-opacity duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
                active ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
              }`}
              aria-hidden={!active}
            >
              <div className="absolute -inset-[12%] sm:-inset-[10%] md:-inset-[8%]">
                <Image
                  src={s.src}
                  alt={s.alt}
                  fill
                  priority={index === 0 && slideIndex === 0}
                  loading={index === 0 && slideIndex === 0 ? undefined : 'lazy'}
                  quality={90}
                  sizes="100vw"
                  className={`object-cover ${s.position}`}
                  unoptimized={s.src.startsWith('/')}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-black/80 via-black/45 to-black/20" aria-hidden />
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/50 via-transparent to-black/20" aria-hidden />

      <div className="relative z-10 flex h-full items-center pb-16 sm:pb-20 md:pb-24">
        <div className="container-shop w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-7 xl:col-span-8 hero-content-enter" key={slide.id}>
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                  <Sparkles className="h-3 w-3" />
                  {slide.tag}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1 text-[11px] font-medium text-white">
                  <Truck className="h-3 w-3" />
                  Livraison 24–48h Conakry
                </span>
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60 mb-3">
                Love Piment& · Boutique intime & plaisir
              </p>

              <h1 className="font-serif text-[1.75rem] leading-[1.12] font-bold tracking-tight text-white sm:text-5xl md:text-[3.25rem]">
                {slide.title}
              </h1>

              <p className="mt-3 sm:mt-4 max-w-lg text-sm leading-relaxed text-white/80 md:text-base">
                {slide.subtitle}
              </p>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
                <Link
                  href={slide.cta.href}
                  className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-olive px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-olive/30 transition hover:bg-olive-dark hover:scale-[1.02]"
                >
                  {slide.cta.label}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/produits"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Toute la boutique
                </Link>
              </div>

              {quickCategories.length > 0 && (
                <div className="mt-6 lg:hidden -mx-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-3">
                    Collections
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
                    {quickCategories.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/produits?categorie=${cat.slug}`}
                        className="group flex shrink-0 snap-start items-center gap-2.5 rounded-xl border border-white/15 bg-black/30 backdrop-blur-sm px-3 py-2 min-w-[140px] max-w-[180px] transition hover:bg-white/10"
                      >
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/20">
                          <Image
                            src={cat.image}
                            alt={cat.nom}
                            fill
                            sizes="40px"
                            className="object-cover"
                            unoptimized={cat.image.startsWith('/')}
                          />
                        </div>
                        <span className="text-xs font-semibold text-white line-clamp-2 leading-snug">
                          {cat.nom}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Accès rapide — desktop */}
            <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 flex-col gap-4">
              {quickCategories.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/25 backdrop-blur-md p-5 shadow-2xl">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-4">
                    Explorer par collection
                  </p>
                  <ul className="space-y-2">
                    {quickCategories.map((cat) => (
                      <li key={cat.slug}>
                        <Link
                          href={`/produits?categorie=${cat.slug}`}
                          className="group flex items-center gap-3 rounded-xl p-2 -mx-2 transition hover:bg-white/10"
                        >
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/20">
                            <Image
                              src={cat.image}
                              alt={cat.nom}
                              fill
                              sizes="56px"
                              className="object-cover transition duration-500 group-hover:scale-110"
                              unoptimized={cat.image.startsWith('/')}
                            />
                          </div>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-semibold text-white truncate">
                              {cat.nom}
                            </span>
                            <span className="block text-[11px] text-white/50 mt-0.5">
                              Voir la collection
                            </span>
                          </span>
                          <ArrowUpRight className="h-4 w-4 text-white/40 shrink-0 transition group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/produits"
                    className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition"
                  >
                    Toutes les catégories
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}

              {featured && (
                <Link
                  href={`/produits/${featured.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/95 p-4 shadow-2xl transition hover:shadow-white/10 hover:scale-[1.01]"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream">
                    {featured.image && (
                      <Image
                        src={featured.image}
                        alt={featured.nom}
                        fill
                        sizes="80px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                        unoptimized={featured.image.startsWith('/')}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-olive">
                      Coup de cœur
                    </p>
                    <p className="font-serif text-base font-bold text-zinc-900 line-clamp-1 mt-0.5">
                      {featured.nom}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">{featured.categorie}</p>
                    <p className="text-sm font-bold text-zinc-900 mt-1.5">
                      {featured.prix.toLocaleString('fr-FR')} GN
                    </p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-olive text-white transition group-hover:bg-olive-dark">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 sm:bottom-8 left-1/2 z-[3] flex -translate-x-1/2 items-center gap-2 md:bottom-10">
        {slides.map((s, index) => (
          <button
            key={s.id}
            type="button"
            onClick={() => goToSlide(index)}
            aria-label={`Slide ${index + 1}`}
            aria-current={index === slideIndex ? 'true' : undefined}
            className={`relative overflow-hidden rounded-full transition-all duration-500 ${
              index === slideIndex ? 'h-1 w-12 bg-white/30' : 'h-1 w-2 bg-white/40 hover:bg-white/60'
            }`}
          >
            {index === slideIndex && (
              <span
                key={progressKey}
                className="hero-slide-progress absolute inset-0 rounded-full bg-white"
              />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
