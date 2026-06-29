'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Gift,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Package,
  Percent,
  ShoppingBag,
  Star,
  User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usePanier, selectDistinctProductCount } from '@/store/panier';
import { ProductSearchBar } from '@/shared/components/ProductSearchBar';
import { CompteAvatar } from './CompteAvatar';
import { AVATAR_UPDATED_EVENT } from '@/modules/compte/lib/avatar-events';
import { AccountTypeBadge } from '@/shared/components/AccountTypeBadge';
import { useAuthSession } from '@/shared/providers/AuthSessionProvider';
import {
  COMPTE_SIDEBAR_NAV,
  VIP_POINTS_THRESHOLD,
  type CompteSectionId,
} from './compte-ui';
import type { CustomerProfile } from '@/modules/compte/types';

type Props = {
  profil: CustomerProfile;
  activeSection?: CompteSectionId;
  onProfilUpdate?: (profil: CustomerProfile) => void;
  onLogout?: () => void;
  onGoToSection?: (id: CompteSectionId) => void;
  onMenuOpen?: () => void;
  minimal?: boolean;
  badges?: {
    favoris?: number;
    commandesEnCours?: number;
  };
};

const SECTION_ICONS: Record<CompteSectionId, LucideIcon> = {
  dashboard: LayoutDashboard,
  commandes: Package,
  favoris: Heart,
  adresses: MapPin,
  profil: User,
  avis: Star,
  fidelite: Gift,
};

function isNavLinkActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolvePageTitle(pathname: string, section: CompteSectionId): string {
  const linkItem = COMPTE_SIDEBAR_NAV.find(
    (item) => item.kind === 'link' && isNavLinkActive(pathname, item.href),
  );
  if (linkItem?.kind === 'link') return linkItem.label;

  const sectionItem = COMPTE_SIDEBAR_NAV.find(
    (item) => item.kind === 'section' && item.id === section,
  );
  return sectionItem?.kind === 'section' ? sectionItem.label : 'Mon compte';
}

