import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Gem, Heart, Star } from 'lucide-react';

const HERO_IMAGE = '/images/image_head.png';

const TRUST_ITEMS = [
  { icon: Gem, label: 'Discrétion', suffix: 'garantie' },
  { icon: Star, label: 'Qualité', suffix: 'premium' },
  { icon: Heart, label: 'Satisfaction', suffix: 'assurée' },
] as const;

type LandingHeroProps = {
  /** Ex. « +1200 » */
  clientesSatisfaites: string;
  /** Valeur brute pour l’accessibilité */
  clientesCount: number;
};

export function LandingHero({
  clientesSatisfaites,
  clientesCount,
}: LandingHeroProps) {
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
        <div className="lp-hero-visual-fade" />
      </div>

      <div className="lp-hero-split">
        <div className="lp-hero-panel lp-hero-panel--copy">
          <div className="lp-hero-inner">
            <p className="lp-hero-tagline">
              <Heart className="h-3.5 w-3.5 shrink-0 fill-[#e91e8c] text-[#e91e8c]" strokeWidth={0} />
              Votre plaisir, votre bien-être, votre pouvoir.
            </p>

            <h1 id="lp-hero-title" className="lp-hero-title">
              Révélez votre
              <span className="lp-hero-title-script">
                plaisir
                <span className="lp-hero-title-heart" aria-hidden>
                  ♡
                </span>
              </span>
            </h1>

            <p className="lp-hero-desc">
              Découvrez notre sélection exclusive de stimulateurs et accessoires pour femmes.
            </p>

            <ul className="lp-hero-trust">
              {TRUST_ITEMS.map(({ icon: Icon, label, suffix }) => (
                <li key={label}>
                  <span className="lp-hero-trust-icon">
                    <Icon className="h-4 w-4 text-[#e91e8c]" strokeWidth={1.6} />
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
            </div>
          </div>
        </div>

        <div className="lp-hero-panel lp-hero-panel--visual" aria-hidden>
          <div
            className="lp-hero-badge"
            aria-label={`Plus de ${clientesCount || 1000} clientes satisfaites`}
          >
            <span className="lp-hero-badge-value">{clientesSatisfaites}</span>
            <span className="lp-hero-badge-label">
              clientes satisfaites
              <Heart className="lp-hero-badge-heart fill-[#e91e8c] text-[#e91e8c]" strokeWidth={0} aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
