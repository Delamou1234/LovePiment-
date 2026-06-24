import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Flame, HeartHandshake, Package, Sparkles, Star } from 'lucide-react';
import type { CategorieVitrine } from '@/modules/produits/lib/category-showcase';

const TRUST_ITEMS = [
  { icon: Package, label: 'Discrétion', suffix: 'garantie' },
  { icon: Star, label: 'Qualité', suffix: 'premium' },
  { icon: HeartHandshake, label: 'Satisfaction', suffix: 'assurée' },
] as const;

const HERO_IMAGE = '/images/hero-love-piment.png';

type Props = {
  categories?: CategorieVitrine[];
};

export function LandingHero({ categories = [] }: Props) {
  const quickLinks = (categories.length > 0 ? categories : []).slice(0, 4);

  return (
    <section className="lp-hero" aria-labelledby="lp-hero-title">
      <div className="lp-hero-media" aria-hidden>
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="lp-hero-photo"
        />
        <div className="lp-hero-gradient" />
        <div className="lp-hero-glow lp-hero-glow--pink" />
        <div className="lp-hero-glow lp-hero-glow--violet" />
        <div className="lp-hero-noise" />
      </div>

      <div className="lp-hero-decor" aria-hidden>
        <span className="lp-hero-heart lp-hero-heart--1">♥</span>
        <span className="lp-hero-heart lp-hero-heart--2">♡</span>
        <span className="lp-hero-heart lp-hero-heart--3">♥</span>
        <Flame className="lp-hero-flame" strokeWidth={1.5} />
      </div>

      <div className="lp-hero-badge" aria-label="Plus de 1000 clientes satisfaites">
        <p className="font-serif text-2xl font-bold leading-none text-white">+1000</p>
        <p className="mt-1.5 max-w-[7rem] text-[11px] font-medium leading-snug text-white/90">
          clientes satisfaites
        </p>
        <span className="lp-hero-badge-heart" aria-hidden>
          ♡
        </span>
      </div>

      <div className="container-shop lp-hero-inner">
        <div className="lp-hero-grid">
          <div className="lp-hero-copy">
            <p className="lp-hero-eyebrow">
              <Sparkles className="h-3.5 w-3.5 text-[#ff6eb4]" strokeWidth={2} />
              Boutique intime · Conakry
            </p>

            <p className="lp-hero-tagline">
              Votre <span className="text-[#ff6eb4] font-semibold">plaisir</span>, votre bien-être,{' '}
              <span className="font-script text-[#ff5ca8]">votre pouvoir</span>
              <span className="text-[#ff6eb4]" aria-hidden>
                {' '}
                ♡
              </span>
            </p>

            <h1 id="lp-hero-title" className="lp-hero-title">
              Révélez votre{' '}
              <span className="lp-hero-title-script">plaisir</span>
            </h1>

            <p className="lp-hero-desc">
              Sextoys, lingerie, lubrifiants et accessoires pour adultes — livraison discrète,
              paiement Mobile Money et conseil confidentiel.
            </p>

            <ul className="lp-hero-trust">
              {TRUST_ITEMS.map(({ icon: Icon, label, suffix }) => (
                <li key={label}>
                  <span className="lp-hero-trust-icon">
                    <Icon className="h-4 w-4 text-[#ff6eb4]" strokeWidth={1.6} />
                  </span>
                  <span>
                    <strong>{label}</strong> {suffix}
                  </span>
                </li>
              ))}
            </ul>

            <div className="lp-hero-actions">
              <Link href="/produits" className="lp-hero-btn-primary">
                Découvrir la boutique
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
              <Link href="/promos" className="lp-hero-btn-ghost">
                Voir les promos
              </Link>
            </div>

            {quickLinks.length > 0 && (
              <div className="lp-hero-chips">
                {quickLinks.map((cat) => (
                  <Link
                    key={cat.slug + cat.nom}
                    href={`/produits?categorie=${cat.slug}`}
                    className="lp-hero-chip"
                  >
                    {cat.nom}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="lp-hero-visual" aria-hidden>
            <div className="lp-hero-visual-ring" />
            <div className="lp-hero-visual-card">
              <Image
                src={HERO_IMAGE}
                alt=""
                width={420}
                height={520}
                className="lp-hero-visual-img"
                priority
              />
            </div>
            <p className="lp-hero-visual-caption">
              <span>Love Piment&</span>
              Osez le plaisir, en toute discrétion
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
