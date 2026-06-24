import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { PromoProduitEnrichi } from '@/modules/produits/services/promos-page.service';

const IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80';

type Props = {
  produits: PromoProduitEnrichi[];
};

export function PromoSpotlightStrip({ produits }: Props) {
  if (produits.length === 0) return null;

  const featured = [...produits]
    .sort((a, b) => b.remisePct - a.remisePct)
    .slice(0, 6);

  return (
    <section className="shop-promos-spotlight" aria-label="Meilleures promotions">
      <div className="shop-promos-panel-head">
        <h2>Meilleures offres</h2>
        <span className="shop-promos-spotlight-hint">Triées par remise</span>
      </div>
      <div className="shop-promos-spotlight-scroll">
        {featured.map((p) => {
          const prix = p.prixPromoNum ?? p.prixNum;
          return (
            <Link
              key={p.id}
              href={`/produits/${p.slug}`}
              className="shop-promos-spotlight-card"
            >
              <div className="shop-promos-spotlight-thumb">
                <Image
                  src={p.images[0] || IMAGE_FALLBACK}
                  alt={p.nom}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                {p.remisePct > 0 && (
                  <span className="shop-promos-spotlight-badge">−{p.remisePct}%</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="shop-promos-spotlight-name">{p.nom}</p>
                <p className="shop-promos-spotlight-price">{prix.toLocaleString('fr-FR')} GN</p>
                {p.prixPromoNum != null && p.prixPromoNum < p.prixNum && (
                  <p className="shop-promos-spotlight-old">
                    {p.prixNum.toLocaleString('fr-FR')} GN
                  </p>
                )}
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-zinc-300" strokeWidth={1.75} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
