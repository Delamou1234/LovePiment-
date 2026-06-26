export type AvisClientPublic = {
  id: string;
  nom: string;
  ville: string;
  commentaire: string;
  date: string;
  note?: number;
  photos?: string[];
  achatVerifie?: boolean;
  productNom?: string;
  avatarUrl?: string | null;
  avatarCouleur?: string | null;
};

/** @deprecated Utiliser anonymiserNomClient depuis @/modules/avis/lib/anonymiser */
export { anonymiserNomClient } from '@/modules/avis/lib/anonymiser';
