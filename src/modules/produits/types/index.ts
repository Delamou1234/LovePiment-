import type { Product, ProductVariant, Category } from '@prisma/client';
import type { PrixRange, SortOrder } from '@/types';

// ─── Types du module produits ─────────────────────────────────────────────────

export type ProduitAvecVariantes = Product & {
  variantes: ProductVariant[];
  categorie: Category;
};

export type ProduitAvecCategorie = Product & {
  categorie: Category;
  variantes?: ProductVariant[];
};

export type FiltresProduits = {
  categorieSlug?: string;
  taille?: string;
  couleur?: string;
  marque?: string;
  enStock?: boolean;
  prix?: PrixRange;
  search?: string;
  actif?: boolean;
  featured?: boolean;
  enPromo?: boolean;
};

export type TriProduits = {
  champ: 'prix' | 'createdAt' | 'nom' | 'featured';
  ordre: SortOrder;
};

export type CategorieArbre = Category & {
  children: Category[];
};

export type FacettesCatalogue = {
  tailles: string[];
  couleurs: string[];
  marques: string[];
  prixMin: number;
  prixMax: number;
};

export type CreerProduitDto = {
  nom: string;
  slug: string;
  marque?: string;
  description?: string;
  prix: number;
  images: string[];
  categorieId: string;
  actif?: boolean;
  featured?: boolean;
  prixPromo?: number | null;
  promoDebut?: string | null;
  promoFin?: string | null;
  variantes?: {
    id?: string;
    taille?: string;
    couleur?: string;
    capacite?: string;
    stock: number;
    sku?: string;
    codeBarre?: string;
    prix?: number;
  }[];
};

export type ModifierProduitDto = Partial<CreerProduitDto>;

export type StockVarianteClient = {
  id: string;
  taille: string | null;
  couleur: string | null;
  capacite: string | null;
  stock: number;
  sku: string | null;
  codeBarre: string | null;
  prix: number | null;
};

export type SuggestionProduit = {
  type: 'produit';
  id: string;
  nom: string;
  slug: string;
  prix: number;
  image: string | null;
  categorie: string;
};

export type SuggestionCategorie = {
  type: 'categorie';
  nom: string;
  slug: string;
};

export type SuggestionRecherche = SuggestionProduit | SuggestionCategorie;
