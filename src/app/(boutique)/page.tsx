import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Truck,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Headphones,
  BadgeCheck,
} from 'lucide-react';
import { mockDb } from '@/shared/lib/mock-db';
import { ProductCard } from '@/shared/components/ProductCard';
import { HomeNewsletter } from '@/shared/components/HomeNewsletter';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&q=80';

const PROMO_IMAGE =
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80';

/** 6 catégories visuelles comme sur le mock Shopora */
const HOME_CATEGORIES = [
  {
    nom: 'Mode',
    slug: 'mode',
    href: '/produits?univers=mode',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&q=80',
  },
  {
    nom: 'Robes',
    slug: 'robes',
    href: '/produits?categorie=robes',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&q=80',
  },
  {
    nom: 'Accessoires',
    slug: 'accessoires',
    href: '/produits?categorie=accessoires',
    image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=300&q=80',
  },
  {
    nom: 'Beauté',
    slug: 'beaute',
    href: '/produits?univers=beaute',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&q=80',
  },
  {
    nom: 'Parfums',
    slug: 'parfums',
    href: '/produits?categorie=parfums',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&q=80',
  },
  {
    nom: 'Pommades',
    slug: 'pommades',
    href: '/produits?categorie=pommades',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&q=80',
  },
];

const TRUST_HERO = [
  {
    icon: Truck,
    title: 'Livraison rapide',
    desc: 'Recevez votre commande en 24 à 48h à Conakry.',
  },
  {
    icon: Lock,
    title: 'Paiement 100% sécurisé',
    desc: 'Mobile Money et carte via CinetPay.',
  },
  {
    icon: RotateCcw,
    title: 'Satisfait ou remboursé',
    desc: 'Retours simples sous 7 jours.',
  },
];

const TRUST_ROW = [
  { icon: ShieldCheck, title: 'Qualité garantie' },
  { icon: Sparkles, title: 'Meilleurs prix' },
  { icon: Headphones, title: 'Service client 7j/7' },
  { icon: BadgeCheck, title: 'Retours faciles' },
];

const PARTNER_LOGOS = [
  'Orange Money',
  'MTN MoMo',
  'CinetPay',
  'WhatsApp',
  'Facebook',
  'Instagram',
];

