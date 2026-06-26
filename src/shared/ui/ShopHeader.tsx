'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathBoundOpen } from '@/shared/hooks/usePathBoundOpen';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { usePanier, selectDistinctProductCount } from '@/store/panier';
import { ProductSearchBar } from '@/shared/components/ProductSearchBar';
import { CustomerAvatar } from '@/shared/components/CustomerAvatar';
import {
  Menu,
  X,
  ShoppingBag,
  ChevronDown,
  User,
  LogOut,
  Headphones,
  Lock,
  Phone,
  Heart,
  Search,
} from 'lucide-react';
import type { BoutiqueNavLink } from '@/modules/produits/lib/boutique-nav';
import { useAuthSession } from '@/shared/providers/AuthSessionProvider';
import { BrandLogo } from '@/shared/ui/BrandLogo';
import { getShopPhoneDisplay, getShopTelHref } from '@/shared/lib/shop-contact';

const NAV_BEFORE_CATEGORIES = [
  { name: 'Accueil', href: '/' },
  { name: 'Boutique', href: '/produits' },
] as const;

const NAV_AFTER_CATEGORIES = [
  { name: 'Nouveautés', href: '/produits?tri=nouveautes' },
  { name: 'Promotions', href: '/promos' },
  { name: 'Contact', href: '/contact' },
] as const;

type ShopHeaderProps = {
  boutiqueLinks?: BoutiqueNavLink[];
};

