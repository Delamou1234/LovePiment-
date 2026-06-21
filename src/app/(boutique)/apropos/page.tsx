import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BadgeCheck,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'À propos — KabiShop',
  description:
    'KabiShop, boutique de parfums et huiles à Conakry. Authenticité, livraison rapide et paiement Mobile Money.',
};

const VALEURS = [
  {
    icon: BadgeCheck,
    title: 'Produits authentiques',
    text: 'Parfums et huiles sélectionnés avec soin, sans contrefaçon.',
  },
  {
    icon: Truck,
    title: 'Livraison Conakry',
    text: 'Expédition sous 24 à 48 h dans la capitale et environs.',
  },
  {
    icon: ShieldCheck,
    title: 'Paiement sécurisé',
    text: 'Orange Money, MTN MoMo, CinetPay ou espèces à la livraison.',
  },
  {
    icon: Heart,
    title: 'Service humain',
    text: 'WhatsApp, messagerie instantanée et équipe à l’écoute 7j/7.',
  },
];

const CHIFFRES = [
  { value: '500+', label: 'Clients satisfaits' },
  { value: '24–48h', label: 'Délai livraison' },
  { value: '100%', label: 'Produits vérifiés' },
  { value: '7j/7', label: 'Support client' },
];

export default function AProposPage() {
  return (
    <div className="animate-fadeIn bg-[#faf7f2]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#ebe4d8]/60 bg-white">
        <div className="container-kabishop py-14 md:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#4a5240] mb-3">
                Notre histoire
              </p>
              <h1 className="font-serif text-3xl md:text-5xl font-bold text-zinc-900 leading-tight">
                L&apos;excellence olfactive,{' '}
                <span className="text-[#4a5240]">livrée à Conakry</span>
              </h1>
              <p className="mt-5 text-base md:text-lg text-zinc-600 leading-relaxed max-w-xl">
                KabiShop est née d&apos;une passion pour les parfums orientaux et les huiles
                corporelles & capillaires de qualité. Nous rendons ces produits accessibles aux
                Guinéens avec un service fiable, transparent et chaleureux.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/produits"
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-[#4a5240] transition"
                >
                  Découvrir la boutique
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-[#ebe4d8] bg-white px-6 py-3 text-sm font-semibold text-zinc-800 hover:bg-[#faf7f2] transition"
                >
                  Nous contacter
                </Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=900&q=85&auto=format&fit=crop"
                alt="Parfums et huiles KabiShop"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Chiffres */}
      <section className="container-kabishop py-12 md:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {CHIFFRES.map(({ value, label }) => (
            <div
              key={label}
              className="rounded-2xl border border-[#ebe4d8] bg-white px-5 py-6 text-center shadow-sm"
            >
              <p className="text-2xl md:text-3xl font-bold text-[#4a5240]">{value}</p>
              <p className="text-xs md:text-sm text-zinc-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="bg-white border-y border-[#ebe4d8]/60 py-14 md:py-20">
        <div className="container-kabishop max-w-3xl mx-auto text-center">
          <Sparkles className="h-8 w-8 text-[#4a5240] mx-auto mb-4" />
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-zinc-900">
            Notre mission
          </h2>
          <p className="mt-4 text-zinc-600 leading-relaxed">
            Offrir à Conakry une expérience d&apos;achat en ligne simple et rassurante : catalogue
            clair, conseils personnalisés (y compris via notre assistant IA), suivi de commande en
            temps réel et plusieurs options de paiement adaptées au marché local.
          </p>
        </div>
      </section>

      {/* Valeurs */}
      <section className="container-kabishop py-14 md:py-20">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-zinc-900 text-center mb-10">
          Ce qui nous distingue
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALEURS.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-[#ebe4d8] bg-white p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef0eb] text-[#4a5240] mb-4">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-semibold text-zinc-900">{title}</h3>
              <p className="text-sm text-zinc-600 mt-2 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Localisation & livraison */}
      <section className="bg-[#4a5240] text-white py-14 md:py-20">
        <div className="container-kabishop grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <div className="flex items-center gap-2 text-white/80 mb-3">
              <MapPin className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wider">Conakry, Guinée</span>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold">
              Une boutique pensée pour vous
            </h2>
            <p className="mt-4 text-white/80 leading-relaxed">
              Livraison offerte dès 500&nbsp;000 GN à Conakry. Paiement à la livraison possible :
              le livreur encaisse sur place et confirme le règlement — votre commande est alors
              enregistrée dans notre système.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/90">
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0" />
                Équipe locale, réactive sur WhatsApp
              </li>
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 shrink-0" />
                Suivi de livraison en direct
              </li>
            </ul>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/20 p-6 md:p-8 backdrop-blur-sm">
            <p className="text-lg font-semibold mb-4">Prêt à commander ?</p>
            <p className="text-sm text-white/75 mb-6">
              Parcourez nos collections parfums, huiles corps et capillaires, ou profitez de nos
              promotions en cours.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/promos"
                className="inline-flex justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-[#4a5240] hover:bg-[#faf7f2] transition"
              >
                Voir les promos
              </Link>
              <Link
                href="/produits"
                className="inline-flex justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                Toute la boutique
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
