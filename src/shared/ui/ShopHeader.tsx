'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePanier, selectTotalItems } from '@/store/panier';
import { ProductSearchBar } from '@/shared/components/ProductSearchBar';
import {
  Menu,
  X,
  ShoppingBag,
  ChevronDown,
  User,
  LogOut,
} from 'lucide-react';

type AuthUser = {
  name: string;
  email: string;
  role: 'admin' | 'customer';
};

const AUTH_ME_CACHE = 'kabishop_auth_me_v1';
const AUTH_ME_TTL_MS = 5 * 60 * 1000;

const NAV_AFTER_BOUTIQUE = [
  { name: 'Nouveautés', href: '/produits?tri=nouveautes' },
  { name: 'Promotions', href: '/promos' },
  { name: 'À propos', href: '/apropos' },
  { name: 'Contact', href: '/contact' },
];

const BOUTIQUE_LINKS = [
  { name: 'Toute la boutique', href: '/produits' },
  { name: 'Parfums', href: '/produits?categorie=parfums' },
  { name: 'Huiles corporelles', href: '/produits?categorie=huiles-corps' },
  { name: 'Huiles capillaires', href: '/produits?categorie=huiles-capillaires' },
  { name: 'Eaux de parfum', href: '/produits?categorie=eaux-parfum' },
];

