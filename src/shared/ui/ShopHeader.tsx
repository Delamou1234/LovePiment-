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
  Truck,
  Search,
} from 'lucide-react';
import type { BoutiqueNavLink } from '@/modules/produits/lib/boutique-nav';
import { useAuthSession, type AuthSessionUser } from '@/shared/providers/AuthSessionProvider';
import { BrandLogo } from '@/shared/ui/BrandLogo';
import { getShopPhoneDisplay, getShopTelHref } from '@/shared/lib/shop-contact';

const NAV_LINKS = [
  { name: 'Accueil', href: '/' },
  { name: 'Boutique', href: '/produits' },
  { name: 'Nouveautés', href: '/produits?tri=nouveautes' },
  { name: 'Promotions', href: '/promos' },
  { name: 'Contact', href: '/contact' },
];

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

function HeaderAccountButton({
  user,
  loginHref,
}: {
  user: AuthSessionUser | null;
  loginHref: string;
}) {
  if (!user) {
    return (
      <Link href={loginHref} className="text-white/80 transition hover:text-white" aria-label="Connexion">
        <User className="h-5 w-5" strokeWidth={1.75} />
      </Link>
    );
  }

  return (
    <Link href="/compte" className="text-white/80 transition hover:text-white" aria-label="Mon compte">
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover ring-1 ring-white/30" />
      ) : (
        <User className="h-5 w-5" strokeWidth={1.75} />
      )}
    </Link>
  );
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
    `lp-nav-link px-1 py-4${isNavActive(pathname, href, tri) ? ' is-active' : ''}`;

  return (
    <header className={`sticky top-0 z-50${isHome ? ' lp-header-shell--home' : ''}`}>
      {/* Top bar */}
      <div className={`lp-topbar hidden md:block${isHome ? ' lp-topbar--home' : ''}`}>
        <div className="container-shop flex items-center justify-center gap-8 py-2.5 text-[11px] text-white/70">
          <span className="inline-flex items-center gap-2">
            <Truck className="h-3.5 w-3.5 text-olive" />
            Livraison discrète et rapide
          </span>
          <span className="inline-flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-olive" />
            Paiement 100% sécurisé
          </span>
          <span className="inline-flex items-center gap-2">
            <Headphones className="h-3.5 w-3.5 text-olive" />
            Support discret 7j/7
          </span>
          <a
            href={telHref}
            className="inline-flex items-center gap-2 transition hover:text-white"
          >
            <Phone className="h-3.5 w-3.5 text-olive" />
            {phoneDisplay}
          </a>
        </div>
      </div>

      {/* Main nav */}
      <div className={`lp-header${isHome ? ' lp-header--home' : ''}`}>
        <div className="container-shop">
          <div className="hidden h-16 items-center justify-between lg:flex">
            <BrandLogo href="/" size="md" priority />

            <nav className="flex items-center gap-6 xl:gap-8">
              {NAV_LINKS.map((link) => (
                <Link key={link.name} href={link.href} className={navLinkClass(link.href)}>
                  {link.name}
                </Link>
              ))}

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setBoutiqueOpen(!boutiqueOpen)}
                  className={`lp-nav-link inline-flex items-center gap-1 px-1 py-4${boutiqueActive ? ' is-active' : ''}`}
                >
                  Catégories
                  <ChevronDown className={`h-3.5 w-3.5 transition ${boutiqueOpen ? 'rotate-180' : ''}`} />
                </button>
                {boutiqueOpen && boutiqueLinks.length > 0 && (
                  <div className="absolute left-1/2 top-full z-50 mt-1 w-56 -translate-x-1/2 rounded-xl border border-beige-border bg-[#161018] p-2 shadow-2xl">
                    {boutiqueLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setBoutiqueOpen(false)}
                        className="block rounded-lg px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="text-white/80 transition hover:text-white"
                aria-label="Rechercher"
              >
                <Search className="h-5 w-5" />
              </button>
              <HeaderAccountButton user={authUser} loginHref={loginHref} />
              <button
                type="button"
                onClick={() => panier.ouvrirPanier()}
                className="relative text-white/80 transition hover:text-white"
                aria-label="Panier"
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-olive px-1 text-[9px] font-bold text-white">
                  {cartProductCountDisplay > 99 ? '99+' : cartProductCountDisplay}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile */}
          <div className="flex h-14 items-center justify-between lg:hidden">
            <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="text-white" aria-label="Menu">
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <BrandLogo href="/" size="sm" />
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
            <div className="hidden border-t border-white/10 py-3 lg:block">
              <ProductSearchBar fullWidth />
            </div>
          )}
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 bg-[#0a0508] lg:hidden">
            <div className="container-shop space-y-1 py-4">
              <ProductSearchBar fullWidth className="mb-3" onNavigate={closeMenu} />
              {NAV_LINKS.map((link) => (
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
