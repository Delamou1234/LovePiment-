'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { usePanier, selectDistinctProductCount } from '@/store/panier';
import { ProductSearchBar } from '@/shared/components/ProductSearchBar';
import { CustomerAvatar } from '@/shared/components/CustomerAvatar';
import { AVATAR_UPDATED_EVENT } from '@/modules/compte/lib/avatar-events';
import {
  Menu,
  X,
  ShoppingBag,
  ChevronDown,
  User,
  LogOut,
  Truck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { BoutiqueNavLink } from '@/modules/produits/lib/boutique-nav';

type AuthUser = {
  name: string;
  email: string;
  role: 'admin' | 'customer';
  avatarUrl?: string | null;
};

const AUTH_ME_CACHE = 'kabishop_auth_me_v1';
const AUTH_ME_TTL_MS = 5 * 60 * 1000;

const NAV_AFTER_BOUTIQUE = [
  { name: 'Nouveautés', href: '/produits?tri=nouveautes' },
  { name: 'Promotions', href: '/promos' },
  { name: 'À propos', href: '/apropos' },
  { name: 'Contact', href: '/contact' },
];

type ShopHeaderProps = {
  boutiqueLinks?: BoutiqueNavLink[];
};

function isNavActive(pathname: string, href: string, tri?: string | null): boolean {
  const path = href.split('?')[0];
  if (href === '/') return pathname === '/';
  if (href.includes('tri=nouveautes')) {
    return pathname === '/produits' && tri === 'nouveautes';
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function ShopHeader({ boutiqueLinks = [] }: ShopHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tri = searchParams.get('tri');
  const router = useRouter();
  const panier = usePanier();
  const cartProductCount = usePanier(selectDistinctProductCount);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [boutiqueOpen, setBoutiqueOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;

    try {
      const raw = sessionStorage.getItem(AUTH_ME_CACHE);
      if (raw) {
        const { user, ts } = JSON.parse(raw) as { user: AuthUser | null; ts: number };
        if (Date.now() - ts < AUTH_ME_TTL_MS && user?.role === 'customer') {
          setAuthUser(user);
        }
      }
    } catch {
      /* ignore */
    }

    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const user =
          data?.user?.role === 'customer'
            ? ({
                name: data.user.name,
                email: data.user.email,
                role: 'customer' as const,
                avatarUrl: data.user.avatarUrl ?? null,
              } satisfies AuthUser)
            : null;
        setAuthUser(user);
        try {
          sessionStorage.setItem(
            AUTH_ME_CACHE,
            JSON.stringify({ user, ts: Date.now() }),
          );
        } catch {
          /* ignore */
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    const onAvatarUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ avatarUrl: string | null }>).detail;
      setAuthUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, avatarUrl: detail.avatarUrl };
        try {
          sessionStorage.setItem(
            AUTH_ME_CACHE,
            JSON.stringify({ user: next, ts: Date.now() }),
          );
        } catch {
          /* ignore */
        }
        return next;
      });
    };

    window.addEventListener(AVATAR_UPDATED_EVENT, onAvatarUpdated);
    return () => window.removeEventListener(AVATAR_UPDATED_EVENT, onAvatarUpdated);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    try {
      sessionStorage.removeItem(AUTH_ME_CACHE);
    } catch {
      /* ignore */
    }
    setAuthUser(null);
    router.refresh();
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setBoutiqueOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setBoutiqueOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const cartProductCountDisplay = mounted ? cartProductCount : 0;

  const loginHref =
    pathname === '/connexion' || pathname === '/inscription'
      ? '/connexion'
      : `/connexion?redirect=${encodeURIComponent(pathname)}`;

  const closeMenu = () => setMenuOpen(false);

  const navLinkClass = (href: string) => {
    const active = isNavActive(pathname, href, tri);
    return `shop-nav-link${active ? ' is-active' : ''}`;
  };

  const boutiqueActive =
    pathname.startsWith('/produits') || pathname.startsWith('/promos');

  return (
    <>
      <div className="shop-announcement px-3 py-2.5 text-center">
        <p className="inline-flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/95 sm:text-[11px] sm:tracking-[0.16em]">
          <Truck className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2} />
          <span>Livraison offerte dès 500&nbsp;000 GNF à Conakry</span>
          <Sparkles className="hidden h-3 w-3 shrink-0 opacity-80 sm:inline" strokeWidth={2} />
        </p>
      </div>

      <header
        className={`shop-header sticky top-0 z-40 supports-[backdrop-filter]:backdrop-blur-md${scrolled ? ' is-scrolled' : ''}`}
      >
        <div className="container-kabishop">
          {/* Desktop : logo | nav centrée | recherche + actions */}
          <div className="hidden lg:grid lg:h-16 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-4">
            <Link href="/" className="group justify-self-start">
              <span className="font-serif text-[1.5rem] font-bold leading-none tracking-tight text-zinc-900 transition-colors group-hover:text-olive">
                KabiShop<span className="text-olive">.</span>
              </span>
            </Link>

            <nav className="flex items-center justify-self-center gap-5 xl:gap-6">
              <Link href="/" className={navLinkClass('/')}>
                Accueil
              </Link>

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setBoutiqueOpen(!boutiqueOpen)}
                  className={`shop-nav-link${boutiqueActive ? ' is-active' : ''}`}
                  aria-expanded={boutiqueOpen}
                  aria-haspopup="true"
                >
                  Boutique
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${boutiqueOpen ? 'rotate-180' : ''}`}
                    strokeWidth={2.5}
                  />
                </button>

                {boutiqueOpen && (
                  <div className="shop-mega-menu absolute left-1/2 top-[calc(100%+0.85rem)] z-50 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 p-2 animate-fadeIn">
                    <div className="mb-1 flex items-center justify-between px-2 pt-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                        Collections
                      </p>
                      <Link
                        href="/produits"
                        onClick={() => setBoutiqueOpen(false)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-olive hover:text-olive-dark"
                      >
                        Voir tout
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                    <div className="space-y-0.5">
                      {boutiqueLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setBoutiqueOpen(false)}
                          className="shop-mega-link"
                        >
                          <span className="shop-mega-link-title">{link.name}</span>
                          <span className="shop-mega-link-desc">{link.desc}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {NAV_AFTER_BOUTIQUE.map((link) => (
                <Link key={link.name} href={link.href} className={navLinkClass(link.href)}>
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="shop-header-actions flex items-center justify-self-end gap-2">
              <ProductSearchBar compact />

              <div className="flex items-center gap-1.5 rounded-full border border-beige-border/80 bg-white/70 p-1 shadow-sm">
                {authUser ? (
                  <Link
                    href="/compte"
                    className="shop-icon-btn !border-0 !bg-transparent !shadow-none"
                    aria-label="Mon compte"
                    title={authUser.name}
                  >
                    <CustomerAvatar
                      name={authUser.name}
                      avatarUrl={authUser.avatarUrl}
                      size="xs"
                      ringClassName="ring-beige-border"
                    />
                  </Link>
                ) : (
                  <Link
                    href={loginHref}
                    className="shop-icon-btn !border-0 !bg-transparent !shadow-none"
                    aria-label="Connexion"
                    title="Connexion"
                  >
                    <User className="h-4 w-4" strokeWidth={1.75} />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => panier.ouvrirPanier()}
                  className="shop-icon-btn relative !border-0 !bg-transparent !shadow-none"
                  aria-label={`Panier${cartProductCountDisplay > 0 ? ` (${cartProductCountDisplay} produit${cartProductCountDisplay > 1 ? 's' : ''})` : ''}`}
                >
                  <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
                  {cartProductCountDisplay > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-olive px-0.5 text-[9px] font-bold text-white ring-2 ring-white">
                      {cartProductCountDisplay > 99 ? '99+' : cartProductCountDisplay}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile */}
          <div className="relative flex h-[3.75rem] items-center justify-between gap-2 lg:hidden">
            <button
              type="button"
              className="shop-icon-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/" className="absolute left-1/2 -translate-x-1/2">
              <span className="font-serif text-xl font-bold tracking-tight text-zinc-900">
                KabiShop<span className="text-olive">.</span>
              </span>
            </Link>

            <div className="flex items-center gap-1">
              {authUser ? (
                <Link href="/compte" className="shop-icon-btn" aria-label="Mon compte" title={authUser.name}>
                  <CustomerAvatar
                    name={authUser.name}
                    avatarUrl={authUser.avatarUrl}
                    size="xs"
                    ringClassName="ring-beige-border"
                  />
                </Link>
              ) : (
                <Link href={loginHref} className="shop-icon-btn" aria-label="Connexion" title="Connexion">
                  <User className="h-4 w-4" strokeWidth={1.75} />
                </Link>
              )}
              <button
                type="button"
                onClick={() => panier.ouvrirPanier()}
                className="shop-icon-btn relative"
                aria-label={`Panier${cartProductCountDisplay > 0 ? ` (${cartProductCountDisplay})` : ''}`}
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
                {cartProductCountDisplay > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-olive px-0.5 text-[9px] font-bold text-white ring-2 ring-white">
                    {cartProductCountDisplay > 99 ? '99+' : cartProductCountDisplay}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-beige-border bg-white/98 backdrop-blur-md lg:hidden animate-fadeIn max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain">
            <div className="container-kabishop space-y-1 py-5 safe-area-bottom">
              <ProductSearchBar fullWidth className="mb-4" onNavigate={closeMenu} />

              <Link href="/" onClick={closeMenu} className={`block rounded-xl px-3 py-3 ${navLinkClass('/')}`}>
                Accueil
              </Link>

              <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                Boutique
              </p>
              {boutiqueLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="block rounded-xl px-3 py-2.5"
                >
                  <span className="block text-sm font-semibold text-zinc-800">{link.name}</span>
                  <span className="text-xs text-zinc-400">{link.desc}</span>
                </Link>
              ))}

              {NAV_AFTER_BOUTIQUE.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={closeMenu}
                  className={`block rounded-xl px-3 py-3 ${navLinkClass(link.href)}`}
                >
                  {link.name}
                </Link>
              ))}

              {authUser ? (
                <>
                  <Link
                    href="/compte"
                    onClick={closeMenu}
                    className="mt-3 flex items-center gap-3 rounded-xl border border-beige-border bg-cream px-3 py-3"
                  >
                    <CustomerAvatar
                      name={authUser.name}
                      avatarUrl={authUser.avatarUrl}
                      size="sm"
                      ringClassName="ring-beige-border"
                    />
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Mon compte</p>
                      <p className="text-xs text-zinc-500">{authUser.name}</p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-zinc-500"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.5} />
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link
                  href={loginHref}
                  onClick={closeMenu}
                  className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-olive px-4 py-3 text-sm font-semibold text-white"
                >
                  <User className="h-4 w-4" strokeWidth={1.75} />
                  Connexion
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
