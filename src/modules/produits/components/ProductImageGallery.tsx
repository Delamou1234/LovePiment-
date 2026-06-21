'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn, X, ZoomOut, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80';

const AUTOPLAY_MS = 4500;

type Props = {
  images: string[];
  alt: string;
  badge?: React.ReactNode;
};

export function ProductImageGallery({ images, alt, badge }: Props) {
  const gallery = images.length > 0 ? images : [IMAGE_FALLBACK];
  const hasMultiple = gallery.length > 1;
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const touchStartX = useRef<number | null>(null);

  const activeImage = gallery[activeIndex];

  const resetZoom = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const selectIndex = useCallback(
    (index: number) => {
      setActiveIndex(index);
      resetZoom();
    },
    [resetZoom],
  );

  const goPrev = useCallback(() => {
    selectIndex(activeIndex <= 0 ? gallery.length - 1 : activeIndex - 1);
  }, [activeIndex, gallery.length, selectIndex]);

  const goNext = useCallback(() => {
    selectIndex(activeIndex >= gallery.length - 1 ? 0 : activeIndex + 1);
  }, [activeIndex, gallery.length, selectIndex]);

  useEffect(() => {
    if (!hasMultiple || zoomOpen || paused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((i) => (i >= gallery.length - 1 ? 0 : i + 1));
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [gallery.length, hasMultiple, paused, zoomOpen]);

  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomOpen(false);
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomOpen, goPrev, goNext]);

  useEffect(() => {
    if (zoomOpen) resetZoom();
  }, [zoomOpen, activeIndex, resetZoom]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(4, Math.max(1, s + (e.deltaY < 0 ? 0.15 : -0.15))));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return;
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || !hasMultiple) return;
    const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta > 0) goPrev();
    else goNext();
  };

  return (
    <>
      <div className="space-y-4 lg:sticky lg:top-24">
        <div
          className="group relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#f5f0e8] ring-1 ring-[#ebe4d8]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex h-full transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {gallery.map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                type="button"
                className="relative h-full min-w-full shrink-0 cursor-zoom-in"
                onClick={() => setZoomOpen(true)}
                aria-label={`${alt} — image ${idx + 1} sur ${gallery.length}`}
              >
                <Image
                  src={img}
                  alt={`${alt} — ${idx + 1}/${gallery.length}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover object-center"
                  priority={idx === 0}
                />
              </button>
            ))}
          </div>

          {badge}

          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-xs font-semibold text-zinc-800 shadow-md transition sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ZoomIn className="h-3.5 w-3.5" />
            Agrandir
          </button>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md opacity-90 transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Image précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md opacity-90 transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Image suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1.5 backdrop-blur-sm">
                {gallery.map((_, idx) => (
                  <button
                    key={`dot-${idx}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectIndex(idx);
                    }}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      activeIndex === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80',
                    )}
                    aria-label={`Image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {hasMultiple && (
          <div className="scrollbar-hide flex gap-2.5 overflow-x-auto pb-1">
            {gallery.map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                type="button"
                onClick={() => selectIndex(idx)}
                className={cn(
                  'relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl ring-2 transition',
                  activeIndex === idx
                    ? 'ring-[#4a5240] ring-offset-2 ring-offset-[#faf7f2]'
                    : 'opacity-70 ring-transparent hover:opacity-100',
                )}
              >
                <Image src={img} alt="" fill sizes="72px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {zoomOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/90"
          role="dialog"
          aria-modal="true"
          aria-label="Galerie zoom"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-medium">
              {activeIndex + 1} / {gallery.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(1, s - 0.25))}
                className="rounded-full bg-white/10 p-2 hover:bg-white/20"
                aria-label="Zoom arrière"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={resetZoom}
                className="rounded-full bg-white/10 p-2 hover:bg-white/20"
                aria-label="Réinitialiser"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(4, s + 0.25))}
                className="rounded-full bg-white/10 p-2 hover:bg-white/20"
                aria-label="Zoom avant"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomOpen(false)}
                className="rounded-full bg-white/10 p-2 hover:bg-white/20"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div
            className="relative flex-1 overflow-hidden"
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transition: dragging.current ? 'none' : 'transform 0.15s ease-out',
                cursor: scale > 1 ? 'grab' : 'zoom-in',
              }}
              onClick={() => scale === 1 && setScale(2)}
            >
              <div className="relative h-[min(80vh,720px)] w-full max-w-3xl">
                <Image src={activeImage} alt={alt} fill sizes="90vw" className="object-contain" priority />
              </div>
            </div>

            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {hasMultiple && (
            <div className="flex justify-center gap-2 px-4 py-3">
              {gallery.map((img, idx) => (
                <button
                  key={`zoom-thumb-${idx}`}
                  type="button"
                  onClick={() => selectIndex(idx)}
                  className={cn(
                    'relative h-12 w-12 overflow-hidden rounded-lg ring-2',
                    activeIndex === idx ? 'ring-white' : 'ring-transparent opacity-50',
                  )}
                >
                  <Image src={img} alt="" fill sizes="48px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
