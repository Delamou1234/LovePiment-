'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Gift,
  Headphones,
  Heart,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Settings,
  Star,
  User,
  X,
} from 'lucide-react';
import {
  COMPTE_SIDEBAR_NAV,
  COMPTE_SIDEBAR_WIDTH,
  type CompteNavItem,
  type CompteSectionId,
} from './compte-ui';
import type { CustomerDashboardOffre, CustomerProfile } from '@/modules/compte/types';
import { BrandLogo } from '@/shared/ui/BrandLogo';

const ICONS: Record<CompteSectionId, typeof User> = {
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
  '/contact': HelpCircle,
};

type Props = {
  profil: CustomerProfile;
  section: CompteSectionId;
  offreBienvenue?: CustomerDashboardOffre | null;
  onSectionChange: (id: CompteSectionId) => void;
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

function SidebarContent({
  profil,
  section,
  offreBienvenue,
  onSectionChange,
  onLogout,
  onMobileClose,
}: Omit<Props, 'mobileOpen'>) {
  const pathname = usePathname();
  const onCompteHome = pathname === '/compte';

  const renderItem = (item: CompteNavItem) => {
    if (item.kind === 'link') {
      const Icon = LINK_ICONS[item.href] ?? HelpCircle;
      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onMobileClose}
          className={`compte-nav-link ${active ? 'is-active' : ''}`}
        >
          <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          <span className="flex-1">{item.label}</span>
        </Link>
      );
    }

    const Icon = ICONS[item.id];
    const active = onCompteHome && section === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onSectionChange(item.id);
          onMobileClose?.();
        }}
        className={`compte-nav-link ${active ? 'is-active' : ''}`}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        <span className="flex-1 text-left">{item.label}</span>
      </button>
    );
  };

  return (
    <div className="compte-sidebar-inner">
      <div className="compte-sidebar-brand">
        <BrandLogo href="/" size="sm" onClick={onMobileClose} className="compte-brand-logo" />
      </div>

      <nav className="compte-sidebar-nav" aria-label="Navigation compte">
        {COMPTE_SIDEBAR_NAV.map(renderItem)}
      </nav>

      {offreBienvenue && (
        <div className="compte-sidebar-promo">
          <p className="text-sm font-bold text-zinc-900">Offre de bienvenue</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">{offreBienvenue.titre}</p>
          <p className="mt-3 rounded-lg bg-[#e91e8c] px-3 py-2 text-center text-xs font-bold tracking-wide text-white">
            {offreBienvenue.code}
          </p>
        </div>
      )}

      <div className="compte-sidebar-help">
        <div className="flex items-center gap-2 text-zinc-800">
          <Headphones className="h-4 w-4 text-[#e91e8c]" />
          <span className="text-sm font-semibold">Besoin d&apos;aide ?</span>
        </div>
        <Link href="/compte/messages" className="compte-sidebar-help-btn" onClick={onMobileClose}>
          Nous contacter
        </Link>
      </div>

      <button type="button" onClick={onLogout} className="compte-sidebar-logout">
        <LogOut className="h-4 w-4" />
        Déconnexion
      </button>
    </div>
  );
}

export function CompteSidebar({
  profil,
  section,
  offreBienvenue,
  onSectionChange,
  onLogout,
  mobileOpen,
  onMobileClose,
}: Props) {
  return (
    <>
      <aside
        className={`compte-sidebar hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex ${COMPTE_SIDEBAR_WIDTH} shrink-0 flex-col h-dvh`}
      >
        <SidebarContent
          profil={profil}
          section={section}
          offreBienvenue={offreBienvenue}
          onSectionChange={onSectionChange}
          onLogout={onLogout}
        />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} aria-hidden />
          <aside className="compte-sidebar absolute inset-y-0 left-0 flex w-[280px] max-w-[88vw] flex-col shadow-2xl animate-slideInLeft h-full">
            <button
              type="button"
              onClick={onMobileClose}
              className="absolute top-3 right-3 z-10 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              profil={profil}
              section={section}
              offreBienvenue={offreBienvenue}
              onSectionChange={onSectionChange}
              onLogout={onLogout}
              onMobileClose={onMobileClose}
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
    <div className="lg:hidden shrink-0 border-b border-[#ead6de] bg-white px-4 py-3 flex items-center gap-3">
      <button
        type="button"
        onClick={onMenuOpen}
        className="shrink-0 rounded-full border border-[#ead6de] px-4 py-2 text-xs font-semibold text-[#e91e8c]"
      >
        Menu
      </button>
      <p className="text-sm font-semibold text-zinc-800 truncate flex-1">{label}</p>
    </div>
  );
}
