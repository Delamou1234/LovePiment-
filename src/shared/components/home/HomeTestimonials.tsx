import { Star, Quote, BadgeCheck } from 'lucide-react';
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
      <div className="rounded-2xl border border-dashed border-[#ebe4d8] bg-white/60 px-6 py-12 md:py-14 text-center">
        <p className="text-sm text-zinc-600 leading-relaxed max-w-md mx-auto">
          Aucun avis publié pour le moment. Après votre livraison, notez vos produits depuis votre
          compte ou la fiche produit — seuls les achats vérifiés apparaissent ici.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
      {avis.map((review) => (
        <article
          key={review.id}
          className="relative rounded-2xl border border-[#ebe4d8] bg-white p-7 md:p-8 shadow-sm hover:shadow-md transition-shadow"
        >
          <Quote className="absolute top-6 right-6 h-8 w-8 text-[#4a5240]/10" />
          <div className="flex items-center justify-between mb-4">
            <StarRating value={review.note ?? 5} size="sm" />
            {review.achatVerifie !== false && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700">
                <BadgeCheck className="h-3 w-3" />
                Vérifié
              </span>
            )}
          </div>
          {review.productNom && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#4a5240] mb-2">
              {review.productNom}
            </p>
          )}
          <p className="text-sm text-zinc-600 leading-relaxed pr-4">
            &ldquo;{review.commentaire}&rdquo;
          </p>
          {review.photos && review.photos.length > 0 && (
            <div className="flex gap-2 mt-3">
              {review.photos.slice(0, 2).map((url) => (
                <div key={url} className="relative h-12 w-12 rounded-lg overflow-hidden border border-[#ebe4d8]">
                  <Image src={url} alt="" fill className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 pt-5 border-t border-[#ebe4d8]/80">
            <p className="text-sm font-semibold text-zinc-900">{review.nom}</p>
            <p className="text-xs text-zinc-400 mt-1">
              {review.ville} · {formaterDate(new Date(review.date))}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
