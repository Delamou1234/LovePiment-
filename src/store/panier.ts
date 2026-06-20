import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface PanierState {
  items: PanierItem[];
  isOpen: boolean;

  // Actions
  ajouterItem: (item: Omit<PanierItem, 'quantite'> & { quantite?: number }) => void;
  retirerItem: (variantId: string) => void;
  modifierQuantite: (variantId: string, quantite: number) => void;
  viderPanier: () => void;
  ouvrirPanier: () => void;
  fermerPanier: () => void;
  togglePanier: () => void;

  // Computed (recalculés à la volée)
  get totalItems(): number;
  get totalPrix(): number;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePanier = create<PanierState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      ajouterItem: (nouvelItem) => {
        const { quantite = 1, ...itemData } = nouvelItem;
        set((state) => {
          const existant = state.items.find((i) => i.variantId === itemData.variantId);

          if (existant) {
            return {
              items: state.items.map((i) =>
                i.variantId === itemData.variantId
                  ? { ...i, quantite: i.quantite + quantite }
                  : i,
              ),
              isOpen: true,
            };
          }

          return {
            items: [...state.items, { ...itemData, quantite }],
            isOpen: true,
          };
        });
      },

      retirerItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        }));
      },

      modifierQuantite: (variantId, quantite) => {
        if (quantite <= 0) {
          get().retirerItem(variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantite } : i,
          ),
        }));
      },

      viderPanier: () => set({ items: [] }),
      ouvrirPanier: () => set({ isOpen: true }),
      fermerPanier: () => set({ isOpen: false }),
      togglePanier: () => set((state) => ({ isOpen: !state.isOpen })),

      get totalItems() {
        return get().items.reduce((acc, i) => acc + i.quantite, 0);
      },

      get totalPrix() {
        return get().items.reduce((acc, i) => acc + i.prix * i.quantite, 0);
      },
    }),
    {
      name: 'kabishop-panier',
      // Persiste uniquement les items (pas l'état isOpen)
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
