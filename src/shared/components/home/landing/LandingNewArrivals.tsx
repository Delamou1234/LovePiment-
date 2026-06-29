import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
  LandingProductCard,
  type LandingProduct,
} from '@/shared/components/home/landing/LandingFeaturedProducts';

export function LandingNewArrivals({ products }: { products: LandingProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="lp-new-arrivals" aria-labelledby="lp-new-arrivals-title">
      <div className="container-shop">
        <div className="lp-new-arrivals-head">
          <div>
            <span className="lp-new-arrivals-badge">
              <Sparkles className="h-3.5 w-3.5" />
              Fraîchement ajoutés
            </span>
            <h2 id="lp-new-arrivals-title" className="lp-new-arrivals-title">
              Les{' '}
              <span className="text-olive underline decoration-olive/30 decoration-2 underline-offset-4">
                nouveautés
              </span>
            </h2>
            <p className="lp-new-arrivals-lead">
              Découvrez nos derniers arrivages — sélectionnés pour éveiller vos sens en toute discrétion.
            </p>
          </div>
          <Link href="/produits?tri=nouveautes" className="lp-new-arrivals-link">
            Toutes les nouveautés
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {products.slice(0, 4).map((p) => (
            <LandingProductCard key={p.id} product={p} isNew />
          ))}
        </div>
      </div>
    </section>
  );
}