export function CompteTopBar({
  profil,
  activeSection = 'dashboard',
  onProfilUpdate,
  onLogout,
  onGoToSection,
  onMenuOpen,
  minimal = false,
  badges,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const panier = usePanier();
  const cartProductCount = usePanier(selectDistinctProductCount);
  const { user: authUser } = useAuthSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const onProfilUpdateRef = useRef(onProfilUpdate);
  const profilRef = useRef(profil);

  useEffect(() => {
    onProfilUpdateRef.current = onProfilUpdate;
  }, [onProfilUpdate]);

  useEffect(() => {
    profilRef.current = profil;
  }, [profil]);

  const pageTitle = resolvePageTitle(pathname, activeSection);
  const isDashboardHome = pathname === '/compte' && activeSection === 'dashboard';
  const isPromosActive = isNavLinkActive(pathname, '/promos');
  const isVip = profil.pointsFidelite >= VIP_POINTS_THRESHOLD;
  const showPageTitle = !minimal && !isDashboardHome;

  useEffect(() => {
    const onAvatarUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ avatarUrl: string | null }>).detail;
      onProfilUpdateRef.current?.({
        ...profilRef.current,
        avatarUrl: detail.avatarUrl,
      });
    };

    window.addEventListener(AVATAR_UPDATED_EVENT, onAvatarUpdated);
    return () => window.removeEventListener(AVATAR_UPDATED_EVENT, onAvatarUpdated);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const goToSection = (id: CompteSectionId) => {
    closeMenu();
    if (pathname !== '/compte') {
      router.push(id === 'dashboard' ? '/compte' : `/compte?section=${id}`);
      return;
    }
    onGoToSection?.(id);
  };

  const handleLogout = () => {
    closeMenu();
    onLogout?.();
  };

  return (
    <header className="relative z-30 shrink-0 border-b border-zinc-200/80 bg-white px-4 py-2.5 md:px-6 lg:px-8">
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        {onMenuOpen && (
          <button
            type="button"
            onClick={onMenuOpen}
            className="admin-topbar-menu lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
        )}

        {showPageTitle && (
          <>
            <p className="admin-topbar-mobile-title lg:hidden">{pageTitle}</p>
            <div className="hidden min-w-0 shrink-0 md:block md:max-w-[160px] lg:max-w-[200px]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Mon espace
              </p>
              <h1 className="font-serif text-base font-bold text-zinc-900 truncate lg:text-lg">
                {pageTitle}
              </h1>
            </div>
            <div className="admin-topbar-divider hidden md:block" aria-hidden />
          </>
        )}

        {!minimal && (
          <ProductSearchBar
            compact
            hideImageSearch
            placeholder="Rechercher un produit…"
            className="compte-topbar-search-wrap min-w-0 flex-1 sm:flex-none sm:w-[180px] md:w-[220px] lg:w-[280px]"
            inputClassName="compte-topbar-search-input"
          />
        )}

        <div className="hidden min-w-2 flex-1 lg:block" aria-hidden />

        <nav className="flex shrink-0 items-center gap-1 sm:gap-1.5" aria-label="Actions">
          <button
            type="button"
            onClick={() => panier.ouvrirPanier()}
            className="admin-topbar-quick"
            title="Panier"
            aria-label={`Panier${cartProductCount > 0 ? ` (${cartProductCount})` : ''}`}
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
            {cartProductCount > 0 && (
              <span className="admin-topbar-badge">{cartProductCount > 99 ? '99+' : cartProductCount}</span>
            )}
          </button>
        </nav>

        <div className="admin-topbar-divider" aria-hidden />

        {authUser && (
          <AccountTypeBadge
            label={authUser.accountTypeLabel}
            type={authUser.accountType}
            className="compte-topbar-account-type hidden sm:inline-flex"
          />
        )}

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={`rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e91e8c]/30 ${
              menuOpen ? 'ring-2 ring-[#e91e8c]/40' : 'hover:ring-2 hover:ring-zinc-300'
            }`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={`Menu compte — ${profil.nom}`}
          >
            <CompteAvatar profil={profil} size="sm" />
          </button>

          {menuOpen && (
            <div role="menu" className="compte-user-menu animate-fadeIn">
              <div className="compte-user-menu-head">
                <p className="compte-user-menu-name">{profil.nom}</p>
                <p className="compte-user-menu-email">{profil.email}</p>
                {authUser && (
                  <div className="mt-1.5">
                    <AccountTypeBadge
                      label={authUser.accountTypeLabel}
                      type={authUser.accountType}
                    />
                  </div>
                )}
                <div className="compte-user-menu-badges">
                  <span className="compte-user-menu-points">
                    <Gift className="h-3 w-3" />
                    {profil.pointsFidelite} pts
                  </span>
                  {isVip && <span className="compte-user-menu-vip">Client VIP</span>}
                  {profil.stats.commandes > 0 && (
                    <span className="compte-user-menu-points">
                      <Package className="h-3 w-3" />
                      {profil.stats.commandes} cmd
                    </span>
                  )}
                </div>
              </div>

              <div className="compte-user-menu-nav">
                {COMPTE_SIDEBAR_NAV.map((item) => {
                  if (item.kind === 'link') {
                    const Icon =
                      item.href === '/compte/messages' ? MessageSquare : User;
                    const active = isNavLinkActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        onClick={closeMenu}
                        className={`compte-user-menu-item${active ? ' is-active' : ''}`}
                      >
                        <Icon className="compte-user-menu-icon" strokeWidth={1.75} />
                        {item.label}
                      </Link>
                    );
                  }

                  const Icon = SECTION_ICONS[item.id];
                  const active = pathname === '/compte' && activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitem"
                      onClick={() => goToSection(item.id)}
                      className={`compte-user-menu-item${active ? ' is-active' : ''}`}
                    >
                      <Icon className="compte-user-menu-icon" strokeWidth={1.75} />
                      {item.label}
                      {item.id === 'favoris' && badges?.favoris ? (
                        <span className="compte-user-menu-count">{badges.favoris}</span>
                      ) : null}
                      {item.id === 'commandes' && badges?.commandesEnCours ? (
                        <span className="compte-user-menu-count">{badges.commandesEnCours}</span>
                      ) : null}
                    </button>
                  );
                })}
                <Link
                  href="/promos"
                  role="menuitem"
                  onClick={closeMenu}
                  className={`compte-user-menu-item${isPromosActive ? ' is-active' : ''}`}
                >
                  <Percent className="compte-user-menu-icon" strokeWidth={1.75} />
                  Promotions
                </Link>
                <Link
                  href="/produits"
                  role="menuitem"
                  onClick={closeMenu}
                  className="compte-user-menu-item"
                >
                  <ShoppingBag className="compte-user-menu-icon" strokeWidth={1.75} />
                  Boutique
                </Link>
              </div>

              {onLogout && (
                <div className="compte-user-menu-footer">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="compte-user-menu-logout"
                  >
                    <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
