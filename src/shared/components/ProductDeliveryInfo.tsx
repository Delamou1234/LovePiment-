'use client';

import { Truck, Banknote, Clock, MapPin } from 'lucide-react';
import { useLivraisonConfig } from '@/shared/hooks/useLivraisonConfig';
import { formaterPrixGN, libelleLivraisonOfferte } from '@/shared/lib/shipping';
import Link from 'next/link';

export function ProductDeliveryInfo() {
  const cfg = useLivraisonConfig();

  return (
    <div className="rounded-2xl border border-beige-border bg-cream/40 p-4 space-y-3 text-sm">
      <p className="font-bold text-zinc-900 flex items-center gap-2">
        <Truck className="h-4 w-4 text-primary" />
        Livraison
      </p>
      <ul className="space-y-2 text-zinc-600">
        <li className="flex items-start gap-2">
          <Clock className="h-4 w-4 shrink-0 text-primary mt-0.5" />
          <span>
            Délai estimé : <strong>{cfg.delaiLabel ?? '24–48 h'}</strong> à {cfg.villeParDefaut}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
          <span>
            À partir de {formaterPrixGN(cfg.tarifConakry)} (communes Conakry) — tarif affiché au
            checkout selon votre commune
          </span>
        </li>
        {cfg.gratuiteActive && (
          <li className="flex items-start gap-2">
            <Banknote className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <span>{libelleLivraisonOfferte(cfg)}</span>
          </li>
        )}
      </ul>
      <Link href="/faq" className="text-xs font-semibold text-primary hover:underline">
        Voir la FAQ livraison →
      </Link>
    </div>
  );
}
