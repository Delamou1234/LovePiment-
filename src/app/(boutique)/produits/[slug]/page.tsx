import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import ProductDetailsSection from '@/modules/produits/components/ProductDetailsSection';
import { serialiserProduitPourClient } from '@/modules/produits/lib/serialize-product';
import { getCachedProduct, getCachedSimilarProducts } from '@/modules/produits/lib/cached-queries';
import { notFound } from 'next/navigation';
import { ProductReviewsSection } from '@/modules/avis/components/ProductReviewsSection';
import { ProductAiRecommendationsLazy } from '@/modules/ia/components/ProductAiRecommendationsLazy';
import { avisService } from '@/modules/avis/services/review.service';
import { getSession } from '@/shared/lib/auth/session';

type Params = Promise<{ slug: string }>;

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { slug } = await params;

  let product;
  try {
    product = await getCachedProduct(slug);
  } catch {
    notFound();
  }

  const productClient = serialiserProduitPourClient(product);

  const [avisStats, avisPage, session, similairesRaw] = await Promise.all([
    avisService.statsProduit(product.id),
    avisService.listerAvisProduit(product.id, 1, 10),
    getSession(),
    getCachedSimilarProducts(product.id, product.categorieId),
  ]);

  const similaires = similairesRaw.map((p) => ({
    slug: p.slug,
    nom: p.nom,
    image: p.images[0] ?? '',
  }));

  const eligibles =
    session?.id != null
      ? (await avisService.listerEligibles(session.id)).filter((e) => e.productId === product.id)
      : [];

  return (
    <div className="product-detail-page animate-fadeIn">
      <div className="container-shop product-detail-inner">
        <nav className="product-detail-breadcrumb" aria-label="Fil d'Ariane">
          <Link href="/">Accueil</Link>
          <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
          <Link href="/produits">Boutique</Link>
          <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
          <Link href={`/produits?categorie=${productClient.categorie.slug}`}>
            {productClient.categorie.nom}
          </Link>
          <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
          <span className="product-detail-breadcrumb-current">{productClient.nom}</span>
        </nav>

        <ProductDetailsSection
          product={productClient}
          avisStats={avisStats}
          similaires={similaires}
        />

        <ProductAiRecommendationsLazy
          productId={productClient.id}
          categorieId={productClient.categorie.id}
        />

        <div id="avis-clients" className="product-reviews-wrap">
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
      </div>
    </div>
  );
}
