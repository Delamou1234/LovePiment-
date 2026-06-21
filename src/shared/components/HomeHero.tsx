'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Truck } from 'lucide-react';

const SLIDE_DURATION_MS = 6500;

const HERO_SLIDES = [
  {
    id: 'parfums',
    src: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1920&q=90&auto=format&fit=crop',
    alt: 'Collection de parfums',
    position: 'object-[center_45%]',
    tag: 'Nouvelle collection',
    title: 'Parfums d\'exception',
    subtitle: 'Notes florales, boisées & orientales sélectionnées pour vous.',
    cta: { label: 'Shop parfums', href: '/produits?categorie=parfums' },
  },
  {
    id: 'huiles-corps',
    src: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1920&q=90&auto=format&fit=crop',
    alt: 'Huiles corporelles',
    position: 'object-center',
    tag: 'Soin premium',
    title: 'Huiles corps & bien-être',
    subtitle: 'Hydratation intense, parfums naturels, peau éclatante.',
    cta: { label: 'Shop huiles', href: '/produits?categorie=huiles-corps' },
  },
  {
    id: 'eaux-parfum',
    src: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1920&q=90&auto=format&fit=crop',
    alt: 'Eaux de parfum',
    position: 'object-[center_40%]',
    tag: 'Best-sellers',
    title: 'Eaux de parfum',
    subtitle: 'Fraîcheur durable pour le quotidien à Conakry.',
    cta: { label: 'Découvrir', href: '/produits?categorie=eaux-parfum' },
  },
];

export function HomeHero() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);

  const goToSlide = useCallback((index: number) => {
    setSlideIndex(index);
    setProgressKey((k) => k + 1);
  }, []);

  const nextSlide = useCallback(() => {
    setSlideIndex((i) => (i + 1) % HERO_SLIDES.length);
    setProgressKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const interval = setInterval(nextSlide, SLIDE_DURATION_MS);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const slide = HERO_SLIDES[slideIndex];

  return (
    <section className="relative isolate min-h-[540px] h-[min(580px,85vh)] md:min-h-[620px] md:h-[min(680px,88vh)] overflow-hidden bg-[#1a1a18]">
      {/* Carrousel */}
      <div className="absolute inset-0">
        {HERO_SLIDES.map((s, index) => {
          const active = index === slideIndex;
          return (
            <div
              key={s.id}
              className={`absolute inset-0 transition-opacity duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
                active ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
              }`}
              aria-hidden={!active}
            >
              <Image
                src={s.src}
                alt={s.alt}
                fill
                priority={index === 0}
                quality={90}
                sizes="100vw"
                className={`object-cover ${s.position} ${
                  active ? 'animate-heroZoomSlow' : 'scale-[1.03]'
                }`}
              />
            </div>
          );
        })}
      </div>

      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-black/80 via-black/40 to-black/10" aria-hidden />
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/50 via-transparent to-black/20" aria-hidden />

      {/* Contenu e-commerce */}
      <div className="relative z-10 flex h-full items-center pb-20 md:pb-24">
        <div className="container-kabishop w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 hero-content-enter" key={slide.id}>
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                  <Sparkles className="h-3 w-3" />
                  {slide.tag}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4a5240]/90 px-3 py-1 text-[11px] font-medium text-white">
                  <Truck className="h-3 w-3" />
                  Livraison 24–48h Conakry
                </span>
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60 mb-3">
                KabiShop · Parfums & Huiles
              </p>

              <h1 className="font-serif text-[2rem] leading-[1.1] font-bold tracking-tight text-white sm:text-5xl md:text-[3.25rem]">
                {slide.title}
              </h1>

              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80 md:text-base">
                {slide.subtitle}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={slide.cta.href}
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-zinc-900 shadow-xl shadow-black/25 transition hover:bg-[#faf7f2] hover:scale-[1.02]"
                >
                  {slide.cta.label}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/produits"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Toute la boutique
                </Link>
              </div>
            </div>

            {/* Carte promo flottante — desktop */}
            <div className="hidden lg:flex lg:col-span-5 justify-end">
              <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-6 shadow-2xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                  Offre du moment
                </p>
                <p className="font-serif text-3xl font-bold text-white mt-2">-20%</p>
                <p className="text-sm text-white/75 mt-1">
                  Sur une sélection de parfums & huiles premium
                </p>
                <div className="mt-5 pt-5 border-t border-white/15 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-white">8+</p>
                    <p className="text-[10px] text-white/50 mt-0.5">Produits</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">100%</p>
                    <p className="text-[10px] text-white/50 mt-0.5">Authentique</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">7j/7</p>
                    <p className="text-[10px] text-white/50 mt-0.5">Support</p>
                  </div>
                </div>
                <Link
                  href="/promos"
                  className="mt-5 flex w-full items-center justify-center rounded-full bg-[#4a5240] py-3 text-sm font-semibold text-white hover:bg-[#3d4534] transition"
                >
                  Profiter de l&apos;offre
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicateurs */}
      <div className="absolute bottom-8 left-1/2 z-[3] flex -translate-x-1/2 items-center gap-2 md:bottom-10">
        {HERO_SLIDES.map((s, index) => (
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
