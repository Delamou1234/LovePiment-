import type { Carrier, OrderStatus } from '@prisma/client';

export const STATUTS_SUIVI: OrderStatus[] = [
  'EN_ATTENTE',
  'PAYEE',
  'EN_PREPARATION',
  'EXPEDIEE',
  'LIVREE',
  'ANNULEE',
];

export const LIBELLES_STATUT: Record<OrderStatus, string> = {
  EN_ATTENTE: 'Commande reçue',
  PAYEE: 'Paiement confirmé',
  EN_PREPARATION: 'En préparation',
  EXPEDIEE: 'En cours de livraison',
  LIVREE: 'Livrée',
  ANNULEE: 'Annulée',
};

export const DESCRIPTIONS_STATUT: Record<OrderStatus, string> = {
  EN_ATTENTE: 'Votre commande est enregistrée. Notre équipe prend votre dossier en charge.',
  PAYEE: 'Le paiement est validé. Préparation du colis en cours.',
  EN_PREPARATION: 'Nous préparons votre colis avec soin.',
  EXPEDIEE: 'Votre colis est en route vers votre adresse.',
  LIVREE: 'Commande livrée avec succès. Merci pour votre confiance !',
  ANNULEE: 'Cette commande a été annulée.',
};

type EstimationInput = {
  statut: OrderStatus;
  clientVille: string;
  createdAt: Date;
  carrier?: Pick<Carrier, 'delaiMinHeures' | 'delaiMaxHeures'> | null;
  livraisonEstimee?: Date | null;
  livreeLe?: Date | null;
};

export function estimerLivraison(input: EstimationInput): {
  dateMin: Date;
  dateMax: Date;
  libelle: string;
} {
  if (input.livreeLe) {
    return {
      dateMin: input.livreeLe,
      dateMax: input.livreeLe,
      libelle: `Livrée le ${formaterDate(input.livreeLe)}`,
    };
  }

  if (input.livraisonEstimee && input.statut !== 'ANNULEE') {
    const min = new Date(input.livraisonEstimee);
    const max = new Date(input.livraisonEstimee);
    max.setHours(max.getHours() + 12);
    return {
      dateMin: min,
      dateMax: max,
      libelle: `Livraison estimée : ${formaterDate(min)}`,
    };
  }

  const base = new Date(input.createdAt);
  const horsConakry = input.clientVille.trim().toLowerCase() !== 'conakry';
  const minH = input.carrier?.delaiMinHeures ?? (horsConakry ? 48 : 24);
  const maxH = input.carrier?.delaiMaxHeures ?? (horsConakry ? 72 : 48);

  let extraMin = 0;
  let extraMax = 0;

  switch (input.statut) {
    case 'EN_ATTENTE':
      extraMin = 0;
      extraMax = 0;
      break;
    case 'PAYEE':
    case 'EN_PREPARATION':
      extraMin = 0;
      extraMax = 0;
      break;
    case 'EXPEDIEE':
      extraMin = Math.max(0, minH - 12);
      extraMax = Math.max(0, maxH - 24);
      break;
    case 'ANNULEE':
      return {
        dateMin: base,
        dateMax: base,
        libelle: 'Commande annulée',
      };
    default:
      break;
  }

  const dateMin = addHours(base, minH + extraMin);
  const dateMax = addHours(base, maxH + extraMax);

  return {
    dateMin,
    dateMax,
    libelle: `Entre ${formaterDate(dateMin)} et ${formaterDate(dateMax)}`,
  };
}

export function calculerLivraisonEstimee(
  createdAt: Date,
  clientVille: string,
  carrier?: Pick<Carrier, 'delaiMinHeures' | 'delaiMaxHeures'> | null,
): Date {
  const horsConakry = clientVille.trim().toLowerCase() !== 'conakry';
  const maxH = carrier?.delaiMaxHeures ?? (horsConakry ? 72 : 48);
  return addHours(createdAt, maxH);
}

export function messageNotification(
  statut: OrderStatus,
  numeroSuivi?: string | null,
  carrierNom?: string | null,
): string {
  const base = LIBELLES_STATUT[statut];
  const parts = [base];
  if (carrierNom) parts.push(`Transporteur : ${carrierNom}`);
  if (numeroSuivi) parts.push(`N° suivi : ${numeroSuivi}`);
  return parts.join(' · ');
}

export function formaterDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function addHours(date: Date, hours: number): Date {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
}

export function indexStatut(statut: OrderStatus): number {
  return STATUTS_SUIVI.indexOf(statut);
}

export function statutAtteint(current: OrderStatus, target: OrderStatus): boolean {
  if (current === 'ANNULEE' || target === 'ANNULEE') return current === target;
  return indexStatut(current) >= indexStatut(target);
}
