'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';

const SLIDE_DURATION_MS = 5000;

const BRAND_STORY_SLIDES = [
  {
    id: 'merveille',
    src: '/images/love-piment-brand-story.png',
    alt: 'Love Piment& — Merveille, boutique intime à Conakry',
  },
  {
    id: 'deesse',
    src: '/images/love-piment-brand-story-deesse.png',
    alt: 'Love Piment& — La Déesse',
  },
] as const;

export function LandingBrandStorySlides() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goToSlide = useCallback((index: number) => {
    setSlideIndex(index);
  }, []);

  const nextSlide = useCallback(() => {
    setSlideIndex((i) => (i + 1) % BRAND_STORY_SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused || BRAND_STORY_SLIDES.length <= 1) return;
    const interval = setInterval(nextSlide, SLIDE_DURATION_MS);
    return () => clearInterval(interval);
  }, [nextSlide, paused]);

  return (
    <div
      className="lp-brand-story-image-wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {BRAND_STORY_SLIDES.map((slide, index) => {
        const active = index === slideIndex;
        return (
          <div
            key={slide.id}
            className={`lp-brand-story-slide ${active ? 'is-active' : ''}`}
            aria-hidden={!active}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority={index === 0}
            />
          </div>
        );
      })}

      {BRAND_STORY_SLIDES.length > 1 && (
        <div className="lp-brand-story-dots" role="tablist" aria-label="Photos Love Piment&">
          {BRAND_STORY_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={index === slideIndex}
              aria-label={`Photo ${index + 1}`}
              className={`lp-brand-story-dot ${index === slideIndex ? 'is-active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
