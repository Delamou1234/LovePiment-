export type AvisProduitPublic = {
  id: string;
  nom: string;
  ville: string | null;
  note: number;
  commentaire: string;
  photos: string[];
  achatVerifie: boolean;
  date: string;
  productNom?: string;
  avatarUrl?: string | null;
  avatarCouleur?: string | null;
};

export type AvisProduitStats = {
  moyenne: number;
  total: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type CreerAvisDto = {
  productId: string;
  orderId: string;
  note: number;
  commentaire: string;
  photos?: string[];
};

export type AvisEligible = {
  orderId: string;
  productId: string;
  productNom: string;
  productSlug: string;
  productImage: string | null;
  commandeDate: string;
};

export type AvisAdmin = {
  id: string;
  note: number;
  commentaire: string;
  photos: string[];
  achatVerifie: boolean;
  statut: 'EN_ATTENTE' | 'APPROUVE' | 'REFUSE';
  createdAt: string;
  clientNom: string;
  clientVille: string;
  productId: string;
  productNom: string;
  productSlug: string;
};
