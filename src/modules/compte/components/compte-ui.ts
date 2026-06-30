export const COMPTE_INPUT =
  'w-full rounded-xl border border-[#ead6de] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#e91e8c] focus:ring-2 focus:ring-[#e91e8c]/10';

export const COMPTE_CARD =
  'rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]';

export const COMPTE_CARD_PAD = 'p-5 md:p-6';

export const COMPTE_SECTION_TITLE =
  'font-serif text-lg md:text-xl font-bold text-zinc-900 tracking-tight';

export const COMPTE_SECTION_DESC = 'mt-1 text-sm text-zinc-500 leading-relaxed';

export const COMPTE_BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#e91e8c] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d01858] disabled:opacity-60';

export const COMPTE_WIDGET_LINK =
  'inline-flex items-center gap-1 text-xs font-semibold text-[#e91e8c] transition hover:text-[#b8105f]';

export const STATUT_STYLES: Record<string, string> = {
  EN_ATTENTE: 'bg-amber-50 text-amber-700 ring-amber-200/80',
  PAYEE: 'bg-sky-50 text-sky-700 ring-sky-200/80',
  EN_PREPARATION: 'bg-violet-50 text-violet-700 ring-violet-200/80',
  EXPEDIEE: 'bg-orange-50 text-orange-700 ring-orange-200/80',
  LIVREE: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
  ANNULEE: 'bg-zinc-100 text-zinc-600 ring-zinc-200/80',
};

export const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  PAYEE: 'Traitée',
  EN_PREPARATION: 'En préparation',
  EXPEDIEE: 'En livraison',
  LIVREE: 'Livrée',
  ANNULEE: 'Annulée',
};

export const MODE_PAIEMENT_LABELS: Record<string, string> = {
  ORANGE_MONEY: 'Orange Money',
};

export const STATUT_PAIEMENT_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  REUSSIE: 'Réussi',
  ECHOUEE: 'Échoué',
  REMBOURSEE: 'Remboursé',
};

export type CompteSectionId =
  | 'dashboard'
  | 'commandes'
  | 'favoris'
  | 'adresses'
  | 'profil'
  | 'fidelite'
  | 'avis';

export type CompteNavItem =
  | { kind: 'section'; id: CompteSectionId; label: string; badge?: string }
  | { kind: 'link'; href: string; label: string; badge?: string };

export type CompteNavGroup = {
  title?: string;
  items: CompteNavItem[];
};

/** Navigation client — sections et liens de l'espace compte. */
export const COMPTE_SIDEBAR_NAV: CompteNavItem[] = [
  { kind: 'section', id: 'dashboard', label: 'Tableau de bord' },
  { kind: 'section', id: 'commandes', label: 'Mes commandes' },
  { kind: 'section', id: 'favoris', label: 'Mes favoris' },
  { kind: 'section', id: 'adresses', label: 'Mes adresses' },
  { kind: 'link', href: '/compte/profil', label: 'Mon profil' },
  { kind: 'section', id: 'avis', label: 'Mes avis' },
  { kind: 'section', id: 'fidelite', label: 'Mes offres & bons' },
  { kind: 'link', href: '/compte/messages', label: "Centre d'aide" },
];

export type CompteLivreurNavItem = {
  id: 'livraisons' | 'historique';
  href: string;
  label: string;
};

/** Liens espace livreur (compte client + livreur). */
export const COMPTE_LIVREUR_NAV: CompteLivreurNavItem[] = [
  { id: 'livraisons', href: '/livreur', label: 'Livraisons en cours' },
  { id: 'historique', href: '/livreur/historique', label: 'Historique livreur' },
];

/** Groupes sidebar selon le type de compte (client seul ou client + livreur). */
export function construireGroupesSidebarCompte(estLivreur: boolean): CompteNavGroup[] {
  const groupeClient: CompteNavGroup = {
    title: estLivreur ? 'Mon espace client' : undefined,
    items: COMPTE_SIDEBAR_NAV,
  };

  if (!estLivreur) {
    return [groupeClient];
  }

  const groupeLivreur: CompteNavGroup = {
    title: 'Espace livreur',
    items: COMPTE_LIVREUR_NAV.map((item) => ({
      kind: 'link' as const,
      href: item.href,
      label: item.label,
    })),
  };

  return [groupeLivreur, groupeClient];
}

export const COMPTE_NAV_GROUPS: CompteNavGroup[] = [
  {
    items: COMPTE_SIDEBAR_NAV,
  },
];

export const VIP_POINTS_THRESHOLD = 500;
export const VIP_NEXT_TIER = 2000;

export const COMPTE_SIDEBAR_WIDTH = 'lg:w-[260px]';
export const COMPTE_SIDEBAR_OFFSET = 'lg:ml-[260px]';

export const COMPTE_SHELL = 'compte-area h-dvh overflow-hidden bg-[#f4f5f7] text-zinc-900';
export const COMPTE_MAIN = `flex h-dvh flex-col overflow-hidden ${COMPTE_SIDEBAR_OFFSET}`;
export const COMPTE_MAIN_SCROLL = 'flex-1 min-h-0 overflow-y-auto p-4 md:p-6 lg:p-8';
export const COMPTE_MAIN_FILL = 'flex flex-1 min-h-0 flex-col overflow-hidden p-4 md:p-6 lg:p-8';

export function prenomClient(nom: string): string {
  return nom.trim().split(/\s+/)[0] || nom;
}
