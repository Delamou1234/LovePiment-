import { Quote, BadgeCheck } from 'lucide-react';
import Image from 'next/image';
import { formaterDate } from '@/shared/lib/delivery-tracking';
import type { AvisClientPublic } from '@/modules/commandes/types/avis';
import { StarRating } from '@/modules/avis/components/StarRating';

interface HomeTestimonialsProps {
  avis: AvisClientPublic[];
}

export function HomeTestimonials({ avis }: HomeTestimonialsProps) {
  if (avis.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-beige-border bg-white/60 px-6 py-12 md:py-14 text-center max-w-lg mx-auto">
        <p className="text-sm text-zinc-600 leading-relaxed">
          Aucun avis publié pour le moment. Après votre livraison, notez vos produits depuis votre
          compte — seuls les achats vérifiés apparaissent ici.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
      {avis.map((review) => (
        <article
          key={review.id}
          className="group relative flex flex-col rounded-2xl border border-beige-border bg-white p-6 md:p-7 shadow-sm hover:shadow-md hover:border-olive/20 transition-all duration-300"
        >
          <Quote className="absolute top-5 right-5 h-7 w-7 text-olive/10" />
          <div className="flex items-center justify-between mb-3">
            <StarRating value={review.note ?? 5} size="sm" />
            {review.achatVerifie !== false && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <BadgeCheck className="h-3 w-3" />
                Vérifié
              </span>
            )}
          </div>
          {review.productNom && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-olive mb-2">
              {review.productNom}
            </p>
          )}
          <p className="text-sm text-zinc-600 leading-relaxed flex-1">
            &ldquo;{review.commentaire}&rdquo;
          </p>
          {review.photos && review.photos.length > 0 && (
            <div className="flex gap-2 mt-4">
              {review.photos.slice(0, 2).map((url) => (
                <div
                  key={url}
                  className="relative h-12 w-12 rounded-lg overflow-hidden border border-beige-border"
                >
                  <Image src={url} alt="" fill sizes="48px" className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 pt-4 border-t border-beige-border/80">
            <p className="text-sm font-semibold text-zinc-900">{review.nom}</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {review.ville} · {formaterDate(new Date(review.date))}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
