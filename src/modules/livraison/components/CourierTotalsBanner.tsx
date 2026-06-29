'use client';

import { Banknote, Coins, Package, Truck } from 'lucide-react';
import type { CourierTotauxDto } from '@/modules/livraison/services/courier-order.service';

type Props = {
  totaux: CourierTotauxDto;
  variant?: 'bar' | 'card' | 'sidebar';
};

export const TOTAUX_LIVREUR_VIDES: CourierTotauxDto = {
  livraisonsTerminees: 0,
  montantTermineGn: 0,
  especesEncaisseesGn: 0,
  livraisonsEnCours: 0,
  montantEnCoursGn: 0,
  especesAEncaisserGn: 0,
  primesTermineesGn: 0,
  primesEnCoursGn: 0,
};

export function CourierTotalsBanner({ totaux, variant = 'bar' }: Props) {
  const items = [
    {
      key: 'termine',
      icon: Package,
      label: 'Total livré',
      value: `${totaux.montantTermineGn.toLocaleString('fr-FR')} GN`,
      hint: `${totaux.livraisonsTerminees} livraison${totaux.livraisonsTerminees > 1 ? 's' : ''}`,
      className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      show: true,
    },
    {
      key: 'en-cours',
      icon: Truck,
      label: 'En cours',
      value: `${totaux.montantEnCoursGn.toLocaleString('fr-FR')} GN`,
      hint: `${totaux.livraisonsEnCours} arrêt${totaux.livraisonsEnCours > 1 ? 's' : ''}`,
      className: 'border-sky-200 bg-sky-50 text-sky-900',
      show: totaux.livraisonsEnCours > 0,
    },
    {
      key: 'especes-encaissees',
      icon: Banknote,
      label: 'Espèces encaissées',
      value: `${totaux.especesEncaisseesGn.toLocaleString('fr-FR')} GN`,
      hint: 'Livraisons terminées',
      className: 'border-olive/25 bg-olive/5 text-olive',
      show: totaux.especesEncaisseesGn > 0,
    },
    {
      key: 'especes-attente',
      icon: Banknote,
      label: 'Espèces à encaisser',
      value: `${totaux.especesAEncaisserGn.toLocaleString('fr-FR')} GN`,
      hint: 'Livraisons en cours',
      className: 'border-amber-200 bg-amber-50 text-amber-900',
      show: totaux.especesAEncaisserGn > 0,
    },
    {
      key: 'primes-terminees',
      icon: Coins,
      label: 'Primes gagnées',
      value: `${totaux.primesTermineesGn.toLocaleString('fr-FR')} GN`,
      hint: 'Livraisons terminées',
      className: 'border-violet-200 bg-violet-50 text-violet-900',
      show: totaux.primesTermineesGn > 0,
    },
    {
      key: 'primes-en-cours',
      icon: Coins,
      label: 'Primes en cours',
      value: `${totaux.primesEnCoursGn.toLocaleString('fr-FR')} GN`,
      hint: 'Livraisons à terminer',
      className: 'border-violet-200/80 bg-violet-50/80 text-violet-800',
      show: totaux.primesEnCoursGn > 0,
    },
  ].filter((item) => item.show);

  if (variant === 'sidebar') {
    return (
      <div className="rounded-lg border border-white/15 bg-white/10 p-3 space-y-2">
        <p className="text-[9px] font-bold uppercase tracking-wider text-white/45">Mes totaux</p>
        {items.map((item) => (
          <div key={item.key} className="text-white">
            <p className="text-[10px] text-white/60">{item.label}</p>
            <p className="text-sm font-bold">{item.value}</p>
            <p className="text-[10px] text-white/50">{item.hint}</p>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.key} className={`rounded-xl border p-4 ${item.className}`}>
            <div className="flex items-center gap-2 mb-2">
              <item.icon className="h-4 w-4 shrink-0 opacity-80" />
              <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">{item.label}</p>
            </div>
            <p className="text-xl font-bold">{item.value}</p>
            <p className="text-[11px] mt-1 opacity-75">{item.hint}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="shrink-0 border-b border-beige-border/80 bg-cream/90 px-4 py-2.5 md:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-2">
        {items.map((item) => (
          <div
            key={item.key}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${item.className}`}
          >
            <item.icon className="h-3.5 w-3.5 shrink-0" />
            <span>{item.label}</span>
            <span className="font-bold">{item.value}</span>
            <span className="hidden sm:inline opacity-75">· {item.hint}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
