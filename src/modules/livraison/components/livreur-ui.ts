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

export const COURIER_NAV_GROUPS: CourierNavGroup[] = [
  {
    title: 'Livraisons',
    items: [
      { kind: 'section', id: 'livraisons', label: 'En cours', href: '/livreur' },
      { kind: 'section', id: 'historique', label: 'Historique', href: '/livreur/historique' },
    ],
  },
  {
    title: 'Liens utiles',
    items: [
      { kind: 'link', href: '/', label: 'Accueil boutique' },
      { kind: 'link', href: '/contact', label: 'Support' },
    ],
  },
];

export type CourierProfil = {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  commune: string | null;
  typeEngin: string;
  penalitesCumuleesGn: number;
};
