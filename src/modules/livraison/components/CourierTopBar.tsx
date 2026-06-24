'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Home, LogOut, Package, RefreshCw, Store, Truck } from 'lucide-react';
import { initialesNom } from '@/modules/compte/types';
import type { CourierProfil } from './livreur-ui';
import type { CourierTotauxDto } from '@/modules/livraison/services/courier-order.service';
import { TOTAUX_LIVREUR_VIDES } from './CourierTotalsBanner';

const QUICK_ACTION =
  'relative flex h-9 w-9 items-center justify-center rounded-xl border border-beige-border bg-white text-zinc-500 shadow-sm transition hover:border-olive/30 hover:text-olive hover:shadow-md';

type Props = {
  profil: CourierProfil;
  title?: string;
  subtitle?: string;
  tourneesCount: number;
  arretsCount: number;
  especesTotal: number;
  totaux?: CourierTotauxDto;
  onLogout: () => void;
  onRefresh: () => void;
  refreshing?: boolean;
};

export function CourierTopBar({
  profil,
  title = 'Mes livraisons',
  subtitle = 'Espace livreur',
  tourneesCount,
  arretsCount,
  especesTotal,
  totaux = TOTAUX_LIVREUR_VIDES,
  onLogout,
  onRefresh,
  refreshing,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="relative z-30 shrink-0 border-b border-beige-border/80 bg-white/80 px-4 py-2.5 backdrop-blur-md md:px-6 lg:px-8">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="hidden min-w-0 shrink-0 md:block md:max-w-[160px] lg:max-w-[200px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            {subtitle}
          </p>
          <h1 className="font-serif text-base font-bold text-zinc-900 truncate lg:text-lg">
            {title}
          </h1>
        </div>

        <div className="hidden h-8 w-px shrink-0 bg-beige-border/80 md:block" aria-hidden />

        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-900">
            <Package className="inline h-3 w-3 mr-1 -mt-px" />
            {totaux.montantTermineGn.toLocaleString('fr-FR')} GN livrés
          </span>
          <span className="rounded-full border border-beige-border bg-cream/80 px-2.5 py-1 font-semibold text-zinc-700">
            {tourneesCount} tournée{tourneesCount > 1 ? 's' : ''}
          </span>
          <span className="rounded-full border border-olive/25 bg-olive/5 px-2.5 py-1 font-semibold text-olive">
            {arretsCount} arrêt{arretsCount > 1 ? 's' : ''}
          </span>
          {(especesTotal > 0 || totaux.especesAEncaisserGn > 0) && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-900">
              {(especesTotal || totaux.especesAEncaisserGn).toLocaleString('fr-FR')} GN espèces
            </span>
          )}
        </div>

        <div className="flex-1 min-w-2" aria-hidden />

        <nav className="flex items-center gap-1 sm:gap-1.5" aria-label="Raccourcis">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className={QUICK_ACTION}
            title="Actualiser"
            aria-label="Actualiser les livraisons"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={1.75} />
          </button>

          <Link href="/" className={`${QUICK_ACTION} hidden lg:flex`} title="Accueil boutique">
            <Home className="h-4 w-4" strokeWidth={1.75} />
          </Link>

          <Link href="/produits" className={QUICK_ACTION} title="Boutique">
            <Store className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </nav>

        <div className="hidden h-8 w-px shrink-0 bg-beige-border/80 sm:block" aria-hidden />

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-olive/10 text-sm font-bold text-olive ring-2 transition focus-visible:outline-none focus-visible:ring-olive/40 ${
              menuOpen ? 'ring-olive/50' : 'ring-beige-border hover:ring-olive/30'
            }`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={`Menu livreur — ${profil.nom}`}
          >
            {initialesNom(profil.nom)}
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 overflow-hidden rounded-xl border border-beige-border bg-white py-1 shadow-[0_12px_40px_rgba(0,0,0,0.1)] animate-fadeIn"
            >
              <div className="border-b border-beige-border/80 px-4 py-3">
                <p className="truncate text-sm font-semibold text-zinc-900">{profil.nom}</p>
                <p className="truncate text-xs text-zinc-500">{profil.email}</p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-zinc-500">
                  <Truck className="h-3 w-3" />
                  {profil.typeEngin} · {profil.commune ?? '—'}
                </p>
                {profil.penalitesCumuleesGn > 0 && (
                  <p className="mt-2 text-xs font-semibold text-red-700">
                    Pénalités : {profil.penalitesCumuleesGn.toLocaleString('fr-FR')} GN
                  </p>
                )}
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-zinc-600 hover:bg-cream transition"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
