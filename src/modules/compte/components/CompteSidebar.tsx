'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Gift,
  Headphones,
  Heart,
  HelpCircle,
  History,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Settings,
  Star,
  Store,
  Truck,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  COMPTE_SIDEBAR_WIDTH,
  construireGroupesSidebarCompte,
  COMPTE_SIDEBAR_NAV,
  type CompteNavItem,
  type CompteSectionId,
} from './compte-ui';
import type { CompteLivreurContext, CustomerProfile } from '@/modules/compte/types';
import { BrandLogo } from '@/shared/ui/BrandLogo';
import { CompteAvatar } from './CompteAvatar';
import { VIP_POINTS_THRESHOLD } from './compte-ui';
import { fetchApi } from '@/shared/lib/client-fetch';

const ICONS: Record<CompteSectionId, LucideIcon> = {
  dashboard: LayoutDashboard,
  commandes: Package,
  favoris: Heart,
  adresses: MapPin,
  profil: Settings,
  fidelite: Gift,
  avis: Star,
};

const LINK_ICONS: Record<string, typeof HelpCircle> = {
  '/compte/messages': Headphones,
  '/compte/profil': Settings,
  '/contact': HelpCircle,
  '/livreur': Truck,
  '/livreur/historique': History,
};

type Props = {
  profil: CustomerProfile;
  section: CompteSectionId;
  livreur?: CompteLivreurContext | null;
  onSectionChange: (id: CompteSectionId) => void;
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  badges?: {
    favoris?: number;
    commandesEnCours?: number;
  };
};

