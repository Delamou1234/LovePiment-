'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePanier } from '@/store/panier';
import { formaterPrixGN, LIVRAISON_CONFIG } from '@/shared/lib/shipping';
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag, Cloud } from 'lucide-react';

export function CartDrawer() {
  const panier = usePanier();
  const {
    items,
    isOpen,
    fermerPanier,
    modifierQuantite,
    retirerItem,
    getSousTotal,
    getFraisLivraison,
    getTotalAvecLivraison,
    lastSavedAt,
  } = panier;

  if (!isOpen) return null;

  const sousTotal = getSousTotal();
  const fraisLivraison = getFraisLivraison();
  const total = getTotalAvecLivraison();
  const livraisonGratuite = fraisLivraison === 0 && items.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={fermerPanier}
        aria-hidden
      />

      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="flex h-full w-screen max-w-md flex-col bg-white shadow-2xl animate-slideInRight">
          <div className="flex items-center justify-between border-b border-[#ebe4d8] bg-[#faf7f2] px-5 py-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-accent" />
              <h2 className="font-serif text-base font-bold text-zinc-900">Votre panier</h2>
            </div>
            <button
              type="button"
              onClick={fermerPanier}
              className="rounded-full p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="Fermer le panier"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                <div className="rounded-full bg-[#f5f0e8] p-5">
                  <ShoppingBag className="h-10 w-10 text-zinc-300" />
                </div>
                <p className="text-sm text-zinc-500">Votre panier est vide pour le moment.</p>
                <Link
                  href="/produits"
                  onClick={fermerPanier}
                  className="btn-accent text-sm px-6 py-3"
                >
                  Découvrir la boutique
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex gap-3 border-b border-[#ebe4d8] pb-4 last:border-0"
                >
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-[#ebe4d8] bg-[#f5f0e8]">
                    <Image src={item.image} alt={item.nomProduit} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-zinc-900">{item.nomProduit}</h3>
                    <p className="mt-0.5 text-xs font-bold text-zinc-700">{formaterPrixGN(item.prix)}</p>
                    {(item.taille || item.couleur) && (
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-400">
                        {[item.taille, item.couleur].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-[#ebe4d8] bg-[#faf7f2]">
                        <button
                          type="button"
                          onClick={() => modifierQuantite(item.variantId, item.quantite - 1)}
                          className="p-1.5 text-zinc-500 hover:text-accent"
                          aria-label="Diminuer la quantité"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold">{item.quantite}</span>
                        <button
                          type="button"
                          onClick={() => modifierQuantite(item.variantId, item.quantite + 1)}
                          className="p-1.5 text-zinc-500 hover:text-accent"
                          aria-label="Augmenter la quantité"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => retirerItem(item.variantId)}
                        className="p-1 text-zinc-400 hover:text-red-500"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="space-y-4 border-t border-[#ebe4d8] bg-[#faf7f2] p-5">
              <div className="space-y-1.5 text-sm text-zinc-600">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span className="font-semibold text-zinc-900">{formaterPrixGN(sousTotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Livraison (Conakry)</span>
                  <span className={livraisonGratuite ? 'font-semibold text-emerald-600' : ''}>
                    {livraisonGratuite ? 'Offerte' : formaterPrixGN(fraisLivraison)}
                  </span>
                </div>
                {!livraisonGratuite && sousTotal > 0 && (
                  <p className="text-[10px] text-zinc-400">
                    Livraison offerte dès {formaterPrixGN(LIVRAISON_CONFIG.seuilGratuit)}
                  </p>
                )}
                <div className="flex justify-between border-t border-[#ebe4d8] pt-2 font-serif text-base font-bold text-zinc-900">
                  <span>Total</span>
                  <span>{formaterPrixGN(total)}</span>
                </div>
              </div>

              {lastSavedAt && (
                <p className="flex items-center justify-center gap-1 text-[10px] text-zinc-400">
                  <Cloud className="h-3 w-3" />
                  Panier enregistré sur cet appareil
                </p>
              )}

              <Link
                href="/commande"
                onClick={fermerPanier}
                className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-sm"
              >
                Passer la commande <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-center text-[11px] text-zinc-400">
                Connexion requise à l&apos;étape suivante pour payer.
              </p>
              <button
                type="button"
                onClick={fermerPanier}
                className="w-full text-center text-xs text-zinc-500 hover:text-accent"
              >
                Continuer mes achats
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
