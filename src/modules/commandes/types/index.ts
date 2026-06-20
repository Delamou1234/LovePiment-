import type { Order, OrderItem, ProductVariant } from '@prisma/client';

// ─── Types du module commandes ────────────────────────────────────────────────

export type CommandeAvecItems = Order & {
  items: (OrderItem & {
    variante: ProductVariant & {
      produit: { nom: string; images: string[]; slug: string };
    };
  })[];
};

export type CreerCommandeDto = {
  clientNom: string;
  clientTelephone: string;
  clientAdresse: string;
  clientVille: string;
  modePaiement: 'CINETPAY' | 'PAIEMENT_LIVRAISON';
  items: {
    variantId: string;
    quantite: number;
    prixUnitaire: number;
  }[];
};

export type FiltresCommandes = {
  statut?: string;
  modePaiement?: string;
  dateDebut?: Date;
  dateFin?: Date;
};
