'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn, X, ZoomOut, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80';

type Props = {
  images: string[];
  alt: string;
  badge?: React.ReactNode;
};

export function ProductImageGallery({ images, alt, badge }: Props) {
  const gallery = images.length > 0 ? images : [IMAGE_FALLBACK];
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const activeImage = gallery[activeIndex];

  const resetZoom = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i <= 0 ? gallery.length - 1 : i - 1));
    resetZoom();
  }, [gallery.length, resetZoom]);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i >= gallery.length - 1 ? 0 : i + 1));
    resetZoom();
  }, [gallery.length, resetZoom]);

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

  return (
    <>
      <div className="space-y-4 lg:sticky lg:top-24">
        <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#f5f0e8] ring-1 ring-[#ebe4d8]">
          <Image
            src={activeImage}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="cursor-zoom-in object-cover object-center transition duration-500 group-hover:scale-[1.02]"
            priority
            onClick={() => setZoomOpen(true)}
          />
          {badge}
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-xs font-semibold text-zinc-800 shadow-md transition sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ZoomIn className="h-3.5 w-3.5" />
            Agrandir
          </button>
          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md opacity-0 transition group-hover:opacity-100"
                aria-label="Image précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md opacity-0 transition group-hover:opacity-100"
                aria-label="Image suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {gallery.length > 1 && (
          <div className="scrollbar-hide flex gap-2.5 overflow-x-auto pb-1">
            {gallery.map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                type="button"
                onClick={() => setActiveIndex(idx)}
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

            {gallery.length > 1 && (
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

          {gallery.length > 1 && (
            <div className="flex justify-center gap-2 px-4 py-3">
              {gallery.map((img, idx) => (
                <button
                  key={`zoom-thumb-${idx}`}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
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
