'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePanier, creerItemPanier } from '@/store/panier';
import { trackEvent } from '@/shared/hooks/useTracking';
import { trackViewedProduct } from '@/shared/hooks/useViewedProducts';
import { getAppUrl } from '@/shared/lib/app-url';
import { CartToast } from '@/shared/components/CartToast';
import { ProductImageGallery } from './ProductImageGallery';
import { useProductStock } from '../hooks/useProductStock';
import {
  ShoppingCart,
  MessageCircle,
  AlertTriangle,
  Truck,
  ShieldCheck,
  RotateCcw,
  Zap,
  Tag,
  RefreshCw,
  Barcode,
} from 'lucide-react';
import type { ProduitClient } from '../lib/serialize-product';
import type { StockVarianteClient } from '../types';
import {
  calculerRemisePct,
  estPromoActive,
  formaterDatePromo,
} from '../lib/promo';
import { StarRating } from '@/modules/avis/components/StarRating';
import type { AvisProduitStats } from '@/modules/avis/types';

interface ProductDetailsSectionProps {
  product: ProduitClient;
  avisStats?: AvisProduitStats;
}

function toStockVariantes(product: ProduitClient): StockVarianteClient[] {
  return product.variantes.map((v) => ({
    id: v.id,
    taille: v.taille,
    couleur: v.couleur,
    capacite: v.capacite ?? null,
    stock: v.stock,
    sku: v.sku,
    codeBarre: v.codeBarre ?? null,
    prix: v.prix,
  }));
}

function uniq(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.filter(Boolean))) as string[];
}

