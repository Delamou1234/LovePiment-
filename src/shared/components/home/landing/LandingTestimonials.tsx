'use client';

import { useMemo, useState } from 'react';
import { BadgeCheck, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import type { AvisClientPublic } from '@/modules/commandes/types/avis';
import { StarRating } from '@/modules/avis/components/StarRating';
import { CustomerAvatar } from '@/shared/components/CustomerAvatar';

const VISIBLE_DESKTOP = 3;

function avatarFromAvis(avis: AvisClientPublic) {
  return avis.avatarUrl ?? avis.photos?.[0] ?? null;
}

export function LandingTestimonials({ avis }: { avis: AvisClientPublic[] }) {
  const items = useMemo(() => avis, [avis]);
  const [index, setIndex] = useState(0);

  if (items.length === 0) {
    return (
      <section className="lp-testimonials py-14 md:py-16">
        <div className="container-shop">
          <h2 className="text-center font-serif text-2xl font-bold text-zinc-900 md:text-3xl">
            Elles nous font{' '}
            <span className="text-olive underline decoration-olive/30 decoration-2 underline-offset-4">
              confiance
            </span>
          </h2>
          <p className="mx-auto mt-8 max-w-md text-center text-sm leading-relaxed text-zinc-600">
            Aucun avis publié pour le moment. Après votre livraison, notez vos produits depuis votre
            compte — seuls les achats vérifiés apparaissent ici.
          </p>
        </div>
      </section>
    );
  }

  const canSlide = items.length > VISIBLE_DESKTOP;
  const visible =
    items.length <= VISIBLE_DESKTOP
      ? items
      : (() => {
          const slice = items.slice(index, index + VISIBLE_DESKTOP);
          if (slice.length === VISIBLE_DESKTOP) return slice;
          return [...slice, ...items].slice(0, VISIBLE_DESKTOP);
        })();

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const next = () => setIndex((i) => (i + 1) % items.length);

  const gridCols =
    items.length === 1
      ? 'md:grid-cols-1 md:max-w-sm md:mx-auto'
      : items.length === 2
        ? 'md:grid-cols-2 md:max-w-2xl md:mx-auto'
        : 'md:grid-cols-3';

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
          {canSlide && (
            <button
              type="button"
              onClick={prev}
              className="absolute -left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-olive/30 bg-white text-olive shadow-sm md:flex"
              aria-label="Témoignage précédent"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <div className={`grid grid-cols-1 gap-5 ${gridCols}`}>
            {visible.map((t) => (
              <article
                key={t.id}
                className="rounded-xl border border-pink-100 bg-white p-6 shadow-sm"
              >
                <CustomerAvatar
                  name={t.nom}
                  avatarUrl={avatarFromAvis(t)}
                  avatarCouleur={t.avatarCouleur ?? undefined}
                  size="md"
                  fallbackInitials
                  ringClassName="ring-olive/20"
                  className="mx-auto mb-4"
                />
                <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
                  <StarRating value={t.note ?? 5} size="sm" />
                  {t.achatVerifie !== false && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <BadgeCheck className="h-3 w-3" />
                      Achat vérifié
                    </span>
                  )}
                </div>
                <p className="text-center text-sm italic leading-relaxed text-zinc-600">
                  &ldquo;{t.commentaire}&rdquo;
                </p>
                <p className="mt-4 flex items-center justify-center gap-1 text-center text-sm font-semibold text-zinc-900">
                  {t.nom}
                  {t.ville ? (
                    <span className="font-normal text-zinc-500">· {t.ville}</span>
                  ) : null}
                  <Heart className="h-3.5 w-3.5 fill-olive text-olive" aria-hidden />
                </p>
              </article>
            ))}
          </div>

          {canSlide && (
            <button
              type="button"
              onClick={next}
              className="absolute -right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-olive/30 bg-white text-olive shadow-sm md:flex"
              aria-label="Témoignage suivant"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
