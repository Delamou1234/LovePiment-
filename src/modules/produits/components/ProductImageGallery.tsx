'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80';

/** AliExpress : zoom ×2 dans le cadre preview (383×383) */
const ZOOM_RATIO = 2;

type CursorState = {
  px: number;
  py: number;
  w: number;
  h: number;
};

export type RelatedProductThumb = {
  slug: string;
  nom: string;
  image: string;
};

type Props = {
  images: string[];
  alt: string;
  badge?: React.ReactNode;
  relatedProducts?: RelatedProductThumb[];
};

function SliderThumb({
  img,
  active,
  onSelect,
  label,
}: {
  img: string;
  active: boolean;
  onSelect: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn('product-gallery-ae-thumb', active && 'is-active')}
      aria-label={label}
      aria-current={active}
    >
      <Image src={img} alt="" fill sizes="51px" className="object-contain" />
    </button>
  );
}

function SimilarThumb({ product }: { product: RelatedProductThumb }) {
  return (
    <Link
      href={`/produits/${product.slug}`}
      className="product-gallery-ae-thumb product-gallery-ae-thumb--link"
      title={product.nom}
      aria-label={`Produit similaire — ${product.nom}`}
    >
      <Image
        src={product.image || IMAGE_FALLBACK}
        alt={product.nom}
        fill
        sizes="51px"
        className="object-contain"
      />
    </Link>
  );
}

export function ProductImageGallery({ images, alt, badge, relatedProducts = [] }: Props) {
  const gallery = images.length > 0 ? images : [IMAGE_FALLBACK];
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const previewRef = useRef<HTMLDivElement>(null);
  const [hoverZoom, setHoverZoom] = useState(false);
  const [cursor, setCursor] = useState<CursorState>({ px: 0, py: 0, w: 0, h: 0 });
  const [canHoverZoom, setCanHoverZoom] = useState(false);

  const activeImage = gallery[activeIndex];
  const hasSimilar = relatedProducts.length > 0;

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
    selectIndex((activeIndex - 1 + gallery.length) % gallery.length);
  }, [activeIndex, gallery.length, selectIndex]);

  const goNext = useCallback(() => {
    selectIndex((activeIndex + 1) % gallery.length);
  }, [activeIndex, gallery.length, selectIndex]);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)');
    const sync = () => setCanHoverZoom(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

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

  useRunAfterMount(() => {
    if (zoomOpen) resetZoom();
  }, [zoomOpen, activeIndex, resetZoom]);

  const syncCursor = (clientX: number, clientY: number) => {
    if (!previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    setCursor({
      px: clientX - rect.left,
      py: clientY - rect.top,
      w: rect.width,
      h: rect.height,
    });
  };

  const handlePreviewMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canHoverZoom) return;
    syncCursor(e.clientX, e.clientY);
  };

  const handlePreviewMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canHoverZoom) return;
    syncCursor(e.clientX, e.clientY);
    setHoverZoom(true);
  };

  const zoomPosX = cursor.w > 0 ? (cursor.px / cursor.w) * 100 : 50;
  const zoomPosY = cursor.h > 0 ? (cursor.py / cursor.h) * 100 : 50;

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(4, Math.max(1, s + (e.deltaY < 0 ? 0.15 : -0.15))));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return;
    dragging.current = true;
    setIsDragging(true);
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
    setIsDragging(false);
  };

  return (
    <>
      <div className="product-gallery-wrap">
        <div className="product-gallery-ae">
          <div className="product-gallery-ae-slider scrollbar-hide">
            {gallery.map((img, idx) => (
              <SliderThumb
                key={`slide-${img}-${idx}`}
                img={img}
                active={activeIndex === idx}
                onSelect={() => selectIndex(idx)}
                label={`${alt} — vue ${idx + 1}`}
              />
            ))}

            {hasSimilar && (
              <>
                <div className="product-gallery-ae-slider-divider" aria-hidden />
                <p className="product-gallery-ae-slider-label">Similaires</p>
                {relatedProducts.map((p) => (
                  <SimilarThumb key={p.slug} product={p} />
                ))}
              </>
            )}
          </div>

          <div className="product-gallery-ae-preview-wrap">
            <div
              ref={previewRef}
              className={cn(
                'product-gallery-ae-preview-box',
                hoverZoom && canHoverZoom && 'is-magnifying',
              )}
              onMouseEnter={handlePreviewMouseEnter}
              onMouseLeave={() => setHoverZoom(false)}
              onMouseMove={handlePreviewMouseMove}
              onClick={() => !canHoverZoom && setZoomOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setZoomOpen(true);
                }
              }}
              aria-label={`${alt} — survoler pour zoomer`}
            >
              <div className="product-gallery-ae-magnifier-wrap">
                {!(hoverZoom && canHoverZoom) ? (
                  <Image
                    src={activeImage}
                    alt={alt}
                    fill
                    priority
                    sizes="(max-width: 1023px) 88vw, 383px"
                    className="product-gallery-ae-base-image"
                    draggable={false}
                  />
                ) : (
                  <div
                    className="product-gallery-ae-magnifier"
                    style={{
                      backgroundImage: `url(${activeImage})`,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: `${ZOOM_RATIO * 100}%`,
                      backgroundPosition: `${zoomPosX}% ${zoomPosY}%`,
                    }}
                    aria-hidden
                  />
                )}
              </div>

              {badge}
            </div>
          </div>
        </div>

        <div className="product-gallery-thumbs-mobile scrollbar-hide lg:hidden">
          {gallery.map((img, idx) => (
            <SliderThumb
              key={`m-${img}-${idx}`}
              img={img}
              active={activeIndex === idx}
              onSelect={() => selectIndex(idx)}
              label={`Vue ${idx + 1}`}
            />
          ))}
          {hasSimilar &&
            relatedProducts.map((p) => (
              <SimilarThumb key={`m-sim-${p.slug}`} product={p} />
            ))}
        </div>
      </div>

      {zoomOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/92 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Zoom produit"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-medium">
              {alt} ({activeIndex + 1}/{gallery.length})
            </span>
            <div className="flex items-center gap-2">
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    className="rounded-full bg-white/10 p-2 hover:bg-white/20"
                    aria-label="Image précédente"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="rounded-full bg-white/10 p-2 hover:bg-white/20"
                    aria-label="Image suivante"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
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
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                cursor: scale > 1 ? 'grab' : 'zoom-in',
              }}
              onClick={() => scale === 1 && setScale(2)}
            >
              <div className="relative h-[min(80vh,720px)] w-full max-w-3xl">
                <Image src={activeImage} alt={alt} fill sizes="90vw" className="object-contain" priority />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
