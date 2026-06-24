'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Gift,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ShoppingBag,
  Store,
  User,
} from 'lucide-react';
import { usePanier, selectDistinctProductCount } from '@/store/panier';
import { ProductSearchBar } from '@/shared/components/ProductSearchBar';
import { CompteAvatar } from './CompteAvatar';
import { AVATAR_UPDATED_EVENT } from '@/modules/compte/lib/avatar-events';
import {
  COMPTE_NAV_GROUPS,
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
  minimal?: boolean;
};

type MenuItem =
  | { kind: 'section'; id: CompteSectionId; label: string; icon: typeof User }
  | { kind: 'link'; href: string; label: string; icon: typeof User };

const MENU_ITEMS: MenuItem[] = [
  { kind: 'section', id: 'dashboard', label: 'Vue d\'ensemble', icon: LayoutDashboard },
  { kind: 'section', id: 'profil', label: 'Mon profil', icon: User },
  { kind: 'link', href: '/compte/messages', label: 'Messagerie', icon: MessageSquare },
  { kind: 'link', href: '/produits', label: 'Boutique', icon: ShoppingBag },
];

const QUICK_ACTION =
  'relative flex h-9 w-9 items-center justify-center rounded-xl border border-beige-border bg-white text-zinc-500 shadow-sm transition hover:border-olive/30 hover:text-olive hover:shadow-md';

const QUICK_ACTION_ACTIVE =
  'border-olive/40 bg-olive/5 text-olive shadow-sm';

function isNavLinkActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolvePageTitle(pathname: string, section: CompteSectionId): string {
  const items = COMPTE_NAV_GROUPS.flatMap((g) => g.items);
  const linkItem = items.find(
    (item) => item.kind === 'link' && isNavLinkActive(pathname, item.href),
  );
  if (linkItem?.kind === 'link') return linkItem.label;

  const sectionItem = items.find((item) => item.kind === 'section' && item.id === section);
  return sectionItem?.kind === 'section' ? sectionItem.label : 'Mon compte';
}

