'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Loader2, MessageSquare, Star } from 'lucide-react';
import { ReviewForm } from './ReviewForm';
import type { AvisEligible } from '../types';
import {
  COMPTE_CARD,
  COMPTE_CARD_PAD,
  COMPTE_SECTION_DESC,
  COMPTE_SECTION_TITLE,
} from '@/modules/compte/components/compte-ui';

export function CompteAvisSection() {
  const [eligibles, setEligibles] = useState<AvisEligible[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AvisEligible | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/compte/avis/eligibles');
      if (res.ok) {
        const data = await res.json();
        setEligibles(data.eligibles ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-olive" />
      </div>
    );
  }

  if (selected) {
    return (
      <div className={`${COMPTE_CARD} ${COMPTE_CARD_PAD} space-y-6`}>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-olive hover:text-olive-dark transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux avis
        </button>
        <ReviewForm
          productId={selected.productId}
          orderId={selected.orderId}
          productNom={selected.productNom}
          onSuccess={() => {
            setSelected(null);
            load();
          }}
        />
      </div>
    );
  }

  return (
    <section className={`${COMPTE_CARD} ${COMPTE_CARD_PAD}`}>
      <div className="mb-6 flex items-start gap-3 lg:hidden">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-olive-light text-olive">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h2 className={COMPTE_SECTION_TITLE}>Mes avis</h2>
          <p className={COMPTE_SECTION_DESC}>
            Partagez votre expérience après livraison
          </p>
        </div>
      </div>

      {eligibles.length === 0 ? (
        <div className="py-12 text-center">
          <Star className="mx-auto h-8 w-8 text-zinc-300 mb-3" />
          <p className="font-serif text-lg font-bold text-zinc-900">Rien à noter pour l&apos;instant</p>
          <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
            Après réception de votre commande, vos produits éligibles apparaîtront ici pour que
            vous puissiez laisser un avis vérifié.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {eligibles.map((e) => (
            <li
              key={`${e.orderId}-${e.productId}`}
              className="flex items-center gap-4 rounded-xl border border-beige-border bg-cream/30 p-4 transition hover:bg-cream hover:shadow-sm"
            >
              {e.productImage && (
                <div className="relative h-16 w-16 rounded-xl overflow-hidden ring-1 ring-beige-border shrink-0">
                  <Image src={e.productImage} alt="" fill className="object-cover" unoptimized />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-900 truncate">{e.productNom}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Livré le{' '}
                  {new Intl.DateTimeFormat('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                  }).format(new Date(e.commandeDate))}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(e)}
                className="shrink-0 rounded-full bg-olive px-4 py-2 text-sm font-semibold text-white hover:bg-olive-dark transition"
              >
                Noter
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-zinc-400 mt-6 pt-6 border-t border-beige-border/60">
        Vous pouvez aussi laisser un avis sur la{' '}
        <Link href="/produits" className="font-medium text-olive hover:text-olive-dark">
          fiche produit
        </Link>
        .
      </p>
    </section>
  );
}
