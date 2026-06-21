'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Gift,
  Heart,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquare,
  Package,
  User,
  X,
} from 'lucide-react';
import { CompteAvatar } from './CompteAvatar';
import {
  COMPTE_NAV_GROUPS,
  COMPTE_SIDEBAR_WIDTH,
  VIP_POINTS_THRESHOLD,
  type CompteNavItem,
  type CompteSectionId,
} from './compte-ui';
import type { CustomerProfile } from '@/modules/compte/types';

const ICONS: Record<CompteSectionId, typeof User> = {
  dashboard: LayoutDashboard,
  commandes: Package,
  favoris: Heart,
  adresses: MapPin,
  profil: User,
  fidelite: Gift,
  avis: MessageSquare,
};

const LINK_ICONS: Record<string, typeof User> = {
  '/compte/messages': MessageSquare,
  '/contact': HelpCircle,
};

const NAV_BTN =
  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs leading-none transition';

const NAV_BTN_ACTIVE = 'bg-white/15 text-white font-semibold';
const NAV_BTN_IDLE = 'text-white/75 hover:bg-white/10 hover:text-white';

function isNavLinkActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolveNavLabel(pathname: string, section: CompteSectionId): string {
  const items = COMPTE_NAV_GROUPS.flatMap((g) => g.items);

  const linkItem = items.find(
    (item) => item.kind === 'link' && isNavLinkActive(pathname, item.href),
  );
  if (linkItem?.kind === 'link') return linkItem.label;

  const sectionItem = items.find((item) => item.kind === 'section' && item.id === section);
  return sectionItem?.kind === 'section' ? sectionItem.label : 'Mon compte';
}

type Props = {
  profil: CustomerProfile;
  section: CompteSectionId;
  onSectionChange: (id: CompteSectionId) => void;
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

function SidebarContent({
  profil,
  section,
  onSectionChange,
  onLogout,
  onMobileClose,
}: Omit<Props, 'mobileOpen'>) {
  const pathname = usePathname();
  const isVip = profil.pointsFidelite >= VIP_POINTS_THRESHOLD;
  const onCompteHome = pathname === '/compte';

  const renderItem = (item: CompteNavItem) => {
    const badge =
      item.kind === 'section' && item.id === 'fidelite'
        ? `${profil.pointsFidelite} pts`
        : item.badge;

    if (item.kind === 'link') {
      const Icon = LINK_ICONS[item.href] ?? HelpCircle;
      const active = isNavLinkActive(pathname, item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onMobileClose}
          className={`${NAV_BTN} ${active ? NAV_BTN_ACTIVE : NAV_BTN_IDLE}`}
        >
          <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" />
          <span className="flex-1">{item.label}</span>
          {badge && (
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-bold">{badge}</span>
          )}
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
        className={`${NAV_BTN} ${active ? NAV_BTN_ACTIVE : NAV_BTN_IDLE}`}
      >
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" />
        <span className="flex-1 text-left">{item.label}</span>
        {badge && (
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-bold shrink-0">{badge}</span>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 px-3 pt-3 pb-2 border-b border-white/10">
        <Link href="/" className="font-serif text-base font-bold text-white tracking-tight">
          KabiShop<span className="text-white/70">.</span>
        </Link>
      </div>

      <div className="shrink-0 px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <CompteAvatar profil={profil} size="xs" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="text-xs font-semibold text-white truncate">{profil.nom}</p>
              {isVip && (
                <span className="shrink-0 rounded bg-white/20 px-1 py-px text-[7px] font-bold uppercase text-white">
                  VIP
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-1.5 py-2 overflow-hidden">
        <div className="space-y-2">
          {COMPTE_NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="px-2 mb-0.5 text-[8px] font-bold uppercase tracking-wider text-white/35">
                {group.title}
              </p>
              <div className="space-y-px">{group.items.map(renderItem)}</div>
            </div>
          ))}
        </div>
      </nav>

      <div className="shrink-0 border-t border-white/10 px-2 py-2">
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

export function CompteSidebar({
  profil,
  section,
  onSectionChange,
  onLogout,
  mobileOpen,
  onMobileClose,
}: Props) {
  return (
    <>
      <aside
        className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex ${COMPTE_SIDEBAR_WIDTH} shrink-0 flex-col bg-olive h-screen overflow-hidden`}
      >
        <SidebarContent
          profil={profil}
          section={section}
          onSectionChange={onSectionChange}
          onLogout={onLogout}
        />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-[220px] max-w-[85vw] flex-col bg-olive shadow-2xl animate-slideInLeft h-full overflow-hidden">
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

  return (
    <div className="lg:hidden shrink-0 border-b border-beige-border bg-white px-3 py-2 flex items-center gap-2">
      <button
        type="button"
        onClick={onMenuOpen}
        className="shrink-0 rounded-lg border border-beige-border px-3 py-2 text-xs font-semibold text-olive"
      >
        Menu
      </button>
      <p className="text-sm font-semibold text-zinc-800 truncate flex-1">
        {resolveNavLabel(pathname, section)}
      </p>
    </div>
  );
}
