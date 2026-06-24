'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShoppingBag, Star } from 'lucide-react';
import { useState } from 'react';
import { creerItemPanier, usePanier } from '@/store/panier';
import type { ProductCardVariant } from '@/shared/lib/product-card';

export type LandingProduct = {
  id: string;
  slug: string;
  nom: string;
  prix: number;
  prixPromo?: number | null;
  image?: string | null;
  rating?: number;
  reviews?: number;
  variante?: ProductCardVariant | null;
  featured?: boolean;
};

function LandingProductCard({
  product,
  isNew,
}: {
  product: LandingProduct;
  isNew?: boolean;
}) {
  const panier = usePanier();
  const [busy, setBusy] = useState(false);
  const enPromo = product.prixPromo != null && product.prixPromo < product.prix;
  const prixAffiche = enPromo ? product.prixPromo! : product.prix;
  const remisePct = enPromo ? Math.round((1 - product.prixPromo! / product.prix) * 100) : 0;
  const canAdd = Boolean(product.variante && product.variante.stock > 0);

  const handleAdd = () => {
    if (!product.variante || busy) return;
    setBusy(true);
    panier.ajouterItem(
      creerItemPanier({
        variantId: product.variante.variantId,
        productId: product.variante.productId,
        nomProduit: product.nom,
        slug: product.slug,
        image: product.image ?? '',
        prixProduit: product.prix,
        prixVariante: product.variante.prix,
        taille: product.variante.taille,
        couleur: product.variante.couleur,
        quantite: 1,
      }),
    );
    panier.ouvrirPanier();
    setBusy(false);
  };

  const productHref = `/produits/${product.slug}`;

  return (
    <article className="lp-product-card group relative flex flex-col">
      <div className="p-4 pb-12">
        <Link
          href={productHref}
          className="relative mb-3 block aspect-square overflow-hidden rounded-lg bg-zinc-50 cursor-pointer"
          aria-label={`Voir les détails — ${product.nom}`}
        >
          {isNew && (
            <span className="absolute left-2 top-2 z-10 rounded bg-olive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white pointer-events-none">
              Nouveau
            </span>
          )}
          {enPromo && !isNew && (
            <span className="absolute left-2 top-2 z-10 rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-white pointer-events-none">
              -{remisePct}%
            </span>
          )}
          {product.image ? (
            <Image
              src={product.image}
              alt={product.nom}
              fill
              sizes="(max-width:768px) 50vw, 25vw"
              className="object-contain p-4 transition duration-300 group-hover:scale-105"
              unoptimized={product.image.startsWith('/')}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-zinc-400">Image</div>
          )}
        </Link>

        <Link href={productHref} className="block space-y-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 transition group-hover:text-olive">
            {product.nom}
          </h3>

          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < Math.round(product.rating ?? 5) ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'}`}
              />
            ))}
            <span className="ml-1 text-[11px] text-zinc-400">({product.reviews ?? 0})</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-zinc-900">
              {prixAffiche.toLocaleString('fr-FR')} GN
            </span>
            {enPromo && (
              <span className="text-sm text-zinc-400 line-through">
                {product.prix.toLocaleString('fr-FR')} GN
              </span>
            )}
          </div>
        </Link>
      </div>

      <button
        type="button"
        disabled={!canAdd || busy}
        onClick={handleAdd}
        className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-olive text-white shadow-md transition hover:bg-olive-dark disabled:opacity-40"
        aria-label={`Ajouter ${product.nom} au panier`}
      >
        <ShoppingBag className="h-4 w-4" />
      </button>
    </article>
  );
}

export function LandingFeaturedProducts({ products }: { products: LandingProduct[] }) {
  return (
    <section className="bg-white py-14 md:py-16">
      <div className="container-shop">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="font-serif text-2xl font-bold text-zinc-900 md:text-3xl">
            Produits{' '}
            <span className="text-olive underline decoration-olive/30 decoration-2 underline-offset-4">
              Vedettes
            </span>
          </h2>
          <Link
            href="/produits"
            className="inline-flex items-center gap-2 rounded-full border-2 border-olive px-5 py-2 text-xs font-bold uppercase tracking-[0.1em] text-olive transition hover:bg-olive hover:text-white"
          >
            Voir toute la boutique
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">Catalogue en cours de mise à jour.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {products.slice(0, 4).map((p, idx) => (
              <LandingProductCard key={p.id} product={p} isNew={idx === 0 || Boolean(p.featured)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
