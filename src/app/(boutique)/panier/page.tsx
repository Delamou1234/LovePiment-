'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePanier, selectTotalQuantity } from '@/store/panier';
import { formaterPrixGN, LIVRAISON_CONFIG } from '@/shared/lib/shipping';
import { 
  Trash2, 
  ArrowRight, 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── CART PAGE (CLIENT COMPONENT) ───────────────────────────────────────────

export default function CartPage() {
  const panier = usePanier();
  const totalItems = usePanier(selectTotalQuantity);
  const [mounted, setMounted] = useState(false);

  // Fix hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="container-kabishop py-16 text-center">
        <div className="skeleton h-6 w-32 mx-auto mb-4"></div>
        <div className="skeleton h-32 w-full max-w-2xl mx-auto rounded-2xl"></div>
      </div>
    );
  }

  const items = panier.items;
  const sousTotal = panier.getSousTotal();
  const fraisLivraison = panier.getFraisLivraison();
  const totalAvecLivraison = panier.getTotalAvecLivraison();
  const livraisonGratuite = fraisLivraison === 0 && items.length > 0;
  const formattedSubtotal = formaterPrixGN(sousTotal);
  const formattedShipping = livraisonGratuite ? 'Offerte' : formaterPrixGN(fraisLivraison);
  const formattedTotal = formaterPrixGN(totalAvecLivraison);

  return (
    <div className="container-kabishop py-8 animate-fadeIn">
      {/* ─── BREADCRUMB ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-6">
        <Link href="/" className="hover:text-primary transition font-medium">Accueil</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-zinc-800 font-bold">Mon Panier</span>
      </div>

      <h1 className="text-2xl font-black text-zinc-900 md:text-3xl mb-8">Mon Panier</h1>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* ─── LISTE DES ARTICLES ───────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="border border-zinc-100 rounded-2xl overflow-hidden shadow-sm bg-white divide-y divide-zinc-100">
              {items.map((item) => {
                const itemTotal = (item.prix * item.quantite).toLocaleString('fr-FR') + ' GN';
                const formattedPrice = item.prix.toLocaleString('fr-FR') + ' GN';
                
                return (
                  <div key={item.variantId} className="p-4 sm:p-6 flex gap-4 sm:gap-6 items-start">
                    
                    {/* Image */}
                    <div className="relative h-20 w-16 sm:h-28 sm:w-20 rounded-xl overflow-hidden border border-zinc-100 shrink-0 bg-zinc-50">
                      <Image
                        src={item.image}
                        alt={item.nomProduit}
                        fill
                        className="object-cover object-center"
                      />
                    </div>

                    {/* Informations */}
                    <div className="flex-grow min-w-0 space-y-1">
                      <span className="text-[10px] font-black uppercase text-primary tracking-widest">KabiShop</span>
                      <Link href={`/produits/${item.slug}`} className="block">
                        <h3 className="font-extrabold text-zinc-950 text-sm sm:text-base hover:text-primary transition line-clamp-1 leading-snug">
                          {item.nomProduit}
                        </h3>
                      </Link>
                      
                      {/* Attributs de variante */}
                      {(item.taille || item.couleur) && (
                        <div className="flex flex-wrap gap-2 text-xs font-semibold text-zinc-500 pt-0.5">
                          {item.taille && (
                            <span className="bg-zinc-50 border border-zinc-100 rounded px-1.5 py-0.5">
                              Taille: {item.taille}
                            </span>
                          )}
                          {item.couleur && (
                            <span className="bg-zinc-50 border border-zinc-100 rounded px-1.5 py-0.5">
                              Couleur: {item.couleur}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Prix unitaire */}
                      <p className="text-xs font-semibold text-zinc-400 pt-1">
                        Prix unitaire : {formattedPrice}
                      </p>

                      {/* Actions Quantité Mobile */}
                      <div className="flex items-center justify-between sm:hidden pt-3 mt-1 border-t border-zinc-50">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => panier.modifierQuantite(item.variantId, item.quantite - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-xs font-bold text-zinc-500 bg-white"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-zinc-800 text-xs">{item.quantite}</span>
                          <button
                            onClick={() => panier.modifierQuantite(item.variantId, item.quantite + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-xs font-bold text-zinc-500 bg-white"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => panier.retirerItem(item.variantId)}
                          className="text-zinc-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>

                    </div>

                    {/* Quantité & Total (Desktop) */}
                    <div className="hidden sm:flex flex-col items-end justify-between self-stretch shrink-0">
                      <button
                        onClick={() => panier.retirerItem(item.variantId)}
                        className="text-zinc-300 hover:text-red-500 transition duration-150"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>

                      <div className="flex items-center justify-between gap-6 mt-auto">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => panier.modifierQuantite(item.variantId, item.quantite - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50 transition"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-zinc-800 text-sm">{item.quantite}</span>
                          <button
                            onClick={() => panier.modifierQuantite(item.variantId, item.quantite + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50 transition"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-extrabold text-zinc-950 text-sm sm:text-base min-w-[90px] text-right">
                          {itemTotal}
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Vider le panier */}
            <div className="flex justify-start">
              <button
                onClick={() => panier.viderPanier()}
                className="text-xs font-bold text-zinc-400 hover:text-red-500 transition flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" /> Vider mon panier
              </button>
            </div>
          </div>

          {/* ─── COLLONNE DROITE : RÉCAPITULATIF ───────────────────────────── */}
          <div className="space-y-6">
            <div className="border border-zinc-100 rounded-2xl p-6 bg-zinc-50 space-y-6 shadow-sm">
              <h3 className="font-extrabold text-zinc-950 text-lg border-b border-zinc-100 pb-3">
                Récapitulatif
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-zinc-500 font-semibold">
                  <span>Articles ({totalItems})</span>
                  <span>{formattedSubtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-zinc-500 font-semibold">
                  <span>Livraison (Conakry)</span>
                  <span className={livraisonGratuite ? 'text-emerald-600 font-bold' : ''}>
                    {formattedShipping}
                  </span>
                </div>
                {!livraisonGratuite && items.length > 0 && (
                  <p className="text-[11px] text-zinc-400">
                    Livraison offerte dès {formaterPrixGN(LIVRAISON_CONFIG.seuilGratuit)}
                  </p>
                )}
                
                <div className="border-t border-zinc-200 pt-4 flex justify-between items-end">
                  <span className="font-bold text-zinc-950 text-base">Montant total</span>
                  <span className="price-display-large">{formattedTotal}</span>
                </div>
              </div>

              {panier.lastSavedAt && (
                <p className="text-center text-[11px] text-zinc-400">
                  Panier sauvegardé automatiquement sur cet appareil
                </p>
              )}

              {/* Passer commande */}
              <Link href="/commande">
                <Button className="btn-primary w-full py-6 rounded-full font-bold text-base shadow-lg mt-4">
                  Passer la commande <ArrowRight className="h-5 w-5 ml-1" />
                </Button>
              </Link>
              <p className="text-center text-xs text-zinc-400 mt-3">
                Connexion requise à l&apos;étape suivante pour payer.
              </p>
            </div>

            {/* Assurances */}
            <div className="border border-zinc-100 rounded-2xl p-4 bg-white space-y-3 shadow-sm text-xs leading-relaxed text-zinc-500">
              <div className="flex items-center gap-2 text-zinc-800 font-bold">
                <Truck className="h-4.5 w-4.5 text-primary shrink-0" />
                <span>Livraison Express Conakry</span>
              </div>
              <p>Recevez vos achats en 24h à 48h directement chez vous.</p>
              
              <div className="flex items-center gap-2 text-zinc-800 font-bold pt-2 border-t border-zinc-100">
                <ShieldCheck className="h-4.5 w-4.5 text-primary shrink-0" />
                <span>Paiements mobiles autorisés</span>
              </div>
              <p>Règlement sécurisé Mobile Money (Orange Money, CinetPay) ou paiement comptant en espèces à la livraison.</p>
            </div>
          </div>

        </div>
      ) : (
        /* ─── PANIER VIDE ───────────────────────────────────────────────── */
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-100 rounded-3xl bg-zinc-50/50">
          <div className="rounded-full bg-primary/10 p-6 text-primary mb-6">
            <ShoppingBag className="h-12 w-12" />
          </div>
          <h2 className="text-xl font-bold text-zinc-950 mb-2">Votre panier est vide</h2>
          <p className="text-sm text-zinc-500 max-w-xs leading-relaxed mb-8">
            Il semblerait que vous n'ayez pas encore ajouté d'articles. Découvrez nos collections pour commencer votre shopping !
          </p>
          <Link href="/produits">
            <Button className="btn-primary rounded-full px-8 py-5 text-base font-bold shadow-lg">
              Découvrir nos parfums & huiles <ArrowRight className="h-5 w-5 ml-1" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