export function CompteTopBar({
  profil,
  activeSection = 'dashboard',
  onProfilUpdate,
  onLogout,
  onGoToSection,
  minimal = false,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const panier = usePanier();
  const cartProductCount = usePanier(selectDistinctProductCount);
  const [localProfil, setLocalProfil] = useState(profil);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const onProfilUpdateRef = useRef(onProfilUpdate);
  const localProfilRef = useRef(profil);

  useEffect(() => {
    onProfilUpdateRef.current = onProfilUpdate;
  }, [onProfilUpdate]);

  useEffect(() => {
    localProfilRef.current = localProfil;
  }, [localProfil]);

  const pageTitle = resolvePageTitle(pathname, activeSection);
  const isMessagesActive = isNavLinkActive(pathname, '/compte/messages');
  const isFideliteActive = pathname === '/compte' && activeSection === 'fidelite';

  useEffect(() => {
    setLocalProfil(profil);
  }, [profil]);

  useEffect(() => {
    const onAvatarUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ avatarUrl: string | null }>).detail;
      const next = { ...localProfilRef.current, avatarUrl: detail.avatarUrl };
      localProfilRef.current = next;
      setLocalProfil(next);
      onProfilUpdateRef.current?.(next);
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

  const isVip = localProfil.pointsFidelite >= VIP_POINTS_THRESHOLD;

  const closeMenu = () => setMenuOpen(false);

  const handleSection = (id: CompteSectionId) => {
    closeMenu();
    if (pathname !== '/compte') {
      router.push(id === 'dashboard' ? '/compte' : `/compte?section=${id}`);
      return;
    }
    onGoToSection?.(id);
  };

  const goToFidelite = () => {
    if (pathname !== '/compte') {
      router.push('/compte?section=fidelite');
      return;
    }
    onGoToSection?.('fidelite');
  };

  const handleLogout = () => {
    closeMenu();
    onLogout?.();
  };

  return (
    <header className={`relative z-30 shrink-0 border-b border-[#ead6de] bg-white/90 px-4 backdrop-blur-md md:px-6 lg:px-8 ${minimal ? 'py-2' : 'py-2.5'}`}>
      <div className="flex items-center gap-3 md:gap-4">
        {!minimal && (
          <>
            <div className="hidden min-w-0 shrink-0 md:block md:max-w-[140px] lg:max-w-[180px]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Mon espace
              </p>
              <h1 className="font-serif text-base font-bold text-zinc-900 truncate lg:text-lg">
                {pageTitle}
              </h1>
            </div>
            <div className="hidden h-8 w-px shrink-0 bg-[#ead6de] md:block" aria-hidden />
          </>
        )}

        {/* Recherche compacte */}
        <ProductSearchBar
          compact
          placeholder="Rechercher…"
          className="min-w-0 flex-1 sm:flex-none sm:w-[160px] md:w-[200px] lg:w-[220px]"
          inputClassName="border-beige-border bg-cream/50 text-xs shadow-none focus:border-olive/40 focus:bg-white focus:ring-2 focus:ring-olive/10"
        />

        <div className="hidden min-w-2 flex-1 sm:block" aria-hidden />

        {/* Actions rapides */}
        <nav
          className="flex shrink-0 items-center gap-1 sm:gap-1.5"
          aria-label="Raccourcis"
        >
          <Link
            href="/"
            className={`${QUICK_ACTION} hidden lg:flex`}
            title="Accueil boutique"
          >
            <Home className="h-4 w-4" strokeWidth={1.75} />
          </Link>

          <Link
            href="/produits"
            className={`${QUICK_ACTION} hidden sm:inline-flex`}
            title="Boutique"
          >
            <Store className="h-4 w-4" strokeWidth={1.75} />
          </Link>

          <Link
            href="/compte/messages"
            className={`${QUICK_ACTION} ${isMessagesActive ? QUICK_ACTION_ACTIVE : ''}`}
            title="Messagerie"
          >
            <MessageSquare className="h-4 w-4" strokeWidth={1.75} />
          </Link>

          <button
            type="button"
            onClick={goToFidelite}
            className={`hidden sm:flex h-9 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold shadow-sm transition ${
              isFideliteActive
                ? 'border-olive/40 bg-olive/5 text-olive'
                : 'border-beige-border bg-white text-zinc-600 hover:border-olive/30 hover:text-olive'
            }`}
            title="Mes points fidélité"
          >
            <Gift className="h-3.5 w-3.5 shrink-0" />
            <span>{localProfil.pointsFidelite} pts</span>
            {isVip && (
              <span className="rounded bg-amber-100 px-1 py-px text-[8px] font-bold uppercase text-amber-800">
                VIP
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => panier.ouvrirPanier()}
            className={QUICK_ACTION}
            title="Panier"
            aria-label={`Panier${cartProductCount > 0 ? ` (${cartProductCount} produit${cartProductCount > 1 ? 's' : ''})` : ''}`}
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
            {cartProductCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-olive px-0.5 text-[9px] font-bold text-white">
                {cartProductCount > 99 ? '99+' : cartProductCount}
              </span>
            )}
          </button>
        </nav>

        <div className="hidden h-8 w-px shrink-0 bg-beige-border/80 sm:block" aria-hidden />

        {/* Profil */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ring-2 transition focus-visible:outline-none focus-visible:ring-olive/40 ${
              menuOpen ? 'ring-olive/50' : 'ring-beige-border hover:ring-olive/30'
            }`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={`Menu compte — ${localProfil.nom}`}
            title={localProfil.nom}
          >
            <CompteAvatar profil={localProfil} size="sm" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 overflow-hidden rounded-xl border border-beige-border bg-white py-1 shadow-[0_12px_40px_rgba(0,0,0,0.1)] animate-fadeIn"
            >
              <div className="border-b border-beige-border/80 px-4 py-3">
                <p className="truncate text-sm font-semibold text-zinc-900">{localProfil.nom}</p>
                <p className="truncate text-xs text-zinc-500">{localProfil.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-olive/10 px-2 py-0.5 text-[10px] font-semibold text-olive">
                    <Gift className="h-3 w-3" />
                    {localProfil.pointsFidelite} pts
                  </span>
                  {isVip && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      Client VIP
                    </span>
                  )}
                </div>
              </div>

              <div className="py-1">
                {MENU_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.kind === 'link'
                      ? pathname.startsWith(item.href)
                      : item.kind === 'section' &&
                        pathname === '/compte' &&
                        activeSection === item.id;

                  if (item.kind === 'link') {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        onClick={closeMenu}
                        className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition ${
                          active
                            ? 'bg-cream text-olive font-medium'
                            : 'text-zinc-600 hover:bg-cream hover:text-zinc-900'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 opacity-80" />
                        {item.label}
                      </Link>
                    );
                  }

                  if (item.kind === 'section') {
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        onClick={() => handleSection(item.id)}
                        className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition ${
                          active
                            ? 'bg-cream text-olive font-medium'
                            : 'text-zinc-600 hover:bg-cream hover:text-zinc-900'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 opacity-80" />
                        {item.label}
                      </button>
                    );
                  }

                  return null;
                })}
              </div>

              {onLogout && (
                <div className="border-t border-beige-border/80 py-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
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
