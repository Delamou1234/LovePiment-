export {
  COMPTE_CARD,
  COMPTE_CARD_PAD,
  COMPTE_MAIN,
  COMPTE_MAIN_SCROLL,
  COMPTE_SECTION_DESC,
  COMPTE_SECTION_TITLE,
  COMPTE_SHELL,
  COMPTE_SIDEBAR_WIDTH,
} from '@/modules/compte/components/compte-ui';

export type CourierNavItem =
  | {
      kind: 'section';
      id: 'livraisons' | 'historique';
      label: string;
      href: string;
      badge?: string;
    }
  | { kind: 'link'; href: string; label: string };

export type CourierNavGroup = {
  title: string;
  items: CourierNavItem[];
};

const COURIER_LIVRAISON_ITEMS: CourierNavItem[] = [
  { kind: 'section', id: 'livraisons', label: 'En cours', href: '/livreur' },
  { kind: 'section', id: 'historique', label: 'Historique', href: '/livreur/historique' },
];

const COURIER_CLIENT_ITEMS: CourierNavItem[] = [
  { kind: 'link', href: '/compte', label: 'Tableau de bord client' },
  { kind: 'link', href: '/compte?section=commandes', label: 'Mes achats' },
  { kind: 'link', href: '/compte/profil', label: 'Mon profil client' },
];

const COURIER_BOUTIQUE_ITEMS: CourierNavItem[] = [
  { kind: 'link', href: '/produits', label: 'Acheter' },
  { kind: 'link', href: '/panier', label: 'Mon panier' },
];

const COURIER_LIENS_ITEMS: CourierNavItem[] = [
  { kind: 'link', href: '/', label: 'Accueil boutique' },
  { kind: 'link', href: '/contact', label: 'Support' },
];

/** Groupes sidebar livreur — livraisons d'abord, puis espace client, boutique. */
export function construireGroupesSidebarLivreur(): CourierNavGroup[] {
  return [
    { title: 'Espace livreur', items: COURIER_LIVRAISON_ITEMS },
    { title: 'Mon espace client', items: COURIER_CLIENT_ITEMS },
    { title: 'Boutique', items: COURIER_BOUTIQUE_ITEMS },
    { title: 'Liens utiles', items: COURIER_LIENS_ITEMS },
  ];
}

/** @deprecated Préférer construireGroupesSidebarLivreur() */
export const COURIER_NAV_GROUPS: CourierNavGroup[] = construireGroupesSidebarLivreur();

export type CourierProfil = {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  commune: string | null;
  typeEngin: string;
  penalitesCumuleesGn: number;
};
