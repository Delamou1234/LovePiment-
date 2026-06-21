'use client';

import { useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';

type Props = {
  src: string;
  alt?: string;
  isMine: boolean;
};

export function ImageMessagePreview({ src, alt = 'Image', isMine }: Props) {
  const openLightbox = () => {
    const overlay = document.createElement('div');
    overlay.className =
      'fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-fadeIn';
    overlay.onclick = () => overlay.remove();

    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.className = 'max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl';
    img.onclick = (e) => e.stopPropagation();

    const close = document.createElement('button');
    close.type = 'button';
    close.className =
      'absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20';
    close.innerHTML = '✕';
    close.onclick = () => overlay.remove();

    overlay.append(close, img);
    document.body.appendChild(overlay);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.querySelector('[data-chat-lightbox]')?.remove();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <button
      type="button"
      onClick={openLightbox}
      className="group relative block overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-h-64 max-w-[min(280px,70vw)] rounded-xl object-cover transition group-hover:brightness-95"
      />
      <span
        className={`absolute bottom-2 right-2 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium opacity-0 transition group-hover:opacity-100 ${
          isMine ? 'bg-black/40 text-white' : 'bg-white/90 text-zinc-700 shadow'
        }`}
      >
        <ZoomIn className="h-3 w-3" />
        Agrandir
      </span>
    </button>
  );
}

export function ImageUploadPreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const url = URL.createObjectURL(file);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    <div className="relative inline-block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Aperçu" className="h-20 w-20 rounded-xl object-cover ring-2 ring-olive/20" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-white shadow hover:bg-zinc-700"
        aria-label="Retirer l'image"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
