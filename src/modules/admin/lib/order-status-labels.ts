export type FiltreCommandeAdmin =
  | 'toutes'
  | 'non_payee'
  | 'payee'
  | 'non_livree'
  | 'livree'
  | 'en_cours'
  | 'annulee';

export const FILTRES_COMMANDE_ADMIN: { id: FiltreCommandeAdmin; label: string }[] = [
  { id: 'toutes', label: 'Toutes' },
  { id: 'non_payee', label: 'Non payées' },
  { id: 'payee', label: 'Payées' },
  { id: 'non_livree', label: 'Non livrées' },
  { id: 'livree', label: 'Livrées' },
  { id: 'en_cours', label: 'En cours' },
  { id: 'annulee', label: 'Annulées' },
];

export function libelleStatutCommande(statut: string): string {
  const map: Record<string, string> = {
    EN_ATTENTE: 'En attente',
    PAYEE: 'Payée',
    EN_PREPARATION: 'En préparation',
    EXPEDIEE: 'Expédiée',
    LIVREE: 'Livrée',
    ANNULEE: 'Annulée',
  };
  return map[statut] ?? statut;
}

export function libelleStatutPaiement(statut: string): string {
  const map: Record<string, string> = {
    EN_ATTENTE: 'En attente',
    REUSSIE: 'Payé',
    ECHOUEE: 'Non payé',
    REMBOURSEE: 'Remboursé',
  };
  return map[statut] ?? statut;
}

export function libelleModePaiement(mode: string): string {
  return mode === 'PAIEMENT_LIVRAISON' ? 'À la livraison' : 'En ligne (CinetPay)';
}

export function classeBadgeStatutCommande(statut: string): string {
  switch (statut) {
    case 'LIVREE':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-200/60';
    case 'EXPEDIEE':
    case 'EN_PREPARATION':
      return 'bg-sky-50 text-sky-800 ring-sky-200/60';
    case 'PAYEE':
      return 'bg-indigo-50 text-indigo-800 ring-indigo-200/60';
    case 'ANNULEE':
      return 'bg-zinc-100 text-zinc-600 ring-zinc-200/60';
    default:
      return 'bg-amber-50 text-amber-800 ring-amber-200/60';
  }
}

export function classeBadgePaiement(statut: string): string {
  switch (statut) {
    case 'REUSSIE':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-200/60';
    case 'ECHOUEE':
      return 'bg-red-50 text-red-800 ring-red-200/60';
    case 'REMBOURSEE':
      return 'bg-violet-50 text-violet-800 ring-violet-200/60';
    default:
      return 'bg-amber-50 text-amber-800 ring-amber-200/60';
  }
}

export function classeBadgeLivraison(statut: string): string {
  return statut === 'LIVREE'
    ? 'bg-emerald-50 text-emerald-800 ring-emerald-200/60'
    : statut === 'ANNULEE'
      ? 'bg-zinc-100 text-zinc-500 ring-zinc-200/60'
      : 'bg-orange-50 text-orange-800 ring-orange-200/60';
}

export function libelleLivraison(statut: string, livreeLe?: string | null): string {
  if (statut === 'LIVREE') {
    return livreeLe ? `Livrée le ${formaterDateCourte(livreeLe)}` : 'Livrée';
  }
  if (statut === 'ANNULEE') return 'Annulée';
  return 'Non livrée';
}

export function formaterDateCourte(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
