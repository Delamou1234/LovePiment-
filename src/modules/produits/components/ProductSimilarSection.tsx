import React from 'react';
import Link from 'next/link';
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
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-zinc-900">Produits similaires</h2>
          <p className="mt-1 text-sm text-zinc-500">Dans la même catégorie</p>
        </div>
        <Link href="/produits" className="text-sm font-bold text-primary hover:underline">
          Voir tout
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