export function ShopHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const panier = usePanier();
  const totalItems = usePanier(selectTotalItems);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [boutiqueOpen, setBoutiqueOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

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
        const user = data?.user?.role === 'customer' ? (data.user as AuthUser) : null;
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

  const totalItemsDisplay = mounted ? totalItems : 0;

  const loginHref =
    pathname === '/connexion' || pathname === '/inscription'
      ? '/connexion'
      : `/connexion?redirect=${encodeURIComponent(pathname)}`;

  const closeMenu = () => setMenuOpen(false);

  const navLinkClass = (href: string) => {
    const active = href === '/' ? pathname === '/' : pathname.startsWith(href.split('?')[0]) && href !== '/';
    return `text-sm font-medium transition-colors hover:text-zinc-900 ${
      active ? 'text-zinc-900' : 'text-zinc-500'
    }`;
  };

  return (
    <>
      {/* Barre annonce */}
      <div className="bg-zinc-900 py-1.5 text-center">
        <p className="text-[11px] text-white font-medium tracking-wide">
          Livraison offerte dès 500&nbsp;000 GN à Conakry&nbsp;!
        </p>
      </div>

      <header className="sticky top-0 z-40 border-b border-[#ebe4d8] bg-white">
        <div className="container-kabishop">
          {/* Desktop : logo | nav centrée | actions */}
          <div className="hidden lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:h-14 lg:gap-3">
            <Link href="/" className="justify-self-start">
              <span className="font-serif text-xl font-bold tracking-tight text-zinc-900">
                KabiShop<span className="text-zinc-900">.</span>
              </span>
            </Link>

            <nav className="flex items-center gap-6 justify-self-center">
              <Link href="/" className={navLinkClass('/')}>
                Accueil
              </Link>

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setBoutiqueOpen(!boutiqueOpen)}
                  className="flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition"
                >
                  Boutique
                  <ChevronDown className={`h-3.5 w-3.5 transition ${boutiqueOpen ? 'rotate-180' : ''}`} />
                </button>
                {boutiqueOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-52 rounded-lg border border-[#ebe4d8] bg-white py-1.5 shadow-lg animate-fadeIn">
                    {BOUTIQUE_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setBoutiqueOpen(false)}
                        className="block px-4 py-2.5 text-sm text-zinc-600 hover:bg-[#faf7f2] hover:text-zinc-900"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {NAV_AFTER_BOUTIQUE.map((link) => (
                <Link key={link.name} href={link.href} className={navLinkClass(link.href)}>
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 justify-self-end">
              <ProductSearchBar compact />

              {authUser ? (
                <div className="flex items-center gap-1">
                  <Link
                    href="/compte"
                    className="flex h-8 w-8 items-center justify-center text-zinc-600 hover:text-zinc-900 transition"
                    aria-label="Mon compte"
                    title={authUser.name}
                  >
                    <User className="h-4 w-4" strokeWidth={1.5} />
                  </Link>
                </div>
              ) : (
                <Link
                  href={loginHref}
                  className="flex h-8 w-8 items-center justify-center text-zinc-600 hover:text-zinc-900 transition"
                  aria-label="Connexion"
                  title="Connexion"
                >
                  <User className="h-4 w-4" strokeWidth={1.5} />
                </Link>
              )}

              <button
                type="button"
                onClick={() => panier.ouvrirPanier()}
                className="relative flex h-8 w-8 items-center justify-center text-zinc-700 hover:text-zinc-900 transition"
                aria-label={`Panier${totalItemsDisplay > 0 ? ` (${totalItemsDisplay} articles)` : ''}`}
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                {totalItemsDisplay > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-0.5 text-[9px] font-bold text-white">
                    {totalItemsDisplay > 99 ? '99+' : totalItemsDisplay}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile / tablette */}
          <div className="flex lg:hidden h-12 items-center justify-between gap-3">
            <button
              type="button"
              className="p-2 text-zinc-700"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <Link href="/">
              <span className="font-serif text-lg font-bold text-zinc-900">KabiShop.</span>
            </Link>

            <div className="flex items-center gap-1">
              {authUser ? (
                <Link
                  href="/compte"
                  className="p-2 text-zinc-700"
                  aria-label="Mon compte"
                  title={authUser.name}
                >
                  <User className="h-5 w-5" strokeWidth={1.5} />
                </Link>
              ) : (
                <Link
                  href={loginHref}
                  className="p-2 text-zinc-700"
                  aria-label="Connexion"
                  title="Connexion"
                >
                  <User className="h-5 w-5" strokeWidth={1.5} />
                </Link>
              )}
              <button
                type="button"
                onClick={() => panier.ouvrirPanier()}
                className="relative p-2 text-zinc-700"
                aria-label={`Panier${totalItemsDisplay > 0 ? ` (${totalItemsDisplay} articles)` : ''}`}
              >
                <ShoppingBag className="h-5 w-5" />
                {totalItemsDisplay > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-0.5 text-[9px] font-bold text-white">
                    {totalItemsDisplay > 99 ? '99+' : totalItemsDisplay}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-[#ebe4d8] bg-white lg:hidden animate-fadeIn">
            <div className="container-kabishop py-4 space-y-1">
              <ProductSearchBar fullWidth className="mb-4" onNavigate={closeMenu} />
              <Link href="/" onClick={() => setMenuOpen(false)} className="block py-2.5 text-sm font-medium">
                Accueil
              </Link>
              <p className="pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Boutique</p>
              {BOUTIQUE_LINKS.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="block py-2 pl-2 text-sm text-zinc-600">
                  {link.name}
                </Link>
              ))}
              {NAV_AFTER_BOUTIQUE.map((link) => (
                <Link key={link.name} href={link.href} onClick={() => setMenuOpen(false)} className="block py-2.5 text-sm font-medium">
                  {link.name}
                </Link>
              ))}
              {authUser ? (
                <>
                  <Link
                    href="/compte"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 py-2.5 text-sm font-medium border-t border-[#ebe4d8] mt-2 pt-4"
                  >
                    <User className="h-4 w-4" strokeWidth={1.5} />
                    Mon compte ({authUser.name})
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      handleLogout();
                    }}
                    className="flex items-center gap-2 py-2.5 text-sm font-medium text-zinc-500 w-full text-left"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.5} />
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link
                  href={loginHref}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 py-2.5 text-sm font-medium border-t border-[#ebe4d8] mt-2 pt-4"
                >
                  <User className="h-4 w-4" strokeWidth={1.5} />
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
