import type { Product, ProductVariant, Category } from '@prisma/client';
import type { PrixRange, SortOrder } from '@/types';

// ─── Types du module produits ─────────────────────────────────────────────────

export type ProduitAvecVariantes = Product & {
  variantes: ProductVariant[];
  categorie: Category;
};

export type ProduitAvecCategorie = Product & {
  categorie: Category;
};

export type FiltresProduits = {
  categorieSlug?: string;
  taille?: string;
  couleur?: string;
  prix?: PrixRange;
  search?: string;
  actif?: boolean;
  featured?: boolean;
};

export type TriProduits = {
  champ: 'prix' | 'createdAt' | 'nom';
  ordre: SortOrder;
};

export type CreerProduitDto = {
  nom: string;
  slug: string;
  description?: string;
  prix: number;
  images: string[];
  categorieId: string;
  actif?: boolean;
  featured?: boolean;
  variantes?: {
    taille?: string;
    couleur?: string;
    stock: number;
    sku?: string;
    prix?: number;
  }[];
};

export type ModifierProduitDto = Partial<CreerProduitDto>;
