'use client';

import { useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePanier, selectTotalQuantity } from '@/store/panier';
import { formaterPrixGN, calculerTotauxCommande, libelleLivraisonOfferte } from '@/shared/lib/shipping';
import { useLivraisonConfig } from '@/shared/hooks/useLivraisonConfig';
import { confirmPanierRetirer, confirmPanierVider } from '@/shared/lib/confirm-action';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  Cloud,
  ExternalLink,
} from 'lucide-react';

function formatVariantLabel(item: { taille?: string; couleur?: string }) {
  const parts = [item.taille, item.couleur].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ').toUpperCase() : null;
}

export function CartDrawer() {
  const panier = usePanier();
  const livraisonConfig = useLivraisonConfig();
  const totalQty = usePanier(selectTotalQuantity);
  const {
    items,
    isOpen,
    fermerPanier,
    modifierQuantite,
    retirerItem,
    viderPanier,
    lastSavedAt,
  } = panier;

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermerPanier();
    },
    [fermerPanier],
  );

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const { sousTotal, fraisLivraison, livraisonGratuite, total } = calculerTotauxCommande(
    items,
    livraisonConfig.villeParDefaut,
    livraisonConfig,
  );
  const restePourLivraisonGratuite = Math.max(0, livraisonConfig.seuilGratuit - sousTotal);

  const handleVider = async () => {
    if (items.length === 0) return;
    if (await confirmPanierVider()) viderPanier();
  };

  const handleRemove = async (variantId: string, nom: string) => {
    if (await confirmPanierRetirer(nom)) retirerItem(variantId);
  };

  return (
    <div className="cart-drawer-root" role="dialog" aria-modal="true" aria-label="Votre panier">
      <button
        type="button"
        className="cart-drawer-backdrop"
        onClick={fermerPanier}
        aria-label="Fermer le panier"
      />

      <div className="cart-drawer-panel animate-slideInRight">
        <header className="cart-drawer-header">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShoppingBag className="h-5 w-5 shrink-0 text-[#ff6eb4]" strokeWidth={1.75} />
            <div className="min-w-0">
              <h2 className="font-serif text-base font-bold text-white truncate">Votre panier</h2>
              {items.length > 0 && (
                <p className="text-[11px] text-white/55">
                  {totalQty} article{totalQty > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={fermerPanier}
            className="cart-drawer-close"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <div className="cart-drawer-empty">
              <div className="cart-drawer-empty-icon">
                <ShoppingBag className="h-10 w-10 text-zinc-300" />
              </div>
              <p className="text-sm font-medium text-zinc-700">Votre panier est vide</p>
              <p className="mt-1 text-xs text-zinc-500 leading-relaxed max-w-[220px]">
                Parcourez la boutique et ajoutez vos produits favoris.
              </p>
              <Link href="/produits" onClick={fermerPanier} className="cart-drawer-cta mt-6">
                Découvrir la boutique
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <ul className="cart-drawer-list">
              {items.map((item) => {
                const variantLabel = formatVariantLabel(item);
                const ligneTotal = item.prix * item.quantite;

                return (
                  <li key={item.variantId} className="cart-drawer-item">
                    <Link
                      href={`/produits/${item.slug}`}
                      onClick={fermerPanier}
                      className="cart-drawer-item-thumb"
                    >
                      <Image
                        src={item.image}
                        alt={item.nomProduit}
                        fill
                        className="object-cover"
                        sizes="72px"
                      />
                    </Link>

                    <div className="cart-drawer-item-main min-w-0 flex-1">
                      <Link
                        href={`/produits/${item.slug}`}
                        onClick={fermerPanier}
                        className="cart-drawer-item-title"
                      >
                        {item.nomProduit}
                      </Link>
                      <p className="cart-drawer-item-price">{formaterPrixGN(ligneTotal)}</p>
                      {variantLabel && (
                        <p className="cart-drawer-item-variant">{variantLabel}</p>
                      )}
                      {item.quantite > 1 && (
                        <p className="cart-drawer-item-unit">
                          {formaterPrixGN(item.prix)} × {item.quantite}
                        </p>
                      )}

                      <div className="cart-drawer-item-actions">
                        <div className="cart-drawer-qty" role="group" aria-label="Quantité">
                          <button
                            type="button"
                            onClick={() => modifierQuantite(item.variantId, item.quantite - 1)}
                            className="cart-drawer-qty-btn"
                            aria-label="Diminuer la quantité"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="cart-drawer-qty-value" aria-live="polite">
                            {item.quantite}
                          </span>
                          <button
                            type="button"
                            onClick={() => modifierQuantite(item.variantId, item.quantite + 1)}
                            className="cart-drawer-qty-btn"
                            aria-label="Augmenter la quantité"
                            disabled={item.quantite >= 99}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemove(item.variantId, item.nomProduit)}
                          className="cart-drawer-remove"
                          aria-label={`Supprimer ${item.nomProduit}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="cart-drawer-footer safe-area-bottom">
            <div className="cart-drawer-summary">
              <div className="cart-drawer-summary-row">
                <span>Sous-total</span>
                <span className="font-semibold text-zinc-900">{formaterPrixGN(sousTotal)}</span>
              </div>
              <div className="cart-drawer-summary-row text-xs">
                <span>Livraison ({livraisonConfig.villeParDefaut})</span>
                <span className={livraisonGratuite ? 'font-semibold text-emerald-600' : ''}>
                  {livraisonGratuite ? 'Offerte' : formaterPrixGN(fraisLivraison)}
                </span>
              </div>
              {!livraisonGratuite && sousTotal > 0 && livraisonConfig.gratuiteActive && (
                <p className="cart-drawer-shipping-hint">
                  {libelleLivraisonOfferte(livraisonConfig)}
                  {restePourLivraisonGratuite > 0 && (
                    <>
                      {' '}
                      — plus que {formaterPrixGN(restePourLivraisonGratuite)}
                    </>
                  )}
                </p>
              )}
              <div className="cart-drawer-total">
                <span>Total</span>
                <span>{formaterPrixGN(total)}</span>
              </div>
            </div>

            {lastSavedAt && (
              <p className="cart-drawer-saved">
                <Cloud className="h-3.5 w-3.5 shrink-0" />
                Panier enregistré sur cet appareil
              </p>
            )}

            <Link href="/commande" onClick={fermerPanier} className="cart-drawer-checkout">
              Passer la commande
              <ArrowRight className="h-4 w-4" />
            </Link>

            <p className="cart-drawer-login-hint">
              Connexion requise à l&apos;étape suivante pour payer.
            </p>

            <div className="cart-drawer-secondary-actions">
              <Link href="/panier" onClick={fermerPanier} className="cart-drawer-link">
                <ExternalLink className="h-3.5 w-3.5" />
                Voir le panier complet
              </Link>
              <button type="button" onClick={fermerPanier} className="cart-drawer-link">
                Continuer mes achats
              </button>
              <button type="button" onClick={handleVider} className="cart-drawer-link cart-drawer-link--danger">
                Vider le panier
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
