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
  /** Numéro Orange Money pour le paiement (sinon = clientTelephone). */
  paymentTelephone?: string | null;
  clientAdresse: string;
  clientVille: string;
  clientCommune?: string | null;
  clientQuartier?: string | null;
  clientRepere?: string | null;
  creneauLivraison?: string | null;
  notes?: string | null;
  clientLatitude?: number | null;
  clientLongitude?: number | null;
  modePaiement: 'ORANGE_MONEY';
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
  customerId?: string;
};
