export type CustomerProfile = {
  id: string;
  email: string;
  nom: string;
  telephone: string | null;
  avatarUrl: string | null;
  avatarCouleur: string;
  adressePreferee: string | null;
  villePreferee: string | null;
  viaGoogle: boolean;
  viaFacebook: boolean;
  viaApple: boolean;
  peutChangerMotDePasse: boolean;
  inscritLe: string;
  stats: {
    commandes: number;
    totalDepense: number;
  };
  pointsFidelite: number;
  codeParrainage: string;
};

export type CustomerOrderResume = {
  id: string;
  statut: string;
  montantTotal: number;
  createdAt: string;
  suiviToken: string | null;
  itemsCount: number;
  peutAnnuler: boolean;
};

export type CustomerOrderItem = {
  id: string;
  quantite: number;
  prixUnitaire: number;
  produit: {
    nom: string;
    slug: string;
    image: string | null;
  };
  variante: {
    label: string | null;
  };
};

export type CustomerOrderDetail = {
  id: string;
  statut: string;
  statutPaiement: string;
  modePaiement: string;
  montantTotal: number;
  sousTotal: number | null;
  fraisLivraison: number | null;
  remiseCoupon: number;
  remisePoints: number;
  remiseParrainage: number;
  pointsUtilises: number;
  createdAt: string;
  suiviToken: string;
  clientNom: string;
  clientTelephone: string;
  clientAdresse: string;
  clientVille: string;
  items: CustomerOrderItem[];
  peutAnnuler: boolean;
  raisonNonAnnulation: string | null;
};

export type CustomerAddress = {
  id: string;
  label: string | null;
  adresse: string;
  ville: string;
  telephone: string | null;
  parDefaut: boolean;
  createdAt: string;
};

export type WishlistItemClient = {
  id: string;
  productId: string;
  addedAt: string;
  product: {
    id: string;
    nom: string;
    slug: string;
    prix: number;
    prixPromo: number | null;
    image: string | null;
    categorie: string;
    enStock: boolean;
    variante: { id: string; stock: number } | null;
  };
};

export type MettreAJourProfilDto = {
  nom?: string;
  telephone?: string | null;
  adressePreferee?: string | null;
  villePreferee?: string | null;
  avatarCouleur?: string;
};

export const AVATAR_COULEURS = [
  { id: 'olive', label: 'Olive', hex: '#4a5240' },
  { id: 'noir', label: 'Noir', hex: '#18181b' },
  { id: 'rose', label: 'Rose', hex: '#be123c' },
  { id: 'ambre', label: 'Ambre', hex: '#d97706' },
  { id: 'bleu', label: 'Bleu', hex: '#2563eb' },
  { id: 'violet', label: 'Violet', hex: '#7c3aed' },
] as const;

export type AvatarCouleurId = (typeof AVATAR_COULEURS)[number]['id'];

export function couleurAvatar(id: string | null | undefined): string {
  return AVATAR_COULEURS.find((c) => c.id === id)?.hex ?? AVATAR_COULEURS[0].hex;
}

export function initialesNom(nom: string): string {
  return nom
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
