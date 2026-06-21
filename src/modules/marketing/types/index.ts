export type CouponClient = {
  id: string;
  code: string;
  type: 'POURCENT' | 'MONTANT_FIXE';
  valeur: number;
  minCommande: number | null;
  remiseEstimee: number;
};

export type TotauxMarketing = {
  sousTotal: number;
  remiseCoupon: number;
  remisePoints: number;
  remiseParrainage: number;
  fraisLivraison: number;
  montantTotal: number;
  livraisonGratuite: boolean;
  pointsUtilises: number;
  pointsGagnes: number;
  couponId: string | null;
  codeParrainageUtilise: string | null;
};

export type CalculRemisesInput = {
  sousTotal: number;
  clientVille: string;
  customerId?: string;
  codeCoupon?: string | null;
  pointsUtilises?: number;
  codeParrainage?: string | null;
};

export type CreerCouponDto = {
  code: string;
  type: 'POURCENT' | 'MONTANT_FIXE';
  valeur: number;
  minCommande?: number | null;
  maxUtilisations?: number | null;
  actif?: boolean;
  debut?: Date | null;
  fin?: Date | null;
};

export type CreerFlashSaleDto = {
  titre: string;
  slug: string;
  description?: string | null;
  debut: Date;
  fin: Date;
  actif?: boolean;
  productIds: string[];
};
