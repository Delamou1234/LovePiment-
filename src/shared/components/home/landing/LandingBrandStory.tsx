import Link from 'next/link';
import { ArrowRight, Heart, Shield } from 'lucide-react';
import { LandingBrandStorySlides } from './LandingBrandStorySlides';

export function LandingBrandStory() {
  return (
    <section className="lp-brand-story" aria-labelledby="lp-brand-story-title">
      <div className="container-shop">
        <div className="lp-brand-story-grid">
          <div className="lp-brand-story-visual">
            <LandingBrandStorySlides />
            <div className="lp-brand-story-float" aria-hidden>
              <Shield className="h-5 w-5 text-[#e91e8c]" />
              <span>100 % discret</span>
            </div>
          </div>

          <div className="lp-brand-story-copy">
            <p className="lp-brand-story-eyebrow">Notre univers</p>
            <h2 id="lp-brand-story-title" className="lp-brand-story-title">
              Le plaisir féminin,{' '}
              <span className="text-olive">sans tabou</span>
            </h2>
            <p className="lp-brand-story-text">
              Love Piment& est la première boutique intime pensée pour les femmes de Conakry : stimulateurs,
              lingerie, lubrifiants et accessoires sélectionnés avec soin. Chaque commande est emballée
              dans un colis neutre, livrée rapidement et traitée avec la plus grande confidentialité.
            </p>
            <ul className="lp-brand-story-points">
              <li>
                <Heart className="h-4 w-4 shrink-0 text-[#e91e8c]" strokeWidth={1.75} />
                Matériaux body-safe et marques de confiance
              </li>
              <li>
                <Heart className="h-4 w-4 shrink-0 text-[#e91e8c]" strokeWidth={1.75} />
                Conseils bienveillants par WhatsApp, 7j/7
              </li>
              <li>
                <Heart className="h-4 w-4 shrink-0 text-[#e91e8c]" strokeWidth={1.75} />
                Paiement Mobile Money ou à la livraison
              </li>
            </ul>
            <div className="lp-brand-story-actions">
              <Link href="/apropos" className="lp-brand-story-btn-primary">
                Notre histoire
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/inscription" className="lp-brand-story-btn-ghost">
                Créer mon compte
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