function isNavActive(pathname: string, href: string, tri?: string | null): boolean {
  const path = href.split('?')[0];
  if (href === '/') return pathname === '/';
  if (href.includes('tri=nouveautes')) return pathname === '/produits' && tri === 'nouveautes';
  if (href === '/produits') return pathname === '/produits' && tri !== 'nouveautes';
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function ShopHeader({ boutiqueLinks = [] }: ShopHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tri = searchParams.get('tri');
  const panier = usePanier();
  const cartProductCountDisplay = usePanier(selectDistinctProductCount);
  const { user: authUser, logout } = useAuthSession();
  const [menuOpen, setMenuOpen] = usePathBoundOpen(pathname);
  const [boutiqueOpen, setBoutiqueOpen] = usePathBoundOpen(pathname);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const loginHref = `/connexion?redirect=${encodeURIComponent(pathname)}`;
  const telHref = getShopTelHref();
  const phoneDisplay = getShopPhoneDisplay();

  const boutiqueActive = pathname.startsWith('/produits') || pathname.startsWith('/promos');
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setBoutiqueOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [pathname, setBoutiqueOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  const navLinkClass = (href: string) =>
    `lp-nav-link${isNavActive(pathname, href, tri) ? ' is-active' : ''}`;

  const allNavLinks = [
    ...NAV_BEFORE_CATEGORIES,
    ...NAV_AFTER_CATEGORIES,
  ];

  return (
    <header
      className={`lp-header-shell sticky top-0 z-50${scrolled ? ' is-scrolled' : ''}${isHome ? ' lp-header-shell--home' : ''}`}
    >
      <div className={`lp-topbar hidden md:block${isHome ? ' lp-topbar--home' : ''}`}>
        <div className="container-shop">
          <div className="lp-topbar-inner">
            <span className="lp-topbar-item">
              <Heart className="lp-topbar-icon fill-olive text-olive" strokeWidth={0} />
              Livraison discrète et rapide
            </span>
            <span className="lp-topbar-item">
              <Lock className="lp-topbar-icon text-olive" strokeWidth={1.75} />
              Paiement 100% sécurisé
            </span>
            <span className="lp-topbar-item">
              <Headphones className="lp-topbar-icon text-olive" strokeWidth={1.75} />
              Support discret 7j/7
            </span>
            {!isHome && (
              <a href={telHref} className="lp-topbar-item lp-topbar-item--link">
                <Phone className="lp-topbar-icon text-olive" strokeWidth={1.75} />
                {phoneDisplay}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className={`lp-header${isHome ? ' lp-header--home' : ''}`}>
        <div className="container-shop">
          <div className="lp-header-main hidden lg:grid">
            <div className="lp-header-brand">
              <BrandLogo href="/" size="md" tagline={isHome ? 'Pour femme' : undefined} />
            </div>

            <nav className="lp-header-nav" aria-label="Navigation principale">
              {NAV_BEFORE_CATEGORIES.map((link) => (
                <Link key={link.name} href={link.href} className={navLinkClass(link.href)}>
                  {link.name}
                </Link>
              ))}

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setBoutiqueOpen(!boutiqueOpen)}
                  className={`lp-nav-link lp-nav-link--dropdown${boutiqueActive ? ' is-active' : ''}`}
                >
                  Catégories
                  <ChevronDown className={`h-3.5 w-3.5 opacity-70 transition ${boutiqueOpen ? 'rotate-180' : ''}`} />
                </button>
                {boutiqueOpen && boutiqueLinks.length > 0 && (
                  <div className="lp-nav-dropdown">
                    {boutiqueLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setBoutiqueOpen(false)}
                        className="lp-nav-dropdown-link"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {NAV_AFTER_CATEGORIES.map((link) => (
                <Link key={link.name} href={link.href} className={navLinkClass(link.href)}>
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="lp-header-actions">
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="lp-header-icon-btn"
                aria-label="Rechercher"
                aria-expanded={searchOpen}
              >
                <Search className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
              </button>
              <Link href={authUser ? '/compte' : loginHref} className="lp-header-icon-btn" aria-label={authUser ? 'Mon compte' : 'Connexion'}>
                {authUser?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={authUser.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <User className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
                )}
              </Link>
              <button
                type="button"
                onClick={() => panier.ouvrirPanier()}
                className="lp-header-icon-btn lp-header-icon-btn--cart"
                aria-label="Panier"
              >
                <ShoppingBag className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
                <span className="lp-header-cart-badge">
                  {cartProductCountDisplay > 99 ? '99+' : cartProductCountDisplay}
                </span>
              </button>
            </div>
          </div>

          <div className="flex h-16 items-center justify-between lg:hidden">
            <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="text-white" aria-label="Menu">
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <BrandLogo href="/" size="sm" tagline={isHome ? 'Pour femme' : undefined} />
            <button
              type="button"
              onClick={() => panier.ouvrirPanier()}
              className="relative text-white"
              aria-label="Panier"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartProductCountDisplay > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-olive text-[9px] font-bold text-white">
                  {cartProductCountDisplay}
                </span>
              )}
            </button>
          </div>

          {searchOpen && (
            <div className="lp-header-search hidden lg:block">
              <div className="lp-header-search-inner">
                <ProductSearchBar
                  autoFocus
                  fullWidth
                  inputClassName="lp-search-input--header"
                  onNavigate={() => setSearchOpen(false)}
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="lp-header-search-close"
                  aria-label="Fermer la recherche"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 bg-[#0a0508] lg:hidden">
            <div className="container-shop space-y-1 py-4">
              <ProductSearchBar
                fullWidth
                className="mb-3 max-w-md mx-auto w-full"
                inputClassName="lp-search-input--header"
                onNavigate={closeMenu}
              />
              {allNavLinks.map((link) => (
                <Link key={link.name} href={link.href} onClick={closeMenu} className="block py-2.5 text-sm font-semibold text-white/85">
                  {link.name}
                </Link>
              ))}
              <p className="pt-2 text-[10px] font-bold uppercase tracking-widest text-white/40">Catégories</p>
              {boutiqueLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={closeMenu} className="block py-2 text-sm text-white/70">
                  {link.name}
                </Link>
              ))}
              {authUser ? (
                <>
                  <Link href="/compte" onClick={closeMenu} className="mt-3 flex items-center gap-3 py-2">
                    <CustomerAvatar name={authUser.name} avatarUrl={authUser.avatarUrl} size="sm" />
                    <span className="text-sm text-white">{authUser.name}</span>
                  </Link>
                  <button type="button" onClick={handleLogout} className="flex items-center gap-2 py-2 text-sm text-white/60">
                    <LogOut className="h-4 w-4" /> Déconnexion
                  </button>
                </>
              ) : (
                <Link href={loginHref} onClick={closeMenu} className="mt-3 block rounded-full bg-olive py-3 text-center text-sm font-semibold text-white">
                  Connexion
                </Link>
              )}
              <a
                href={telHref}
                onClick={closeMenu}
                className="mt-4 flex items-center justify-center gap-2 rounded-full border border-white/20 py-3 text-sm font-semibold text-white"
              >
                <Phone className="h-4 w-4" />
                Appeler — {phoneDisplay}
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
