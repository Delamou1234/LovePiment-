'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Heart, Star } from 'lucide-react';
import type { AvisClientPublic } from '@/modules/commandes/types/avis';

const FALLBACK_TESTIMONIALS = [
  {
    id: '1',
    nom: 'Sophie, 28 ans',
    commentaire:
      'Livraison ultra discrète, emballage neutre. Les produits sont de très bonne qualité, je recommande !',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  },
  {
    id: '2',
    nom: 'Aminata, 32 ans',
    commentaire:
      'Service client au top, réponses rapides sur WhatsApp. Ma commande est arrivée en 24h à Conakry.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
  },
  {
    id: '3',
    nom: 'Fatou, 25 ans',
    commentaire:
      'Large choix de produits, prix corrects. Le site est discret et facile à utiliser. Très satisfaite !',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
  },
];

export function LandingTestimonials({ avis }: { avis: AvisClientPublic[] }) {
  const items =
    avis.length >= 3
      ? avis.slice(0, 6).map((a) => ({
          id: a.id,
          nom: a.nom,
          commentaire: a.commentaire,
          avatar: a.photos?.[0] ?? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
        }))
      : FALLBACK_TESTIMONIALS;

  const [index, setIndex] = useState(0);
  const visible = items.slice(index, index + 3).length === 3
    ? items.slice(index, index + 3)
    : [...items.slice(index), ...items].slice(0, 3);

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const next = () => setIndex((i) => (i + 1) % items.length);

  return (
    <section className="lp-testimonials py-14 md:py-16">
      <div className="container-shop">
        <h2 className="text-center font-serif text-2xl font-bold text-zinc-900 md:text-3xl">
          Elles nous font{' '}
          <span className="text-olive underline decoration-olive/30 decoration-2 underline-offset-4">
            confiance
          </span>
        </h2>

        <div className="relative mt-10 md:mt-12">
          <button
            type="button"
            onClick={prev}
            className="absolute -left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-olive/30 bg-white text-olive shadow-sm md:flex"
            aria-label="Précédent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {visible.map((t) => (
              <article
                key={t.id}
                className="rounded-xl border border-pink-100 bg-white p-6 shadow-sm"
              >
                <div className="mx-auto mb-4 h-16 w-16 overflow-hidden rounded-full ring-2 ring-olive/20">
                  <Image
                    src={t.avatar}
                    alt=""
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
                <div className="mb-3 flex justify-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-center text-sm italic leading-relaxed text-zinc-600">
                  &ldquo;{t.commentaire}&rdquo;
                </p>
                <p className="mt-4 flex items-center justify-center gap-1 text-center text-sm font-semibold text-zinc-900">
                  {t.nom}
                  <Heart className="h-3.5 w-3.5 fill-olive text-olive" />
                </p>
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={next}
            className="absolute -right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-olive/30 bg-white text-olive shadow-sm md:flex"
            aria-label="Suivant"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
