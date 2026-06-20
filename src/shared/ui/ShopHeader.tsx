'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { usePanier } from '@/store/panier';
import {
  Search,
  Menu,
  X,
  ShoppingBag,
  ChevronDown,
  User,
} from 'lucide-react';

const NAV_AFTER_BOUTIQUE = [
  { name: 'Nouveautés', href: '/produits?tri=nouveautes' },
  { name: 'Promotions', href: '/produits?promo=1' },
  { name: 'À propos', href: '/#apropos' },
  { name: 'Contact', href: '/#contact' },
];

const BOUTIQUE_LINKS = [
  { name: 'Toute la boutique', href: '/produits' },
  { name: 'Mode', href: '/produits?univers=mode' },
  { name: 'Beauté', href: '/produits?univers=beaute' },
  { name: 'Robes', href: '/produits?categorie=robes' },
  { name: 'Parfums', href: '/produits?categorie=parfums' },
];

export function ShopHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const panier = usePanier();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [boutiqueOpen, setBoutiqueOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setBoutiqueOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const totalItems = mounted ? panier.totalItems : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/produits?search=${encodeURIComponent(q)}`);
    else router.push('/produits');
    setMenuOpen(false);
  };

  const navLinkClass = (href: string) => {
    const active = href === '/' ? pathname === '/' : pathname.startsWith(href.split('?')[0]) && href !== '/';
    return `text-sm font-medium transition-colors hover:text-zinc-900 ${
      active ? 'text-zinc-900' : 'text-zinc-500'
    }`;
  };

  return (
    <>
      {/* Barre annonce — noire, comme le mock */}
      <div className="bg-zinc-900 py-2 text-center">
        <p className="text-xs text-white font-medium tracking-wide">
          Livraison offerte dès 500&nbsp;000 GN à Conakry&nbsp;!
        </p>
      </div>

      <header className="sticky top-0 z-40 border-b border-[#ebe4d8] bg-white">
        <div className="container-kabishop">
          {/* Desktop : logo | nav centrée | actions */}
          <div className="hidden lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:h-[76px] lg:gap-4">
            <Link href="/" className="justify-self-start">
              <span className="font-serif text-[1.65rem] font-bold tracking-tight text-zinc-900">
                KabiShop<span className="text-zinc-900">.</span>
              </span>
            </Link>

            <nav className="flex items-center gap-8 justify-self-center">
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

            <div className="flex items-center gap-3 justify-self-end">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="search"
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-52 xl:w-60 rounded-full border border-[#e8e0d4] bg-[#faf7f2] py-2 pl-4 pr-10 text-sm text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>

              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '224620000000'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center text-zinc-600 hover:text-zinc-900 transition"
                aria-label="Mon compte / Contact"
              >
                <User className="h-5 w-5" strokeWidth={1.5} />
              </a>

              <button
                type="button"
                onClick={() => panier.ouvrirPanier()}
                className="relative flex h-9 w-9 items-center justify-center text-zinc-700 hover:text-zinc-900 transition"
                aria-label="Panier"
              >
                <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[9px] font-bold text-white">
                  {totalItems}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile / tablette */}
          <div className="flex lg:hidden h-[64px] items-center justify-between gap-3">
            <button
              type="button"
              className="p-2 text-zinc-700"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <Link href="/">
              <span className="font-serif text-xl font-bold text-zinc-900">KabiShop.</span>
            </Link>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => panier.ouvrirPanier()}
                className="relative p-2 text-zinc-700"
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[9px] font-bold text-white">
                  {totalItems}
                </span>
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-[#ebe4d8] bg-white lg:hidden animate-fadeIn">
            <div className="container-kabishop py-4 space-y-1">
              <form onSubmit={handleSearch} className="relative mb-4">
                <input
                  type="search"
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-[#ebe4d8] bg-[#faf7f2] py-2.5 pl-4 pr-10 text-sm"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Search className="h-4 w-4 text-zinc-400" />
                </button>
              </form>
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
            </div>
          </div>
        )}
      </header>
    </>
  );
}
