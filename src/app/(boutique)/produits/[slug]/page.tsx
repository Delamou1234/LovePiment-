import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { mockDb } from '@/shared/lib/mock-db';
import ProductDetailsSection from '@/modules/produits/components/ProductDetailsSection';

// ─── PRODUCT DETAILS PAGE (SERVER COMPONENT) ─────────────────────────────────

type Params = Promise<{
  slug: string;
}>;

export default async function ProductDetailPage({
  params,
}: {
  params: Params;
}) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  // Récupérer le produit
  const product = mockDb.getProductBySlug(slug);

  // Si le produit n'existe pas → 404
  if (!product) {
    notFound();
  }

  // Récupérer les produits similaires (même catégorie, max 4)
  const similarProducts = mockDb
    .getProducts()
    .filter((p) => p.categorieId === product.categorieId && p.actif && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="container-kabishop py-8 space-y-16 animate-fadeIn">
      {/* ─── FIL D'ARIANE / BREADCRUMB ────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Link href="/" className="hover:text-primary transition font-medium">Accueil</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/produits" className="hover:text-primary transition font-medium">Catalogue</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/produits?categorie=${product.categorie.slug}`} className="hover:text-primary transition font-medium">
          {product.categorie.nom}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-zinc-800 font-bold line-clamp-1">{product.nom}</span>
      </div>

      {/* ─── DÉTAILS DU PRODUIT (CLIENT CONTAINER) ───────────────────────── */}
      <ProductDetailsSection product={product} />

      {/* ─── PRODUITS SIMILAIRES ─────────────────────────────────────────── */}
      {similarProducts.length > 0 && (
        <div className="space-y-6 pt-12 border-t border-zinc-100">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-zinc-900">Articles Similaires</h2>
              <p className="text-sm text-zinc-500">Vous aimerez peut-être aussi ces modèles</p>
            </div>
            <Link href={`/produits?categorie=${product.categorie.slug}`} className="flex items-center gap-1 text-sm font-bold text-primary hover:text-primary-dark transition">
              Voir la collection <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="products-grid">
            {similarProducts.map((p) => {
              const formattedPrice = Number(p.prix).toLocaleString('fr-FR') + ' GN';
              return (
                <Link 
                  key={p.id} 
                  href={`/produits/${p.slug}`} 
                  className="product-card group flex flex-col h-full bg-white border border-zinc-100 rounded-2xl overflow-hidden hover:shadow-lg transition duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-[3/4] w-full bg-zinc-50 overflow-hidden">
                    <Image
                      src={p.images[0]}
                      alt={p.nom}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover object-center group-hover:scale-105 transition duration-500"
                    />
                  </div>

                  {/* Détails */}
                  <div className="flex flex-col flex-grow p-4 space-y-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                      {p.categorie.nom}
                    </span>
                    <h3 className="font-bold text-zinc-800 text-sm md:text-base leading-snug line-clamp-1 group-hover:text-primary transition duration-200">
                      {p.nom}
                    </h3>
                    <div className="flex items-center justify-between pt-2 mt-auto">
                      <span className="price-display">{formattedPrice}</span>
                      <span className="text-xs font-bold text-primary bg-primary/5 rounded-full px-2.5 py-1 border border-primary/10">
                        Détails
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
