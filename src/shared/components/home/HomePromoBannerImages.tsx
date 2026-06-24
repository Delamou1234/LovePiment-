'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

export type PromoBannerSlide = {
  src: string;
  alt: string;
  slug?: string;
};

const ROTATION_MS = 6000;

type Props = {
  slides: PromoBannerSlide[];
};

export function HomePromoBannerImages({ slides }: Props) {
  const [index, setIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
      setProgressKey((k) => k + 1);
    }, ROTATION_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const current = slides[index];

  return (
    <div className="relative h-full min-h-[280px] sm:min-h-[340px] lg:min-h-full w-full overflow-hidden bg-zinc-900">
      {slides.map((slide, i) => {
        const active = i === index;
        const prev =
          slides.length > 1 ? (index - 1 + slides.length) % slides.length : index;
        if (slides.length > 1 && i !== index && i !== prev) return null;

        return (
          <Link
            key={`${slide.slug ?? slide.alt}-${i}`}
            href={slide.slug ? `/produits/${slide.slug}` : '/promos'}
            className={`absolute inset-0 block transition-opacity duration-[1400ms] ease-out ${
              active ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
            }`}
            aria-hidden={!active}
            tabIndex={active ? 0 : -1}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className={`object-cover object-center transition-transform duration-[8000ms] ease-out ${
                active ? 'scale-105' : 'scale-100'
              }`}
              loading="lazy"
              unoptimized={slide.src.startsWith('/')}
            />
          </Link>
        );
      })}

      <div
        className="absolute inset-0 z-[2] bg-gradient-to-t from-black/50 via-black/10 to-black/5 pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute inset-0 z-[2] bg-gradient-to-r from-[#9B1B2E]/20 to-transparent pointer-events-none lg:hidden"
        aria-hidden
      />

      <div className="absolute bottom-8 left-0 right-0 z-[3] px-5 sm:px-8 flex items-end justify-between gap-4 pointer-events-none">
        <div className="min-w-0 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 mb-1">
            Sélection promo
          </p>
          <p className="font-serif text-lg sm:text-xl font-bold text-white line-clamp-2 drop-shadow-sm">
            {current.alt}
          </p>
        </div>
        {slides.length > 1 && (
          <span className="shrink-0 mb-4 rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white tabular-nums">
            {index + 1}/{slides.length}
          </span>
        )}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 z-[4] flex gap-1 px-5 sm:px-8 pointer-events-auto">
          {slides.map((slide, i) => (
            <button
              key={`dot-${slide.slug ?? i}`}
              type="button"
              aria-label={`Afficher ${slide.alt}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => {
                setIndex(i);
                setProgressKey((k) => k + 1);
              }}
              className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-white/25"
            >
              {i === index && (
                <span
                  key={progressKey}
                  className="home-promo-progress absolute inset-y-0 left-0 rounded-full bg-white"
                  style={{ animationDuration: `${ROTATION_MS}ms` }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      <span className="absolute top-5 right-5 z-[3] flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-md text-white pointer-events-none">
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </div>
  );
}
