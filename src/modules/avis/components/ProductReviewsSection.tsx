'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { BadgeCheck, Loader2, MessageSquare } from 'lucide-react';
import { StarRating } from './StarRating';
import { ReviewForm } from './ReviewForm';
import type { AvisEligible, AvisProduitPublic, AvisProduitStats } from '../types';

type Props = {
  productId: string;
  productSlug: string;
  productNom: string;
  initialStats?: AvisProduitStats;
  initialAvis?: AvisProduitPublic[];
  initialTotalPages?: number;
  initialEligibles?: AvisEligible[];
};

export function ProductReviewsSection({
  productId,
  productSlug,
  productNom,
  initialStats,
  initialAvis,
  initialTotalPages = 1,
  initialEligibles,
}: Props) {
  const hasInitialPage = initialStats != null && initialAvis != null;

  const [stats, setStats] = useState<AvisProduitStats | null>(initialStats ?? null);
  const [avis, setAvis] = useState<AvisProduitPublic[]>(initialAvis ?? []);
  const [eligibles, setEligibles] = useState<
    { orderId: string; productId: string; productNom: string }[]
  >(initialEligibles ?? []);
  const [loading, setLoading] = useState(!hasInitialPage);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);

  const load = useCallback(
    async (opts?: { force?: boolean }) => {
      const skipAvis = page === 1 && hasInitialPage && !opts?.force;

      if (!skipAvis) setLoading(true);
      try {
        const tasks: Promise<void>[] = [];

        if (!skipAvis) {
          tasks.push(
            fetch(`/api/produits/${productSlug}/avis?page=${page}`)
              .then(async (avisRes) => {
                if (!avisRes.ok) return;
                const data = await avisRes.json();
                setStats(data.stats);
                setAvis(data.avis ?? []);
                setTotalPages(data.pagination?.totalPages ?? 1);
              }),
          );
        }

        if (initialEligibles == null) {
          tasks.push(
            fetch('/api/compte/avis/eligibles')
              .then(async (eligRes) => {
                if (!eligRes.ok) return;
                const data = await eligRes.json();
                setEligibles(
                  (data.eligibles ?? []).filter(
                    (e: { productId: string }) => e.productId === productId,
                  ),
                );
              }),
          );
        }

        await Promise.all(tasks);
      } finally {
        if (!skipAvis) setLoading(false);
      }
    },
    [productSlug, productId, page, hasInitialPage, initialEligibles],
  );

  useEffect(() => {
    if (page === 1 && hasInitialPage) return;
    load();
  }, [load, page, hasInitialPage]);

  const eligible = eligibles[0];

  return (
    <section className="rounded-2xl border border-beige-border/80 bg-white/80 p-6 md:p-8 space-y-8 backdrop-blur-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="product-section-eyebrow">Communauté</p>
          <h2 className="product-section-title flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-olive" />
            Avis clients
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Notes et commentaires vérifiés — achat confirmé après livraison.
          </p>
        </div>
        {stats && stats.total > 0 && (
          <div className="text-right">
            <StarRating value={stats.moyenne} size="lg" showValue />
            <p className="text-xs text-zinc-500 mt-1">
              {stats.total} avis vérifié{stats.total > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {stats && stats.total > 0 && (
        <div className="grid grid-cols-5 gap-2 max-w-md">
          {([5, 4, 3, 2, 1] as const).map((n) => {
            const count = stats.distribution[n];
            const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
            return (
              <div key={n} className="col-span-5 flex items-center gap-2 text-xs">
                <span className="w-3 text-zinc-500">{n}</span>
                <div className="flex-1 h-2 rounded-full bg-cream overflow-hidden">
                  <div
                    className="h-full bg-amber-400/90 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-zinc-400 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {eligible && (
        <ReviewForm
          productId={eligible.productId}
          orderId={eligible.orderId}
          productNom={productNom}
          onSuccess={() => load({ force: true })}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : avis.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-6">
          Aucun avis pour ce produit. Soyez le premier à partager votre expérience après livraison !
        </p>
      ) : (
        <ul className="divide-y divide-beige-border/80 space-y-0">
          {avis.map((a) => (
            <li key={a.id} className="py-6 first:pt-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-zinc-900">{a.nom}</p>
                  <p className="text-xs text-zinc-400">
                    {a.ville}
                    {' · '}
                    {new Intl.DateTimeFormat('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }).format(new Date(a.date))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating value={a.note} size="sm" />
                  {a.achatVerifie && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <BadgeCheck className="h-3 w-3" />
                      Achat vérifié
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed">{a.commentaire}</p>
              {a.photos.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {a.photos.map((url) => (
                    <div
                      key={url}
                      className="relative h-20 w-20 rounded-lg overflow-hidden border border-[#ebe4d8]"
                    >
                      <Image
                        src={url}
                        alt="Photo client"
                        fill
                        sizes="80px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="text-sm font-semibold text-olive disabled:opacity-40"
          >
            ← Précédent
          </button>
          <span className="text-xs text-zinc-400">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="text-sm font-semibold text-olive disabled:opacity-40"
          >
            Suivant →
          </button>
        </div>
      )}
    </section>
  );
}
