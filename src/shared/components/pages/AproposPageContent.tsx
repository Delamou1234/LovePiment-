import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Gem,
  Headset,
  Heart,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { AproposIconKey, AproposPublicConfig } from '@/modules/marketing/types/apropos';
import type { LivraisonConfig } from '@/shared/lib/shipping';
import { formaterPrixGN } from '@/shared/lib/shipping';
import { getShopPhoneDisplay, getShopTelHref } from '@/shared/lib/shop-contact';

const ICON_MAP: Record<AproposIconKey, LucideIcon> = {
  'badge-check': BadgeCheck,
  truck: Truck,
  'shield-check': ShieldCheck,
  heart: Heart,
  sparkles: Sparkles,
  users: Users,
  gem: Gem,
  headset: Headset,
};

type Props = {
  apropos: AproposPublicConfig;
  livraison: LivraisonConfig;
};

function paragraphs(text: string) {
  return text.split(/\n\s*\n/).filter(Boolean);
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="apropos-section-label">{children}</p>;
}

export function AproposPageContent({ apropos, livraison }: Props) {
  const telHref = getShopTelHref();
  const phoneDisplay = getShopPhoneDisplay();
  const seuilGratuitLabel = formaterPrixGN(livraison.seuilGratuit);
  const delaiLabel = livraison.delaiLabel ?? '24–48 h';

  const livraisonHint = livraison.gratuiteActive
    ? `Livraison ${delaiLabel} — offerte dès ${seuilGratuitLabel} à ${livraison.villeParDefaut}`
    : `Livraison ${delaiLabel} à ${livraison.villeParDefaut}`;

  return (
    <div className="animate-fadeIn bg-[#0a0508]">
      {/* Hero */}
      <section className="apropos-hero relative overflow-hidden">
        <div className="apropos-hero-glow" aria-hidden />
        <div className="container-shop relative z-10 apropos-section apropos-section--hero">
          <div className="mx-auto max-w-2xl text-center lg:max-w-3xl">
            <p className="apropos-eyebrow">{apropos.heroKicker}</p>
            <h1 className="mt-4 font-serif text-3xl font-bold leading-[1.15] text-white md:text-[2.75rem] lg:text-5xl">
              {apropos.heroTitre}{' '}
              <span className="text-olive">{apropos.heroAccent}</span>
            </h1>
            <p className="mt-6 text-base leading-[1.8] text-white/75 md:text-lg">
              {apropos.heroTexte}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/produits" className="apropos-btn-primary">
                Découvrir la boutique
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contact" className="apropos-btn-ghost">
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Chiffres clés */}
      <section className="apropos-section apropos-section--stats">
        <div className="container-shop">
          <ul className="apropos-stats-grid">
            {apropos.chiffres.map((chiffre) => (
              <li key={`${chiffre.value}-${chiffre.label}`} className="apropos-stat-card">
                <p className="apropos-stat-value">{chiffre.value}</p>
                <p className="apropos-stat-label">{chiffre.label}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Mission */}
      <section className="apropos-section apropos-section--mission">
        <div className="container-shop mx-auto max-w-2xl text-center">
          <SectionLabel>Notre mission</SectionLabel>
          <h2 className="mt-3 font-serif text-2xl font-bold text-white md:text-3xl lg:text-[2rem]">
            {apropos.missionTitre}
          </h2>
          <p className="mt-6 text-base leading-[1.85] text-white/70 md:text-lg">
            {apropos.missionTexte}
          </p>
        </div>
      </section>

      {/* Histoire */}
      <section className="apropos-section">
        <div className="container-shop mx-auto max-w-2xl">
          <SectionLabel>Qui sommes-nous</SectionLabel>
          <h2 className="mt-3 font-serif text-2xl font-bold text-white md:text-3xl">
            {apropos.histoireTitre}
          </h2>
          <div className="mt-8 space-y-6 text-base leading-[1.85] text-white/70">
            {paragraphs(apropos.histoireTexte).map((p) => (
              <p key={p.slice(0, 48)}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className="apropos-section apropos-section--valeurs">
        <div className="container-shop">
          <div className="mx-auto max-w-2xl text-center">
            <SectionLabel>Nos engagements</SectionLabel>
            <h2 className="mt-3 font-serif text-2xl font-bold text-white md:text-3xl">
              Ce qui nous guide
            </h2>
          </div>
          <ul className="apropos-values-grid">
            {apropos.valeurs.map(({ icon, title, text }) => {
              const Icon = ICON_MAP[icon] ?? Heart;
              return (
                <li key={title} className="apropos-value-card">
                  <div className="apropos-value-icon">
                    <Icon className="h-5 w-5" strokeWidth={1.65} />
                  </div>
                  <h3 className="font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-[1.75] text-white/62">{text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="apropos-cta apropos-section apropos-section--cta">
        <div className="container-shop mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/85">
            <MapPin className="h-3.5 w-3.5 text-olive" />
            {livraison.villeParDefaut}, Guinée
          </div>
          <h2 className="font-serif text-2xl font-bold text-white md:text-3xl">
            {apropos.ctaTitre}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-[1.8] text-white/82">
            {apropos.ctaTexte}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-white/75">
            <span className="apropos-trust-pill">
              <Users className="h-3.5 w-3.5" />
              Équipe locale, réactive
            </span>
            <span className="apropos-trust-pill">
              <Truck className="h-3.5 w-3.5" />
              {livraisonHint}
            </span>
          </div>

          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link href="/promos" className="apropos-cta-btn-light">
              Voir les promos
            </Link>
            <Link href="/produits" className="apropos-cta-btn-outline">
              Toute la boutique
            </Link>
            <a
              href={telHref}
              className="apropos-cta-btn-outline inline-flex items-center justify-center gap-2"
            >
              <Phone className="h-4 w-4" />
              {phoneDisplay}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
