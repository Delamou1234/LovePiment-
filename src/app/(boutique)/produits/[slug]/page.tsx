import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import ProductDetailsSection from '@/modules/produits/components/ProductDetailsSection';
import { ProductSimilarSection } from '@/modules/produits/components/ProductSimilarSection';
import { serialiserProduitPourClient } from '@/modules/produits/lib/serialize-product';
import { productService } from '@/modules/produits/services/product.service';
import { notFound } from 'next/navigation';
import { ProductAiRecommendationsLazy } from '@/modules/ia/components/ProductAiRecommendationsLazy';
import { ProductReviewsSection } from '@/modules/avis/components/ProductReviewsSection';
import { avisService } from '@/modules/avis/services/review.service';

type Params = Promise<{ slug: string }>;

export const revalidate = 120;

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { slug } = await params;

  let product;
  try {
    product = await productService.obtenirProduit(slug);
  } catch {
    notFound();
  }

  const productClient = serialiserProduitPourClient(product);
  const avisStats = await avisService.statsProduit(product.id);

  return (
    <div className="container-kabishop py-8 space-y-16 animate-fadeIn">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
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
      />

      <ProductAiRecommendationsLazy productId={productClient.id} categorieId={productClient.categorieId} />
    </div>
  );
}
