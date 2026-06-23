import type { Order, OrderStatus } from '@prisma/client';

/** Délai max pour annuler une commande déjà payée (avant préparation). */
export const DELAI_ANNULATION_PAYEE_MS = 24 * 60 * 60 * 1000;

const STATUTS_NON_ANNULABLES: OrderStatus[] = [
  'EN_PREPARATION',
  'EXPEDIEE',
  'LIVREE',
  'ANNULEE',
];

export type AnnulationEligibilite = {
  peutAnnuler: boolean;
  raison: string | null;
};

export function evaluerAnnulationCommande(order: Pick<Order, 'statut' | 'createdAt'>): AnnulationEligibilite {
  if (order.statut === 'ANNULEE') {
    return { peutAnnuler: false, raison: 'Cette commande est déjà annulée.' };
  }

  if (STATUTS_NON_ANNULABLES.includes(order.statut)) {
    if (order.statut === 'EN_PREPARATION') {
      return {
        peutAnnuler: false,
        raison: 'Votre commande est en cours de préparation et ne peut plus être annulée en ligne.',
      };
    }
    if (order.statut === 'EXPEDIEE') {
      return {
        peutAnnuler: false,
        raison: 'Votre commande a été expédiée. Contactez le support pour toute demande.',
      };
    }
    if (order.statut === 'LIVREE') {
      return { peutAnnuler: false, raison: 'Cette commande a déjà été livrée.' };
    }
    return { peutAnnuler: false, raison: 'Annulation impossible pour cette commande.' };
  }

  if (order.statut === 'EN_ATTENTE') {
    return { peutAnnuler: true, raison: null };
  }

  if (order.statut === 'PAYEE') {
    const age = Date.now() - order.createdAt.getTime();
    if (age > DELAI_ANNULATION_PAYEE_MS) {
      return {
        peutAnnuler: false,
        raison:
          'Le délai d\'annulation (24 h après paiement) est dépassé. Contactez-nous si besoin.',
      };
    }
    return { peutAnnuler: true, raison: null };
  }

  return { peutAnnuler: false, raison: 'Annulation impossible pour cette commande.' };
}
