import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import ProductDetailsSection from '@/modules/produits/components/ProductDetailsSection';
import { serialiserProduitPourClient } from '@/modules/produits/lib/serialize-product';
import { getCachedProduct, getCachedSimilarProducts } from '@/modules/produits/lib/cached-queries';
import { notFound } from 'next/navigation';
import { ProductReviewsSection } from '@/modules/avis/components/ProductReviewsSection';
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
      <header className="border-b border-beige-border/60 bg-white/80 backdrop-blur-sm">
        <div className="container-kabishop py-4 md:py-5">
          <nav className="catalog-breadcrumb" aria-label="Fil d'Ariane">
            <Link href="/">Accueil</Link>
            <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
            <Link href="/produits">Boutique</Link>
            <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
            <Link href={`/produits?categorie=${productClient.categorie.slug}`}>
              {productClient.categorie.nom}
            </Link>
            <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
            <span className="max-w-[10rem] truncate text-zinc-600 sm:max-w-md">{productClient.nom}</span>
          </nav>
        </div>
      </header>

      <div className="container-kabishop space-y-12 py-6 md:space-y-16 md:py-10 lg:py-12">
        <ProductDetailsSection
          product={productClient}
          avisStats={avisStats}
          similaires={similaires}
        />

        <div id="avis-clients">
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
