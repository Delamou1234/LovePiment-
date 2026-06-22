'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePanier, creerItemPanier } from '@/store/panier';
import { trackEvent } from '@/shared/hooks/useTracking';
import { trackViewedProduct } from '@/shared/hooks/useViewedProducts';
import { getAppUrl } from '@/shared/lib/app-url';
import { CartToast } from '@/shared/components/CartToast';
import { ProductImageGallery, type RelatedProductThumb } from './ProductImageGallery';
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
  similaires?: RelatedProductThumb[];
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

const TRUST_ITEMS = [
  { icon: Truck, label: 'Livraison 24–48h', sub: 'Conakry & environs' },
  { icon: ShieldCheck, label: 'Paiement sécurisé', sub: 'Orange · MTN · CinetPay' },
  { icon: RotateCcw, label: 'Authenticité', sub: 'Produits vérifiés' },
] as const;

export default function ProductDetailsSection({ product, avisStats, similaires = [] }: ProductDetailsSectionProps) {
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
      <span className="absolute top-4 left-4 z-10 rounded-full bg-olive px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-lg">
        −{remisePct}%
      </span>
    ) : null;

  const actionButtons = aDuStock ? (
    <>
      <div className="product-actions-bar product-actions-bar--split hidden lg:flex">
        <button type="button" onClick={handleAddToCart} className="product-cta-primary">
          <ShoppingCart className="h-4 w-4" />
          Ajouter au panier
        </button>
        <button type="button" onClick={handleBuyNow} className="product-cta-secondary">
          <Zap className="h-4 w-4" />
          Acheter
        </button>
      </div>
      <a
        href={getWhatsAppLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="product-cta-whatsapp hidden lg:flex"
      >
        <MessageCircle className="h-4 w-4" />
        Commander via WhatsApp
      </a>
    </>
  ) : (
    <div className="flex gap-3 rounded-xl border border-amber-200/70 bg-amber-50/60 p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div>
        <p className="text-sm font-semibold text-amber-900">Produit indisponible</p>
        <p className="mt-1 text-xs leading-relaxed text-amber-800/90">
          Contactez-nous pour connaître la date de réapprovisionnement.
        </p>
        <a
          href={getWhatsAppLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#128C7E] hover:underline"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Écrire sur WhatsApp
        </a>
      </div>
    </div>
  );

  return (
    <>
      <div className="product-detail-main">
        <div className="product-detail-grid pb-28 lg:pb-0">
          <ProductImageGallery
            images={images}
            alt={product.nom}
            badge={promoBadge}
            relatedProducts={similaires}
          />

          <div className="product-info-column">
            <header className="product-info-header">
              <Link href={`/produits?categorie=${product.categorie.slug}`} className="product-category-badge">
                {product.categorie.nom}
              </Link>

              {product.marque && <p className="product-brand">{product.marque}</p>}

              <h1 className="product-title">{product.nom}</h1>

              {avisStats && avisStats.total > 0 && (
                <div className="flex items-center gap-2.5">
                  <StarRating value={avisStats.moyenne} size="sm" showValue />
                  <a
                    href="#avis-clients"
                    className="text-xs text-zinc-400 underline-offset-2 transition hover:text-olive hover:underline"
                  >
                    {avisStats.total} avis vérifié{avisStats.total > 1 ? 's' : ''}
                  </a>
                </div>
              )}
            </header>

            <div className="product-price-card">
              <div>
                {enPromo && product.prixPromo != null ? (
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className="product-price-main">{prixAffiche.toLocaleString('fr-FR')} GN</p>
                    <p className="product-price-old">{prixCatalogue.toLocaleString('fr-FR')} GN</p>
                  </div>
                ) : (
                  <p className="product-price-main">{prixAffiche.toLocaleString('fr-FR')} GN</p>
                )}
                {enPromo && product.promoFin && (
                  <span className="product-promo-tag mt-2">
                    <Tag className="h-3 w-3" />
                    Promo jusqu&apos;au {formaterDatePromo(product.promoFin)}
                  </span>
                )}
              </div>

              <div className="product-meta-row">
                {aDuStock ? (
                  <span className="product-stock-badge">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {stockDisponible} en stock
                  </span>
                ) : (
                  <span className="product-stock-badge is-out">Rupture</span>
                )}
                <button
                  type="button"
                  onClick={() => refresh()}
                  disabled={stockLoading}
                  className="product-live-btn"
                  title="Actualiser le stock"
                >
                  <RefreshCw className={`h-3 w-3 ${stockLoading ? 'animate-spin' : ''}`} />
                  Live
                </button>
              </div>
            </div>

            {product.description && (
              <p className="product-description">{product.description}</p>
            )}

            <div className="product-config-panel">
              {capacites.length > 0 && (
                <fieldset>
                  <legend className="product-option-label">Capacité</legend>
                  <div className="flex flex-wrap gap-2">
                    {capacites.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedCapacite(c)}
                        className={`product-variant-btn ${selectedCapacite === c ? 'is-active' : ''}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {tailles.length > 0 && (
                <fieldset>
                  <legend className="product-option-label">Taille</legend>
                  <div className="flex flex-wrap gap-2">
                    {tailles.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTaille(t)}
                        className={`product-variant-btn ${selectedTaille === t ? 'is-active' : ''}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {couleurs.length > 0 && (
                <fieldset>
                  <legend className="product-option-label">Fragrance</legend>
                  <div className="flex flex-wrap gap-2">
                    {couleurs.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedCouleur(c)}
                        className={`product-variant-pill ${selectedCouleur === c ? 'is-active' : ''}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {aDuStock && (
                <div className="product-config-row">
                  <div>
                    <span className="product-option-label">Quantité</span>
                    <div className="product-qty-control">
                      <button
                        type="button"
                        onClick={() => setQuantite(Math.max(1, quantite - 1))}
                        disabled={quantite <= 1}
                        className="product-qty-btn"
                        aria-label="Diminuer"
                      >
                        −
                      </button>
                      <span className="w-12 text-center text-base font-bold tabular-nums text-zinc-900">
                        {quantite}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantite(Math.min(stockDisponible, quantite + 1))}
                        disabled={quantite >= stockDisponible}
                        className="product-qty-btn"
                        aria-label="Augmenter"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {selectedVariant?.sku && (
                    <p className="product-sku-line flex items-center gap-2">
                      <span>SKU {selectedVariant.sku}</span>
                      {selectedVariant.codeBarre && (
                        <span className="inline-flex items-center gap-1">
                          <Barcode className="h-3 w-3" />
                          {selectedVariant.codeBarre}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>

            {actionButtons}

            <div className="product-trust-strip">
              {TRUST_ITEMS.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="product-trust-item">
                  <div className="product-trust-icon">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="product-trust-label">{label}</p>
                    <p className="product-trust-sub">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {lastUpdated && (
              <p className="text-center text-[10px] text-zinc-400 lg:text-left">
                Stock actualisé à {new Date(lastUpdated).toLocaleTimeString('fr-FR')}
              </p>
            )}

            <CartToast
              visible={showSuccessToast}
              message="Ajouté au panier"
              onHide={() => setShowSuccessToast(false)}
            />
          </div>
        </div>
      </div>

      {aDuStock && (
        <div className="product-mobile-bar lg:hidden">
          <div className="product-mobile-bar-inner">
            <div className="min-w-0">
              <p className="font-serif text-lg font-bold leading-none tabular-nums text-zinc-900">
                {prixAffiche.toLocaleString('fr-FR')} GN
              </p>
              {enPromo && product.prixPromo != null && (
                <p className="mt-0.5 text-xs tabular-nums text-zinc-400 line-through">
                  {prixCatalogue.toLocaleString('fr-FR')} GN
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className="product-cta-primary !w-auto shrink-0 px-6 py-3 text-sm"
            >
              <ShoppingCart className="h-4 w-4" />
              Panier
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="product-cta-secondary !w-auto shrink-0 !px-5 py-3"
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
