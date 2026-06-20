'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { usePanier } from '@/store/panier';
import { trackEvent } from '@/shared/hooks/useTracking';
import {
  ShoppingCart,
  MessageSquareCode,
  Check,
  AlertTriangle,
  Info,
  ZoomIn,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProduitAvecVariantes } from '../types';

interface ProductDetailsSectionProps {
  product: ProduitAvecVariantes;
}

export default function ProductDetailsSection({ product }: ProductDetailsSectionProps) {
  const panier = usePanier();
  
  // Extraction des tailles et couleurs uniques des variantes
  const tailles = Array.from(new Set(product.variantes.map((v) => v.taille).filter(Boolean))) as string[];
  const couleurs = Array.from(new Set(product.variantes.map((v) => v.couleur).filter(Boolean))) as string[];

  // États de sélection
  const [selectedTaille, setSelectedTaille] = useState(tailles[0] || '');
  const [selectedCouleur, setSelectedCouleur] = useState(couleurs[0] || '');
  const [quantite, setQuantite] = useState(1);
  const [activeImage, setActiveImage] = useState(product.images[0]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  // Trouver la variante correspondante
  const selectedVariant = product.variantes.find(
    (v) => 
      (!selectedTaille || v.taille === selectedTaille) && 
      (!selectedCouleur || v.couleur === selectedCouleur)
  );

  const stockDisponible = selectedVariant ? selectedVariant.stock : 0;
  const aDuStock = stockDisponible > 0;
  
  // Prix spécifique à la variante ou prix de base
  const prixCourant = selectedVariant && selectedVariant.prix 
    ? Number(selectedVariant.prix) 
    : Number(product.prix);

  const formattedPrice = prixCourant.toLocaleString('fr-FR') + ' GN';

  const handleAddToCart = () => {
    if (!aDuStock || !selectedVariant) return;

    panier.ajouterItem({
      variantId: selectedVariant.id,
      productId: product.id,
      nomProduit: product.nom,
      slug: product.slug,
      image: product.images[0],
      taille: selectedTaille || undefined,
      couleur: selectedCouleur || undefined,
      prix: prixCourant,
    });

    void trackEvent('ADD_TO_CART', { productId: product.id, path: `/produits/${product.slug}` });

    // Afficher un petit toast de succès
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // WhatsApp Order Link Generator
  const getWhatsAppLink = () => {
    const message = `Bonjour KabiShop ! Je souhaite commander un article de votre boutique en ligne :\n\n` +
      `- *Article* : ${product.nom}\n` +
      (selectedTaille ? `- *Taille* : ${selectedTaille}\n` : '') +
      (selectedCouleur ? `- *Couleur* : ${selectedCouleur}\n` : '') +
      `- *Quantité* : ${quantite}\n` +
      `- *Prix unitaire* : ${formattedPrice}\n\n` +
      `Lien de l'article : ${window.location.origin}/produits/${product.slug}\n` +
      `Merci de me reconfirmer la disponibilité.`;
      
    return `https://wa.me/224620000000?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      
      {/* ─── COLONNE GAUCHE : GALERIE IMAGES ────────────────────────────── */}
      <div className="space-y-4">
        {/* Grande image active */}
        <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-[#ebe4d8] bg-[#f5f0e8] shadow-sm group cursor-zoom-in">
          <Image
            src={activeImage}
            alt={product.nom}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center transition duration-300"
            priority
            onClick={() => setZoomOpen(true)}
          />
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-700 opacity-0 group-hover:opacity-100 transition shadow-sm"
          >
            <ZoomIn className="h-3.5 w-3.5" /> Zoom
          </button>
        </div>

        {zoomOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setZoomOpen(false)}
          >
            <button
              type="button"
              className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              onClick={() => setZoomOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
            <div className="relative h-[80vh] w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <Image src={activeImage} alt={product.nom} fill sizes="90vw" className="object-contain" />
            </div>
          </div>
        )}
        
        {/* Vignettes / Thumbnails */}
        {product.images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {product.images.map((img, idx) => {
              const isActive = activeImage === img;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative h-20 w-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                    isActive ? 'border-primary ring-2 ring-primary/20' : 'border-zinc-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.nom} thumbnail ${idx}`}
                    fill
                    sizes="80px"
                    className="object-cover object-center"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── COLONNE DROITE : DESCRIPTION & CHOIX ────────────────────────── */}
      <div className="space-y-6">
        
        {/* En-tête */}
        <div className="space-y-2 border-b border-zinc-100 pb-4">
          <span className="text-xs font-bold text-accent uppercase tracking-widest bg-accent-light rounded-full px-3 py-1 border border-[#ebe4d8] inline-block">
            {product.categorie.nom}
          </span>
          <h1 className="font-serif text-2xl font-bold text-zinc-900 md:text-3xl leading-tight">
            {product.nom}
          </h1>
          <div className="flex items-center gap-4 pt-1">
            <span className="price-display-large">{formattedPrice}</span>
            {aDuStock ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-success bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                <span className="h-2 w-2 rounded-full bg-success"></span> En stock ({stockDisponible} restants)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-error bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                <span className="h-2 w-2 rounded-full bg-error"></span> En rupture de stock
              </span>
            )}
          </div>
        </div>

        {/* Sélection des options */}
        <div className="space-y-4">
          {/* Tailles */}
          {tailles.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-zinc-500 tracking-wider">Taille</span>
              <div className="flex flex-wrap gap-2">
                {tailles.map((t) => {
                  const isSelected = selectedTaille === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setSelectedTaille(t)}
                      className={`flex h-11 min-w-11 items-center justify-center rounded-xl border text-sm font-bold transition-all px-3 ${
                        isSelected
                          ? 'border-accent bg-accent text-white shadow-sm'
                          : 'border-[#ebe4d8] text-zinc-700 hover:border-zinc-400 hover:bg-[#faf7f2]'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Couleurs */}
          {couleurs.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-zinc-500 tracking-wider">Couleur</span>
              <div className="flex flex-wrap gap-2">
                {couleurs.map((c) => {
                  const isSelected = selectedCouleur === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setSelectedCouleur(c)}
                      className={`text-xs font-bold py-2 px-4 rounded-full border transition-all ${
                        isSelected
                          ? 'border-accent bg-accent-light text-accent'
                          : 'border-[#ebe4d8] text-zinc-600 hover:border-zinc-400 hover:bg-[#faf7f2]'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantité */}
          {aDuStock && (
            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-zinc-500 tracking-wider">Quantité</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantite(Math.max(1, quantite - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 font-bold text-zinc-600 hover:bg-zinc-50"
                  disabled={quantite <= 1}
                >
                  -
                </button>
                <span className="w-12 text-center font-bold text-zinc-950 text-base">{quantite}</span>
                <button
                  onClick={() => setQuantite(Math.min(stockDisponible, quantite + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 font-bold text-zinc-600 hover:bg-zinc-50"
                  disabled={quantite >= stockDisponible}
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Boutons d'achat */}
        <div className="space-y-3 pt-4 border-t border-zinc-100">
          {aDuStock ? (
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Ajouter au panier */}
              <Button 
                onClick={handleAddToCart}
                className="btn-primary flex-1 py-6 rounded-full font-bold text-base shadow-lg"
              >
                <ShoppingCart className="h-5 w-5" /> Ajouter au panier
              </Button>

              {/* Commander via WhatsApp */}
              <a 
                href={getWhatsAppLink()} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex-1"
              >
                <Button 
                  variant="outline"
                  className="w-full py-6 rounded-full border-2 border-green-500 text-green-600 bg-transparent hover:bg-green-50 font-bold text-base hover:text-green-600 flex items-center justify-center gap-2"
                >
                  <MessageSquareCode className="h-5 w-5" /> Commander via WhatsApp
                </Button>
              </a>
            </div>
          ) : (
            /* Alerte rupture */
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 p-4 border border-amber-200 text-amber-800">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-bold text-sm">Actuellement en rupture de stock</p>
                <p className="text-xs leading-relaxed text-amber-700 mt-1">
                  Cet article est victime de son succès. Vous pouvez tout de même nous contacter sur WhatsApp pour connaître la date de réapprovisionnement.
                </p>
              </div>
            </div>
          )}

          {/* Toast de succès panier */}
          {showSuccessToast && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-zinc-900 py-3 px-6 text-sm font-bold text-white shadow-2xl animate-fadeIn">
              <Check className="h-5 w-5 text-success bg-green-500/20 rounded-full p-0.5" /> Article ajouté au panier !
            </div>
          )}
        </div>

        {/* Description / Infos */}
        <div className="space-y-4 pt-6 border-t border-zinc-100">
          <div className="space-y-2">
            <h4 className="font-extrabold text-zinc-900 text-sm flex items-center gap-2">
              <Info className="h-4.5 w-4.5 text-primary" /> Description de l'article
            </h4>
            <p className="text-sm text-zinc-500 leading-relaxed">
              {product.description || "Aucune description fournie pour cet article."}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
