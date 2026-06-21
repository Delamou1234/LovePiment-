'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, MessageSquare } from 'lucide-react';
import { ReviewForm } from './ReviewForm';
import type { AvisEligible } from '../types';

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
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (selected) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="text-sm text-[#4a5240] hover:underline"
        >
          ← Retour
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
    <section className="rounded-2xl border border-[#ebe4d8] bg-white p-6 md:p-8 shadow-sm">
      <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2 mb-2">
        <MessageSquare className="h-5 w-5 text-[#4a5240]" />
        Mes avis
      </h2>
      <p className="text-sm text-zinc-500 mb-6">
        Notez les produits reçus — seuls les achats livrés peuvent être évalués.
      </p>

      {eligibles.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Aucun produit en attente d&apos;avis. Passez commande et attendez la livraison pour
          partager votre expérience.
        </p>
      ) : (
        <ul className="divide-y divide-[#ebe4d8]">
          {eligibles.map((e) => (
            <li key={`${e.orderId}-${e.productId}`} className="py-4 flex items-center gap-4">
              {e.productImage && (
                <div className="relative h-14 w-14 rounded-lg overflow-hidden border border-[#ebe4d8] shrink-0">
                  <Image src={e.productImage} alt="" fill className="object-cover" unoptimized />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-900 truncate">{e.productNom}</p>
                <p className="text-xs text-zinc-500">
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
                className="text-sm font-semibold text-[#4a5240] hover:underline shrink-0"
              >
                Noter
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-zinc-400 mt-6">
        Vous pouvez aussi laisser un avis directement sur la{' '}
        <Link href="/produits" className="text-[#4a5240] hover:underline">
          fiche produit
        </Link>
        .
      </p>
    </section>
  );
}
