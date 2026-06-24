'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRunAfterMount } from '@/shared/hooks/useRunAfterMount';
import Image from 'next/image';
import Link from 'next/link';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80';

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

function ImageThumb({
  img,
  active,
  onSelect,
  label,
}: {
  img: string;
  active: boolean;
  onSelect?: () => void;
  label: string;
}) {
  const className = cn('product-gallery-thumb', active && 'is-active');

  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} className={className} aria-label={label} aria-current={active}>
        <Image src={img} alt="" fill sizes="72px" className="object-cover" />
      </button>
    );
  }

  return (
    <div className={className}>
      <Image src={img} alt="" fill sizes="72px" className="object-cover" />
    </div>
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

  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomOpen]);

  useRunAfterMount(() => {
    if (zoomOpen) resetZoom();
  }, [zoomOpen, activeIndex, resetZoom]);

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

  const showSidebar = gallery.length > 1 || relatedProducts.length > 0;

  return (
    <>
      <div className="lg:sticky lg:top-24">
        <div className="product-gallery-luxury">
          {showSidebar && (
            <aside className="product-gallery-sidebar">
              {gallery.length > 1 && (
                <div className="product-gallery-thumbs-vertical">
                  {gallery.map((img, idx) => (
                    <ImageThumb
                      key={`v-${img}-${idx}`}
                      img={img}
                      active={activeIndex === idx}
                      onSelect={() => selectIndex(idx)}
                      label={`${alt} — vue ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {relatedProducts.length > 0 && (
                <div className="product-gallery-related-block">
                  <p className="product-gallery-related-label">Autres modèles</p>
                  <div className="product-gallery-related">
                    {relatedProducts.map((p) => (
                      <Link
                        key={p.slug}
                        href={`/produits/${p.slug}`}
                        className="product-gallery-thumb product-gallery-thumb--link"
                        title={p.nom}
                      >
                        <Image
                          src={p.image || IMAGE_FALLBACK}
                          alt={p.nom}
                          fill
                          sizes="72px"
                          className="object-cover"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          )}

          <button
            type="button"
            className="product-gallery-main group"
            onClick={() => setZoomOpen(true)}
            aria-label={`Agrandir — ${alt}`}
          >
            <Image
              src={activeImage}
              alt={alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 48vw"
              className="object-cover object-center transition-opacity duration-500"
            />
            {badge}
          </button>
        </div>

        {gallery.length > 1 && (
          <div className="product-gallery-thumbs-mobile scrollbar-hide lg:hidden">
            {gallery.map((img, idx) => (
              <ImageThumb
                key={`m-${img}-${idx}`}
                img={img}
                active={activeIndex === idx}
                onSelect={() => selectIndex(idx)}
                label={`Vue ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {zoomOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/92 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Zoom produit"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-medium">{alt}</span>
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
