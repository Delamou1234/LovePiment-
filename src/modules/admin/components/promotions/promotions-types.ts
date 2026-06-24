export type ProduitPromo = {
  id: string;
  nom: string;
  slug: string;
  prix: number;
  prixPromo: number | null;
  promoDebut: string | null;
  promoFin: string | null;
  featured: boolean;
  actif: boolean;
  images: string[];
};

export type FiltrePromo = '' | 'promo' | 'sans-promo' | 'en-cours' | 'vedette' | 'inactif';