export default function ProductDetailsSection({ product, avisStats }: ProductDetailsSectionProps) {
  const router = useRouter();
  const panier = usePanier();
  const initialStock = useMemo(() => toStockVariantes(product), [product]);
  const { variantes: liveVariantes, lastUpdated, loading: stockLoading, refresh } = useProductStock(
    product.slug,
    initialStock,
  );

  const tailles = uniq(liveVariantes.map((v) => v.taille));
  const couleurs = uniq(liveVariantes.map((v) => v.couleur));
  const capacites = uniq(liveVariantes.map((v) => v.capacite));

  const [selectedTaille, setSelectedTaille] = useState(tailles[0] || '');
  const [selectedCouleur, setSelectedCouleur] = useState(couleurs[0] || '');
  const [selectedCapacite, setSelectedCapacite] = useState(capacites[0] || '');
  const [quantite, setQuantite] = useState(1);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    trackViewedProduct(product.id);
  }, [product.id]);

  const findVariant = (t: string, c: string, cap: string) =>
    liveVariantes.find(
      (v) =>
        (!t || v.taille === t) &&
        (!c || v.couleur === c) &&
        (!cap || v.capacite === cap),
    );

  const selectedVariant =
    findVariant(selectedTaille, selectedCouleur, selectedCapacite) ?? liveVariantes[0];

  useEffect(() => {
    if (selectedVariant && findVariant(selectedTaille, selectedCouleur, selectedCapacite)) return;
    if (selectedVariant) {
      if (selectedVariant.taille) setSelectedTaille(selectedVariant.taille);
      if (selectedVariant.couleur) setSelectedCouleur(selectedVariant.couleur);
      if (selectedVariant.capacite) setSelectedCapacite(selectedVariant.capacite);
    }
  }, [liveVariantes, selectedTaille, selectedCouleur, selectedCapacite, selectedVariant]);

  const stockDisponible = selectedVariant?.stock ?? 0;
  const aDuStock = stockDisponible > 0;

  useEffect(() => {
    if (quantite > stockDisponible && stockDisponible > 0) {
      setQuantite(stockDisponible);
    }
  }, [stockDisponible, quantite]);

  const enPromo =
    product.prixPromo != null &&
    estPromoActive({
      prixPromo: product.prixPromo,
      promoDebut: product.promoDebut,
      promoFin: product.promoFin,
    });
  const prixCatalogue =
    selectedVariant?.prix != null ? selectedVariant.prix : product.prix;
  const prixAffiche =
    enPromo && product.prixPromo != null ? product.prixPromo : prixCatalogue;
  const remisePct =
    enPromo && product.prixPromo != null
      ? calculerRemisePct(Number(product.prix), product.prixPromo)
      : 0;

  const images = product.images.length > 0 ? product.images : [];

  const buildCartItem = () => {
    if (!selectedVariant) return null;
    return creerItemPanier({
      variantId: selectedVariant.id,
      productId: product.id,
      nomProduit: product.nom,
      slug: product.slug,
      image: product.images[0] ?? '',
      prixProduit: product.prix,
      prixVariante: enPromo ? product.prixPromo : selectedVariant.prix,
      taille: selectedTaille || selectedVariant.taille,
      couleur: selectedCouleur || selectedVariant.couleur,
      quantite,
    });
  };

  const handleAddToCart = () => {
    const item = buildCartItem();
    if (!aDuStock || !item) return;
    panier.ajouterItem(item);
    void trackEvent('ADD_TO_CART', { productId: product.id, path: `/produits/${product.slug}` });
    setShowSuccessToast(true);
  };

  const handleBuyNow = () => {
    const item = buildCartItem();
    if (!aDuStock || !item) return;
    panier.ajouterOuRemplacer(item);
    void trackEvent('CHECKOUT_START', { productId: product.id, path: `/produits/${product.slug}` });
    router.push('/commande');
  };

  const getWhatsAppLink = () => {
    const prixLabel = `${prixAffiche.toLocaleString('fr-FR')} GN`;
    const message =
      `Bonjour KabiShop ! Je souhaite commander :\n\n` +
      `• *${product.nom}*\n` +
      (selectedCapacite ? `• Capacité : ${selectedCapacite}\n` : '') +
      (selectedTaille ? `• Taille : ${selectedTaille}\n` : '') +
      (selectedCouleur ? `• Couleur : ${selectedCouleur}\n` : '') +
      `• Quantité : ${quantite}\n` +
      `• Prix : ${prixLabel}\n\n` +
      `${getAppUrl()}/produits/${product.slug}`;

    const num = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '224620000000';
    return `https://wa.me/${num.replace(/[\s+\-()]/g, '')}?text=${encodeURIComponent(message)}`;
  };

  const promoBadge =
    enPromo && remisePct > 0 ? (
      <span className="absolute top-4 left-4 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-md">
        -{remisePct}%
      </span>
    ) : null;

  return (
    <>
    <div className="grid grid-cols-1 gap-10 pb-24 lg:grid-cols-2 lg:items-start lg:gap-14 lg:pb-0">
      <ProductImageGallery images={images} alt={product.nom} badge={promoBadge} />

      <div className="flex flex-col gap-6">
        <div className="space-y-4">
          <Link
            href={`/produits?categorie=${product.categorie.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#eef0eb] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#4a5240] transition hover:bg-[#e4e8df]"
          >
            {product.categorie.nom}
          </Link>

          <h1 className="font-serif text-2xl font-bold leading-tight tracking-tight text-zinc-900 md:text-[2rem]">
            {product.nom}
          </h1>
          {avisStats && avisStats.total > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <StarRating value={avisStats.moyenne} size="sm" showValue />
              <span className="text-xs text-zinc-500">
                ({avisStats.total} avis vérifié{avisStats.total > 1 ? 's' : ''})
              </span>
            </div>
          )}

          {product.marque && (
            <p className="text-sm font-semibold text-zinc-500">{product.marque}</p>
          )}

          <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            {enPromo && product.prixPromo != null ? (
              <>
                <p className="text-2xl font-bold text-red-600 md:text-3xl">
                  {prixAffiche.toLocaleString('fr-FR')} GN
                </p>
                <p className="pb-0.5 text-base text-zinc-400 line-through">
                  {prixCatalogue.toLocaleString('fr-FR')} GN
                </p>
                {product.promoFin && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-700">
                    <Tag className="h-3 w-3" />
                    Jusqu&apos;au {formaterDatePromo(product.promoFin)}
                  </span>
                )}
              </>
            ) : (
              <p className="text-2xl font-bold text-zinc-900 md:text-3xl">
                {prixAffiche.toLocaleString('fr-FR')} GN
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {aDuStock ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  En stock · {stockDisponible} restant{stockDisponible > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-700">
                  Rupture de stock
                </span>
              )}
              <button
                type="button"
                onClick={() => refresh()}
                disabled={stockLoading}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2 py-1 text-[10px] font-medium text-zinc-500 hover:bg-zinc-50"
                title="Actualiser le stock"
              >
                <RefreshCw className={`h-3 w-3 ${stockLoading ? 'animate-spin' : ''}`} />
                Live
              </button>
            </div>
          </div>

          {selectedVariant?.sku && (
            <p className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
              <span>SKU : {selectedVariant.sku}</span>
              {selectedVariant.codeBarre && (
                <span className="inline-flex items-center gap-1">
                  <Barcode className="h-3.5 w-3.5" />
                  {selectedVariant.codeBarre}
                </span>
              )}
            </p>
          )}
        </div>

        {product.description && (
          <p className="border-l-2 border-[#4a5240]/30 pl-4 text-sm leading-relaxed text-zinc-500">
            {product.description}
          </p>
        )}

        <div className="space-y-5 rounded-2xl border border-[#ebe4d8] bg-white p-5 shadow-sm md:p-6">
          {capacites.length > 0 && (
            <fieldset className="space-y-2.5">
              <legend className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Capacité
              </legend>
              <div className="flex flex-wrap gap-2">
                {capacites.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCapacite(c)}
                    className={`min-w-[3rem] rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                      selectedCapacite === c
                        ? 'border-[#4a5240] bg-[#4a5240] text-white shadow-sm'
                        : 'border-[#ebe4d8] bg-[#faf7f2] text-zinc-700 hover:border-[#4a5240]/40'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {tailles.length > 0 && (
            <fieldset className="space-y-2.5">
              <legend className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Taille
              </legend>
              <div className="flex flex-wrap gap-2">
                {tailles.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTaille(t)}
                    className={`min-w-[3rem] rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                      selectedTaille === t
                        ? 'border-[#4a5240] bg-[#4a5240] text-white shadow-sm'
                        : 'border-[#ebe4d8] bg-[#faf7f2] text-zinc-700 hover:border-[#4a5240]/40'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {couleurs.length > 0 && (
            <fieldset className="space-y-2.5">
              <legend className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Couleur / fragrance
              </legend>
              <div className="flex flex-wrap gap-2">
                {couleurs.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCouleur(c)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                      selectedCouleur === c
                        ? 'border-[#4a5240] bg-[#eef0eb] text-[#4a5240]'
                        : 'border-[#ebe4d8] text-zinc-600 hover:border-[#4a5240]/40 hover:bg-[#faf7f2]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {aDuStock && (
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Quantité
              </span>
              <div className="inline-flex items-center rounded-xl border border-[#ebe4d8] bg-[#faf7f2] p-1">
                <button
                  type="button"
                  onClick={() => setQuantite(Math.max(1, quantite - 1))}
                  disabled={quantite <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-medium text-zinc-600 transition hover:bg-white disabled:opacity-40"
                >
                  −
                </button>
                <span className="w-12 text-center text-base font-bold text-zinc-900">{quantite}</span>
                <button
                  type="button"
                  onClick={() => setQuantite(Math.min(stockDisponible, quantite + 1))}
                  disabled={quantite >= stockDisponible}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-medium text-zinc-600 transition hover:bg-white disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {aDuStock ? (
            <div className="space-y-2.5 pt-1">
              <div className="hidden space-y-2.5 lg:block">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#4a5240] py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#3d4534]"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Ajouter au panier
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 py-3.5 text-sm font-bold text-white transition hover:bg-zinc-800"
                >
                  <Zap className="h-4 w-4" />
                  Acheter maintenant
                </button>
              </div>
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#25D366] bg-white py-3 text-sm font-semibold text-[#128C7E] transition hover:bg-[#f0fdf4]"
              >
                <MessageCircle className="h-4 w-4" />
                Commander via WhatsApp
              </a>
            </div>
          ) : (
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-900">Produit indisponible</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-800">
                  Contactez-nous sur WhatsApp pour connaître la date de réapprovisionnement.
                </p>
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#128C7E] hover:underline"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Écrire sur WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>

        {lastUpdated && (
          <p className="text-[10px] text-zinc-400">
            Stock actualisé à {new Date(lastUpdated).toLocaleTimeString('fr-FR')}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { icon: Truck, label: 'Livraison 24–48h', sub: 'Conakry' },
            { icon: ShieldCheck, label: 'Paiement sécurisé', sub: 'Mobile Money' },
            { icon: RotateCcw, label: 'Produits authentiques', sub: 'Garantie qualité' },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="rounded-xl border border-[#ebe4d8] bg-[#faf7f2]/80 px-3 py-3 text-center"
            >
              <Icon className="mx-auto mb-1.5 h-4 w-4 text-[#4a5240]" strokeWidth={1.75} />
              <p className="text-[10px] font-bold leading-tight text-zinc-800">{label}</p>
              <p className="mt-0.5 text-[9px] text-zinc-400">{sub}</p>
            </div>
          ))}
        </div>

        <CartToast
          visible={showSuccessToast}
          message="Ajouté au panier"
          onHide={() => setShowSuccessToast(false)}
        />
      </div>
    </div>

    {aDuStock && (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#ebe4d8] bg-white/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold leading-none text-zinc-900">
              {prixAffiche.toLocaleString('fr-FR')} GN
            </p>
            {enPromo && product.prixPromo != null && (
              <p className="mt-1 text-xs text-zinc-400 line-through">
                {prixCatalogue.toLocaleString('fr-FR')} GN
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#4a5240] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#3d4534]"
          >
            <ShoppingCart className="h-4 w-4" />
            Ajouter
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
            aria-label="Acheter maintenant"
          >
            <Zap className="h-4 w-4" />
          </button>
        </div>
      </div>
    )}
    </>
  );
}
