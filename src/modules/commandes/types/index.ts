import type { Order, OrderItem, ProductVariant } from '@prisma/client';

// ─── Types du module commandes ────────────────────────────────────────────────

export type CommandeAvecItems = Order & {
  courier?: { id: string; nom: string } | null;
  deliveryRun?: { id: string; label: string | null } | null;
  items: (OrderItem & {
    variante: ProductVariant & {
      produit: { nom: string; images: string[]; slug: string };
    };
  })[];
};

export type CreerCommandeDto = {
  customerId?: string;
  clientNom: string;
  clientTelephone: string;
  clientAdresse: string;
  clientVille: string;
  clientLatitude?: number | null;
  clientLongitude?: number | null;
  modePaiement: 'CINETPAY' | 'PAIEMENT_LIVRAISON';
  items: {
    variantId: string;
    quantite: number;
    prixUnitaire: number;
  }[];
  codeCoupon?: string | null;
  pointsUtilises?: number;
  codeParrainage?: string | null;
};

export type FiltresCommandes = {
  statut?: string;
  statutIn?: string[];
  statutNotIn?: string[];
  statutPaiement?: string;
  statutPaiementNot?: string;
  modePaiement?: string;
  dateDebut?: Date;
  dateFin?: Date;
};