function SidebarContent({
  profil,
  section,
  livreur: livreurProp,
  onSectionChange,
  onLogout,
  onMobileClose,
  badges,
}: Omit<Props, 'mobileOpen'>) {
  const pathname = usePathname();
  const onCompteHome = pathname === '/compte';
  const isVip = profil.pointsFidelite >= VIP_POINTS_THRESHOLD;
  const [livreurFetched, setLivreurFetched] = useState<CompteLivreurContext | null>(null);
  const [fetchingLivreur, setFetchingLivreur] = useState(livreurProp === undefined);

  useEffect(() => {
    if (livreurProp !== undefined) return;

    let cancelled = false;

    void fetchApi('/api/compte/livreur-context')
      .then(async (res) => {
        if (cancelled || !res.ok) return;
        const data = (await res.json()) as { livreur?: CompteLivreurContext | null };
        setLivreurFetched(data.livreur ?? null);
      })
      .finally(() => {
        if (!cancelled) setFetchingLivreur(false);
      });

    return () => {
      cancelled = true;
    };
  }, [livreurProp]);

  const livreur = livreurProp !== undefined ? livreurProp : livreurFetched;
  const livreurLoading = livreurProp === undefined && fetchingLivreur;
  const estLivreur = livreurLoading ? false : Boolean(livreur);
  const navGroups = construireGroupesSidebarCompte(estLivreur);

  useEffect(() => {
    if (!livreur) return;
    void fetchApi('/api/compte/livreur-context');
  }, [livreur]);

  const renderItem = (item: CompteNavItem) => {
    if (item.kind === 'link') {
      const Icon = LINK_ICONS[item.href] ?? HelpCircle;
      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
      const badge =
        item.href === '/livreur' && livreur && livreur.livraisonsEnCours > 0
          ? String(livreur.livraisonsEnCours > 99 ? '99+' : livreur.livraisonsEnCours)
          : undefined;

      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onMobileClose}
          className={`admin-sidebar-link ${active ? 'is-active' : ''}`}
        >
          <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          <span className="truncate flex-1">{item.label}</span>
          {badge && <span className="admin-sidebar-badge">{badge}</span>}
        </Link>
      );
    }

    const Icon = ICONS[item.id];
    const active = onCompteHome && section === item.id;
    const badge =
      item.id === 'favoris' && badges?.favoris
        ? String(badges.favoris > 99 ? '99+' : badges.favoris)
        : item.id === 'commandes' && badges?.commandesEnCours
          ? String(badges.commandesEnCours > 99 ? '99+' : badges.commandesEnCours)
          : undefined;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onSectionChange(item.id);
          onMobileClose?.();
        }}
        className={`admin-sidebar-link ${active ? 'is-active' : ''}`}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        <span className="truncate flex-1 text-left">{item.label}</span>
        {badge && <span className="admin-sidebar-badge">{badge}</span>}
      </button>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="admin-sidebar-brand">
        <BrandLogo
          href="/"
          size="lg"
          variant="light"
          onClick={onMobileClose}
          className="admin-sidebar-logo"
        />
        <p className="admin-sidebar-tag">
          {livreur ? 'Client & livreur' : 'Mon espace client'}
        </p>
      </div>

      <div className="compte-sidebar-user-dark">
        <CompteAvatar profil={profil} size="md" />
        <div className="min-w-0 flex-1">
          <p className="compte-sidebar-user-dark-name">{profil.nom}</p>
          <p className="compte-sidebar-user-dark-meta">
            {profil.pointsFidelite} pts fidélité
            {isVip && <span className="compte-sidebar-user-dark-vip">VIP</span>}
          </p>
        </div>
      </div>

      <nav className="admin-sidebar-nav" aria-label="Navigation compte">
        {navGroups.map((group) => (
            <div
              key={group.title ?? 'client'}
              className={group.title ? 'admin-sidebar-nav-group' : undefined}
            >
              {group.title && (
                <p className="admin-sidebar-nav-group-title">{group.title}</p>
              )}
              {group.items.map(renderItem)}
            </div>
          ))}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-footer-actions">
          <Link href="/produits" onClick={onMobileClose} className="admin-sidebar-footer-link">
            <Store className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span className="truncate">Voir la boutique</span>
          </Link>
          <button type="button" onClick={onLogout} className="admin-sidebar-footer-link">
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span className="truncate">Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function CompteSidebar({
  profil,
  section,
  livreur,
  onSectionChange,
  onLogout,
  mobileOpen,
  onMobileClose,
  badges,
}: Props) {
  return (
    <>
      <aside
        className={`admin-sidebar hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex ${COMPTE_SIDEBAR_WIDTH} shrink-0 flex-col h-dvh overflow-hidden`}
      >
        <SidebarContent
          profil={profil}
          section={section}
          livreur={livreur}
          onSectionChange={onSectionChange}
          onLogout={onLogout}
          badges={badges}
        />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} aria-hidden />
          <aside className="admin-sidebar absolute inset-y-0 left-0 flex w-[260px] max-w-[85vw] flex-col shadow-2xl animate-slideInLeft h-full overflow-hidden">
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
              section={section}
              livreur={livreur}
              onSectionChange={onSectionChange}
              onLogout={onLogout}
              onMobileClose={onMobileClose}
              badges={badges}
            />
          </aside>
        </div>
      )}
    </>
  );
}

export function CompteMobileNav({
  section,
  onMenuOpen,
}: {
  section: CompteSectionId;
  onMenuOpen: () => void;
}) {
  const pathname = usePathname();
  const item = COMPTE_SIDEBAR_NAV.find(
    (i) => i.kind === 'section' && i.id === section,
  );
  const linkItem = COMPTE_SIDEBAR_NAV.find(
    (i) => i.kind === 'link' && (pathname === i.href || pathname.startsWith(`${i.href}/`)),
  );
  const label =
    linkItem?.kind === 'link'
      ? linkItem.label
      : item?.kind === 'section'
        ? item.label
        : 'Mon compte';

  return (
    <div className="lg:hidden shrink-0 border-b border-zinc-200 bg-white px-3 py-2 flex items-center gap-2">
      <button
        type="button"
        onClick={onMenuOpen}
        className="shrink-0 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-[#e91e8c]"
      >
        Menu
      </button>
      <p className="text-sm font-semibold text-zinc-800 truncate flex-1">{label}</p>
    </div>
  );
}