export default async function HomePage() {
  const featuredProducts = mockDb.getProducts().filter((p) => p.featured && p.actif);

  return (
    <div className="animate-fadeIn bg-[#faf7f2]">
      {/* ─── HERO (fond beige, texte gauche, image droite) ───────────────── */}
      <section className="relative bg-[#f5f0e8] pt-10 pb-20 md:pt-14 md:pb-28">
        <div className="container-kabishop">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
            {/* Texte */}
            <div className="order-2 md:order-1 space-y-6 text-center md:text-left">
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.25rem] font-bold leading-[1.15] tracking-tight text-zinc-900">
                Découvrez le meilleur, choisi pour vous.
              </h1>
              <p className="text-sm sm:text-base text-zinc-500 leading-relaxed max-w-md mx-auto md:mx-0">
                Des produits de qualité, sélectionnés avec soin pour vous. Mode et beauté à Conakry,
                livraison rapide et service client disponible 7j/7 sur WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 pt-1">
                <Link
                  href="/produits"
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-zinc-900 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  Découvrir la boutique
                </Link>
                <Link
                  href="/produits?tri=nouveautes"
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-zinc-300 bg-white px-8 py-3.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50"
                >
                  Voir les nouveautés
                </Link>
              </div>
            </div>

            {/* Image + badge promo */}
            <div className="order-1 md:order-2 relative flex justify-center md:justify-end">
              <div className="relative w-full max-w-md aspect-[4/5] sm:aspect-[5/6] rounded-sm overflow-hidden shadow-md">
                <Image
                  src={HERO_IMAGE}
                  alt="Collection KabiShop"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center"
                  priority
                />
              </div>
              <div className="absolute top-4 right-4 md:top-6 md:right-0 lg:-right-4 z-10 flex h-[72px] w-[72px] md:h-20 md:w-20 flex-col items-center justify-center rounded-full bg-zinc-900 text-white text-center shadow-xl">
                <span className="text-[9px] uppercase tracking-wide opacity-80 leading-none">Jusqu&apos;à</span>
                <span className="font-serif text-lg md:text-xl font-bold leading-tight">-30%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barre confiance — chevauche le bas du hero */}
        <div className="container-kabishop relative z-10 -mt-6 md:-mt-10 px-4">
          <div className="mx-auto max-w-4xl rounded-xl border border-white/80 bg-white/95 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div className="grid grid-cols-1 divide-y divide-zinc-100 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
              {TRUST_HERO.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 px-5 py-4 sm:py-5 sm:px-6"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f0e8] text-zinc-700">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-zinc-900">{title}</p>
                    <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CATÉGORIES (cercles) ─────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-20 mt-8 md:mt-12">
        <div className="container-kabishop">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-zinc-900 text-center mb-10 md:mb-12">
            Parcourez nos catégories
          </h2>

          <div className="flex gap-8 md:gap-10 overflow-x-auto pb-4 justify-start md:justify-center scrollbar-hide snap-x snap-mandatory">
            {HOME_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={cat.href}
                className="group flex flex-col items-center gap-3 shrink-0 snap-center w-[88px] sm:w-[100px]"
              >
                <div className="relative h-[88px] w-[88px] sm:h-[100px] sm:w-[100px] rounded-full overflow-hidden border border-[#ebe4d8] shadow-sm transition group-hover:shadow-md group-hover:border-zinc-300">
                  <Image
                    src={cat.image}
                    alt={cat.nom}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="100px"
                  />
                </div>
                <span className="text-xs font-medium text-zinc-700 text-center group-hover:text-zinc-900 transition">
                  {cat.nom}
                </span>
              </Link>
            ))}
          </div>

          {/* Indicateur scroll (points) */}
          <div className="flex justify-center gap-1.5 mt-6">
            <span className="h-1.5 w-6 rounded-full bg-zinc-800" />
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
          </div>
        </div>
      </section>

      {/* ─── PRODUITS PHARES (5 en ligne desktop) ─────────────────────────── */}
      <section className="bg-[#faf7f2] py-14 md:py-18 border-y border-[#ebe4d8]/60">
        <div className="container-kabishop">
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-zinc-900">
              Nos produits phares
            </h2>
            <Link
              href="/produits"
              className="flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition whitespace-nowrap"
            >
              Voir toute la boutique
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
            {featuredProducts.slice(0, 5).map((p, idx) => (
              <ProductCard
                key={p.id}
                slug={p.slug}
                nom={p.nom}
                categorie={p.categorie.nom}
                prix={Number(p.prix)}
                image={p.images[0]}
                featured={false}
                rating={4.5 + (idx % 3) * 0.15}
                reviews={12 + idx * 3}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── BANNIÈRE PROMO (split olive + photo) ─────────────────────────── */}
      <section className="container-kabishop py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-lg overflow-hidden shadow-md min-h-[280px] md:min-h-[320px]">
          <div className="bg-[#4a5240] flex flex-col justify-center p-8 md:p-12 lg:p-14 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-2">
              Offre spéciale
            </p>
            <h3 className="font-serif text-2xl md:text-3xl lg:text-[2rem] font-bold leading-snug mb-4">
              Jusqu&apos;à -30% sur une sélection de produits
            </h3>
            <Link
              href="/produits?promo=1"
              className="inline-flex w-fit items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
            >
              Profiter de l&apos;offre
            </Link>
          </div>
          <div className="relative min-h-[220px] md:min-h-full">
            <Image
              src={PROMO_IMAGE}
              alt="Promotion KabiShop"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute bottom-6 right-6 flex h-[72px] w-[72px] flex-col items-center justify-center rounded-full bg-zinc-900/90 text-white text-center px-2 shadow-lg">
              <span className="text-[8px] uppercase leading-tight opacity-80">Offre limitée</span>
              <span className="text-[10px] font-bold leading-tight mt-0.5">jusqu&apos;au 31/05</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CONFIANCE (4 icônes) ─────────────────────────────────────────── */}
      <section className="border-t border-[#ebe4d8] bg-white py-12 md:py-14">
        <div className="container-kabishop grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
          {TRUST_ROW.map(({ icon: Icon, title }) => (
            <div key={title} className="flex flex-col items-center text-center gap-3 px-2">
              <Icon className="h-7 w-7 text-zinc-700" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-zinc-800">{title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PARTENAIRES / CONFIANCE ──────────────────────────────────────── */}
      <section className="bg-[#faf7f2] py-12 md:py-14 border-t border-[#ebe4d8]/60">
        <div className="container-kabishop">
          <p className="text-center text-sm font-medium text-zinc-500 mb-8">
            Ils nous font confiance
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-14 opacity-50 grayscale">
            {PARTNER_LOGOS.map((name) => (
              <span
                key={name}
                className="font-serif text-lg md:text-xl font-bold text-zinc-600 tracking-tight select-none"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEWSLETTER ───────────────────────────────────────────────────── */}
      <HomeNewsletter />
    </div>
  );
}
