export const COMPTE_INPUT =
  'w-full rounded-xl border border-beige-border bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-olive focus:ring-2 focus:ring-olive/10';

export const COMPTE_CARD =
  'rounded-2xl border border-beige-border/80 bg-white shadow-sm ring-1 ring-black/[0.02]';

export const COMPTE_CARD_PAD = 'p-5 md:p-6';

export const COMPTE_SECTION_TITLE =
  'font-serif text-lg md:text-xl font-bold text-zinc-900 tracking-tight';

export const COMPTE_SECTION_DESC = 'mt-1 text-sm text-zinc-500 leading-relaxed';

export const COMPTE_BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-olive px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark disabled:opacity-60';

export const COMPTE_WIDGET_LINK =
  'text-xs font-semibold text-olive hover:text-olive-dark transition';

export const STATUT_STYLES: Record<string, string> = {
  EN_ATTENTE: 'bg-amber-50 text-amber-800 ring-amber-200/60',
  PAYEE: 'bg-sky-50 text-sky-800 ring-sky-200/60',
  EN_PREPARATION: 'bg-violet-50 text-violet-800 ring-violet-200/60',
  EXPEDIEE: 'bg-indigo-50 text-indigo-800 ring-indigo-200/60',
  LIVREE: 'bg-emerald-50 text-emerald-800 ring-emerald-200/60',
  ANNULEE: 'bg-zinc-100 text-zinc-600 ring-zinc-200/60',
};

export const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  PAYEE: 'Payée',
  EN_PREPARATION: 'En préparation',
  EXPEDIEE: 'Expédiée',
  LIVREE: 'Livrée',
  ANNULEE: 'Annulée',
};

export const MODE_PAIEMENT_LABELS: Record<string, string> = {
  CINETPAY: 'Paiement en ligne',
  PAIEMENT_LIVRAISON: 'Paiement à la livraison',
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
  title: string;
  items: CompteNavItem[];
};

export const COMPTE_NAV_GROUPS: CompteNavGroup[] = [
  {
    title: 'Tableau de bord',
    items: [
      { kind: 'section', id: 'dashboard', label: 'Vue d\'ensemble' },
      { kind: 'section', id: 'commandes', label: 'Commandes' },
      { kind: 'section', id: 'favoris', label: 'Favoris' },
      { kind: 'section', id: 'adresses', label: 'Adresses' },
    ],
  },
  {
    title: 'Mon compte',
    items: [{ kind: 'section', id: 'profil', label: 'Infos personnelles' }],
  },
  {
    title: 'Fidélité',
    items: [
      { kind: 'section', id: 'fidelite', label: 'Mes points' },
      { kind: 'section', id: 'avis', label: 'Mes avis' },
    ],
  },
  {
    title: 'Communication',
    items: [
      { kind: 'link', href: '/compte/messages', label: 'Messagerie' },
      { kind: 'link', href: '/contact', label: 'Support' },
    ],
  },
];

/** Seuil VIP fidélité (points). */
export const VIP_POINTS_THRESHOLD = 500;
export const VIP_NEXT_TIER = 2000;

/** Largeur sidebar desktop (utilisée pour le décalage du contenu principal). */
export const COMPTE_SIDEBAR_WIDTH = 'lg:w-[220px]';
export const COMPTE_SIDEBAR_OFFSET = 'lg:ml-[220px]';

/** Shell compte : sidebar fixe + panneau droit scrollable. */
export const COMPTE_SHELL = 'h-screen overflow-hidden bg-cream';
export const COMPTE_MAIN = `flex h-screen flex-col overflow-hidden ${COMPTE_SIDEBAR_OFFSET}`;
export const COMPTE_MAIN_SCROLL = 'flex-1 min-h-0 overflow-y-auto p-4 md:p-6 lg:p-8';
export const COMPTE_MAIN_FILL = 'flex flex-1 min-h-0 flex-col overflow-hidden p-4 md:p-6 lg:p-8';
