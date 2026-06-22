import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '@/shared/components/ProductCard';
import { variantePourCarte } from '@/shared/lib/product-card';
import { getCachedSimilarProducts } from '@/modules/produits/lib/cached-queries';

type Props = {
  productId: string;
  categorieId: string;
};

export async function ProductSimilarSection({ productId, categorieId }: Props) {
  const similaires = await getCachedSimilarProducts(productId, categorieId);

  if (similaires.length === 0) return null;

  return (
    <section className="border-t border-beige-border/70 pt-12 md:pt-16">
      <div className="product-section-head flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="product-section-eyebrow">Vous aimerez aussi</p>
          <h2 className="product-section-title">Produits similaires</h2>
          <p className="mt-2 text-sm text-zinc-500">Dans la même collection</p>
        </div>
        <Link
          href="/produits"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-olive transition hover:text-olive-dark"
        >
          Toute la boutique
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="products-grid">
        {similaires.map((p) => (
          <ProductCard
            key={p.id}
            id={p.id}
            slug={p.slug}
            nom={p.nom}
            categorie={p.categorie.nom}
            prix={Number(p.prix)}
            image={p.images[0]}
            featured={p.featured}
            variante={variantePourCarte(p.id, Number(p.prix), p.variantes?.[0])}
          />
        ))}
      </div>
    </section>
  );
}
