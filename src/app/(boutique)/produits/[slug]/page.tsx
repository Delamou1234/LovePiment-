import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import ProductDetailsSection from '@/modules/produits/components/ProductDetailsSection';
import { ProductSimilarSection } from '@/modules/produits/components/ProductSimilarSection';
import { serialiserProduitPourClient } from '@/modules/produits/lib/serialize-product';
import { getCachedProduct } from '@/modules/produits/lib/cached-queries';
import { notFound } from 'next/navigation';
import { ProductReviewsSection } from '@/modules/avis/components/ProductReviewsSection';
import { avisService } from '@/modules/avis/services/review.service';
import { getSession } from '@/shared/lib/auth/session';

type Params = Promise<{ slug: string }>;

export const revalidate = 120;

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { slug } = await params;

  let product;
  try {
    product = await getCachedProduct(slug);
  } catch {
    notFound();
  }

  const productClient = serialiserProduitPourClient(product);

  const [avisStats, avisPage, session] = await Promise.all([
    avisService.statsProduit(product.id),
    avisService.listerAvisProduit(product.id, 1, 10),
    getSession(),
  ]);

  const eligibles =
    session?.id != null
      ? (await avisService.listerEligibles(session.id)).filter((e) => e.productId === product.id)
      : [];

  return (
    <div className="container-kabishop animate-fadeIn py-6 sm:py-8 space-y-12 sm:space-y-16">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-zinc-500 scrollbar-hide whitespace-nowrap">
        <Link href="/" className="hover:text-primary transition font-medium">
          Accueil
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/produits" className="hover:text-primary transition font-medium">
          Catalogue
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href={`/produits?categorie=${productClient.categorie.slug}`}
          className="hover:text-primary transition font-medium"
        >
          {productClient.categorie.nom}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-zinc-800 font-bold line-clamp-1">{productClient.nom}</span>
      </div>

      <ProductDetailsSection product={productClient} avisStats={avisStats} />

      <ProductSimilarSection productId={productClient.id} categorieId={productClient.categorieId} />

      <ProductReviewsSection
        productId={productClient.id}
        productSlug={productClient.slug}
        productNom={productClient.nom}
        initialStats={avisStats}
        initialAvis={avisPage.avis}
        initialTotalPages={avisPage.pagination.totalPages}
        initialEligibles={eligibles}
      />
    </div>
  );
}
