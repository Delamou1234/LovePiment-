'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculerTotauxCommande, LIVRAISON_CONFIG } from '@/shared/lib/shipping';

export interface PanierItem {
  variantId: string;
  productId: string;
  nomProduit: string;
  slug: string;
  image: string;
  taille?: string;
  couleur?: string;
  prix: number;
  quantite: number;
}

export type AjouterPanierInput = Omit<PanierItem, 'quantite'> & { quantite?: number };

interface PanierState {
  items: PanierItem[];
  isOpen: boolean;
  lastSavedAt: number | null;

  ajouterItem: (item: AjouterPanierInput) => void;
  ajouterOuRemplacer: (item: AjouterPanierInput) => void;
  retirerItem: (variantId: string) => void;
  modifierQuantite: (variantId: string, quantite: number) => void;
  viderPanier: () => void;
  ouvrirPanier: () => void;
  fermerPanier: () => void;
  togglePanier: () => void;

  getSousTotal: () => number;
  getFraisLivraison: (ville?: string) => number;
  getTotalAvecLivraison: (ville?: string) => number;
}

export const selectTotalItems = (state: PanierState) =>
  state.items.reduce((acc, item) => acc + item.quantite, 0);

export const selectQuantityForVariant = (variantId: string) => (state: PanierState) =>
  state.items.find((item) => item.variantId === variantId)?.quantite ?? 0;

export const usePanier = create<PanierState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      lastSavedAt: null,

      ajouterItem: (nouvelItem) => {
        const { quantite = 1, ...itemData } = nouvelItem;
        set((state) => {
          const existant = state.items.find((i) => i.variantId === itemData.variantId);

          if (existant) {
            return {
              items: state.items.map((i) =>
                i.variantId === itemData.variantId
                  ? { ...i, quantite: Math.min(i.quantite + quantite, 99) }
                  : i,
              ),
              isOpen: true,
              lastSavedAt: Date.now(),
            };
          }

          return {
            items: [...state.items, { ...itemData, quantite }],
            isOpen: true,
            lastSavedAt: Date.now(),
          };
        });
      },

      ajouterOuRemplacer: (nouvelItem) => {
        const { quantite = 1, ...itemData } = nouvelItem;
        set({
          items: [{ ...itemData, quantite }],
          isOpen: false,
          lastSavedAt: Date.now(),
        });
      },

      retirerItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
          lastSavedAt: Date.now(),
        }));
      },

      modifierQuantite: (variantId, quantite) => {
        if (quantite <= 0) {
          get().retirerItem(variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantite: Math.min(quantite, 99) } : i,
          ),
          lastSavedAt: Date.now(),
        }));
      },

      viderPanier: () => set({ items: [], lastSavedAt: Date.now() }),
      ouvrirPanier: () => set({ isOpen: true }),
      fermerPanier: () => set({ isOpen: false }),
      togglePanier: () => set((state) => ({ isOpen: !state.isOpen })),

      getSousTotal: () => get().items.reduce((acc, i) => acc + i.prix * i.quantite, 0),

      getFraisLivraison: (ville = LIVRAISON_CONFIG.villeParDefaut) => {
        const { fraisLivraison } = calculerTotauxCommande(get().items, ville);
        return fraisLivraison;
      },

      getTotalAvecLivraison: (ville = LIVRAISON_CONFIG.villeParDefaut) => {
        const { total } = calculerTotauxCommande(get().items, ville);
        return total;
      },
    }),
    {
      name: 'kabishop-panier',
      partialize: (state) => ({
        items: state.items,
        lastSavedAt: state.lastSavedAt,
      }),
    },
  ),
);

export function creerItemPanier(input: {
  variantId: string;
  productId: string;
  nomProduit: string;
  slug: string;
  image: string;
  prixProduit: number;
  prixVariante?: number | null;
  taille?: string | null;
  couleur?: string | null;
  quantite?: number;
}): AjouterPanierInput {
  return {
    variantId: input.variantId,
    productId: input.productId,
    nomProduit: input.nomProduit,
    slug: input.slug,
    image: input.image,
    prix: input.prixVariante != null ? Number(input.prixVariante) : input.prixProduit,
    taille: input.taille ?? undefined,
    couleur: input.couleur ?? undefined,
    quantite: input.quantite ?? 1,
  };
}
