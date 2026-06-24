'use client';

import Link from 'next/link';
import { BrandLogo } from '@/shared/ui/BrandLogo';
import { usePathname } from 'next/navigation';
import { HelpCircle, History, Home, LogOut, Truck, X } from 'lucide-react';
import { initialesNom } from '@/modules/compte/types';
import {
  COMPTE_SIDEBAR_WIDTH,
  COURIER_NAV_GROUPS,
  type CourierNavItem,
  type CourierProfil,
} from './livreur-ui';
import type { CourierTotauxDto } from '@/modules/livraison/services/courier-order.service';
import { CourierTotalsBanner, TOTAUX_LIVREUR_VIDES } from './CourierTotalsBanner';

const NAV_BTN =
  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs leading-none transition';

const NAV_BTN_ACTIVE = 'bg-white/15 text-white font-semibold';
const NAV_BTN_IDLE = 'text-white/75 hover:bg-white/10 hover:text-white';

const LINK_ICONS: Record<string, typeof Home> = {
  '/': Home,
  '/contact': HelpCircle,
};

const SECTION_ICONS = {
  livraisons: Truck,
  historique: History,
} as const;

type Props = {
  profil: CourierProfil;
  arretsCount?: number;
  totaux?: CourierTotauxDto;
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

function SidebarContent({
  profil,
  arretsCount = 0,
  totaux = TOTAUX_LIVREUR_VIDES,
  onLogout,
  onMobileClose,
}: Omit<Props, 'mobileOpen'>) {
  const pathname = usePathname();

  const renderItem = (item: CourierNavItem) => {
    const badge =
      item.kind === 'section' && item.id === 'livraisons' && arretsCount > 0
        ? String(arretsCount)
        : item.kind === 'section'
          ? item.badge
          : undefined;

    if (item.kind === 'link') {
      const Icon = LINK_ICONS[item.href] ?? HelpCircle;
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onMobileClose}
          className={`${NAV_BTN} ${NAV_BTN_IDLE}`}
        >
          <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" />
          <span className="flex-1">{item.label}</span>
        </Link>
      );
    }

    const Icon = SECTION_ICONS[item.id];
    const active =
      item.href === '/livreur'
        ? pathname === '/livreur'
        : pathname.startsWith(item.href);

    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={onMobileClose}
        className={`${NAV_BTN} ${active ? NAV_BTN_ACTIVE : NAV_BTN_IDLE}`}
      >
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" />
        <span className="flex-1 text-left">{item.label}</span>
        {badge && (
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-bold shrink-0">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 px-3 pt-3 pb-2 border-b border-white/10">
        <BrandLogo href="/" size="sm" />
      </div>

      <div className="shrink-0 px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white ring-2 ring-white/20"
            aria-hidden
          >
            {initialesNom(profil.nom)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{profil.nom}</p>
            <p className="text-[10px] text-white/55 truncate">Livreur · {profil.commune ?? 'Conakry'}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-1.5 py-2 overflow-hidden">
        <div className="space-y-2">
          {COURIER_NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="px-2 mb-0.5 text-[8px] font-bold uppercase tracking-wider text-white/35">
                {group.title}
              </p>
              <div className="space-y-px">{group.items.map(renderItem)}</div>
            </div>
          ))}
        </div>
      </nav>

      <div className="shrink-0 border-t border-white/10 px-2 py-2 space-y-2">
        <CourierTotalsBanner totaux={totaux} variant="sidebar" />
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium text-white/55 hover:bg-white/10 hover:text-white transition"
        >
          <LogOut className="h-3.5 w-3.5" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

export function CourierSidebar({
  profil,
  arretsCount,
  totaux,
  onLogout,
  mobileOpen,
  onMobileClose,
}: Props) {
  return (
    <>
      <aside
        className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex ${COMPTE_SIDEBAR_WIDTH} shrink-0 flex-col bg-primary h-dvh overflow-hidden`}
      >
        <SidebarContent
          profil={profil}
          arretsCount={arretsCount}
          totaux={totaux}
          onLogout={onLogout}
        />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-[220px] max-w-[85vw] flex-col bg-primary shadow-2xl animate-slideInLeft h-full overflow-hidden">
            <button
              type="button"
              onClick={onMobileClose}
              className="absolute top-3 right-3 z-10 rounded-lg p-2 text-white/70 hover:bg-white/10"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              profil={profil}
              arretsCount={arretsCount}
              totaux={totaux}
              onLogout={onLogout}
              onMobileClose={onMobileClose}
            />
          </aside>
        </div>
      )}
    </>
  );
}

export function CourierMobileNav({
  title = 'Mes livraisons',
  arretsCount = 0,
  totaux,
  onMenuOpen,
}: {
  title?: string;
  arretsCount?: number;
  totaux?: CourierTotauxDto;
  onMenuOpen: () => void;
}) {
  return (
    <div className="lg:hidden shrink-0 border-b border-beige-border bg-white px-3 py-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMenuOpen}
          className="shrink-0 rounded-lg border border-beige-border px-3 py-2 text-xs font-semibold text-olive"
        >
          Menu
        </button>
        <p className="text-sm font-semibold text-zinc-800 truncate flex-1">
          {title}
          {arretsCount > 0 ? ` (${arretsCount})` : ''}
        </p>
      </div>
      {totaux && (
        <p className="text-xs font-bold text-emerald-800 pl-1">
          Total livré : {totaux.montantTermineGn.toLocaleString('fr-FR')} GN
          <span className="font-medium text-emerald-700/80">
            {' '}
            · {totaux.livraisonsTerminees} livraison{totaux.livraisonsTerminees > 1 ? 's' : ''}
          </span>
        </p>
      )}
    </div>
  );
}
