import Link from 'next/link';
import { ArrowRight, Lock, ShoppingBag } from 'lucide-react';

export function LandingFinalCTA() {
  return (
    <section className="lp-final-cta" aria-labelledby="lp-final-cta-title">
      <div className="container-shop">
        <div className="lp-final-cta-inner">
          <div className="lp-final-cta-glow" aria-hidden />
          <p className="lp-final-cta-eyebrow">
            <Lock className="h-3.5 w-3.5" />
            Commande 100 % confidentielle
          </p>
          <h2 id="lp-final-cta-title" className="lp-final-cta-title">
            Prête à vous faire plaisir ?
          </h2>
          <p className="lp-final-cta-desc">
            Parcourez notre catalogue, ajoutez à votre panier et recevez votre colis en toute discrétion
            à Conakry — en 24 à 48 h.
          </p>
          <div className="lp-final-cta-actions">
            <Link href="/produits" className="lp-final-cta-btn-primary">
              <ShoppingBag className="h-4 w-4" />
              Explorer la boutique
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="lp-final-cta-btn-ghost">
              Besoin d&apos;un conseil ?
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
