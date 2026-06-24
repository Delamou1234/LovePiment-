export type Coupon = {
  id: string;
  code: string;
  type: 'POURCENT' | 'MONTANT_FIXE';
  valeur: number;
  minCommande: number | null;
  maxUtilisations: number | null;
  utilisations: number;
  actif: boolean;
  debut: string | null;
  fin: string | null;
};

export type FlashSale = {
  id: string;
  titre: string;
  slug: string;
  description: string | null;
  debut: string;
  fin: string;
  actif: boolean;
  productIds: string[];
};

export type ProduitRef = { id: string; nom: string };
