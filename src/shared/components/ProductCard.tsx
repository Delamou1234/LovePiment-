'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star } from 'lucide-react';
import { useState } from 'react';

interface ProductCardProps {
  slug: string;
  nom: string;
  categorie: string;
  prix: number;
  image: string;
  featured?: boolean;
  rating?: number;
  reviews?: number;
}

export function ProductCard({
  slug,
  nom,
  categorie,
  prix,
  image,
  rating = 4.8,
  reviews = 12,
}: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const formattedPrice = prix.toLocaleString('fr-FR') + ' GN';

  return (
    <Link
      href={`/produits/${slug}`}
      className="group flex flex-col bg-transparent"
    >
      <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-[#f5f0e8] mb-3">
        <Image
          src={image}
          alt={nom}
          fill
          className="object-cover object-center group-hover:scale-[1.02] transition duration-500"
          sizes="(max-width: 640px) 50vw, 20vw"
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setWishlisted(!wishlisted);
          }}
          className="absolute top-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:scale-105"
          aria-label="Favoris"
        >
          <Heart
            className={`h-3.5 w-3.5 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-zinc-400'}`}
          />
        </button>
      </div>

      <div className="space-y-0.5 px-0.5">
        <h3 className="text-sm font-semibold text-zinc-900 leading-snug line-clamp-1 group-hover:underline underline-offset-2">
          {nom}
        </h3>
        <p className="text-[11px] text-zinc-400">{categorie}</p>
        <p className="text-sm font-bold text-zinc-900 pt-0.5">{formattedPrice}</p>
        <div className="flex items-center gap-0.5 pt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${
                i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'fill-zinc-200 text-zinc-200'
              }`}
            />
          ))}
          <span className="text-[10px] text-zinc-400 ml-1">({reviews})</span>
        </div>
      </div>
    </Link>
  );
}
