import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Boxes,
  FileText,
  FolderTree,
  LayoutDashboard,
  LineChart,
  Mail,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  Tag,
  Truck,
  UserCog,
} from 'lucide-react';

export const ADMIN_CARD =
  'rounded-2xl border border-beige-border/80 bg-white shadow-sm ring-1 ring-black/[0.02]';

export const ADMIN_CARD_PAD = 'p-5 md:p-6';

export const ADMIN_BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-olive px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark disabled:opacity-60';

export const ADMIN_WIDGET_LINK =
  'text-xs font-semibold text-olive hover:text-olive-dark transition';

export const ADMIN_SIDEBAR_WIDTH = 'lg:w-[260px]';
export const ADMIN_SIDEBAR_OFFSET = 'lg:ml-[260px]';

export const ADMIN_SHELL = 'h-dvh overflow-hidden bg-[#f4f5f7]';
export const ADMIN_MAIN = `flex h-dvh flex-col overflow-hidden ${ADMIN_SIDEBAR_OFFSET}`;
export const ADMIN_MAIN_SCROLL = 'flex-1 min-h-0 overflow-y-auto p-4 md:p-5 lg:p-6';

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: 'Tableau de bord',
    items: [{ href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true }],
  },
  {
    title: 'Catalogue',
    items: [
      { href: '/admin/produits', label: 'Produits', icon: Package },
      { href: '/admin/categories', label: 'Catégories', icon: FolderTree },
      { href: '/admin/stocks', label: 'Stocks', icon: Boxes },
      { href: '/admin/promotions', label: 'Page Promotions', icon: Tag },
    ],
  },
  {
    title: 'Ventes',
    items: [
      { href: '/admin/commandes', label: 'Commandes', icon: ShoppingBag },
      { href: '/admin/utilisateurs', label: 'Utilisateurs', icon: UserCog },
      { href: '/admin/livreurs', label: 'Livreurs', icon: Truck },
    ],
  },
  {
    title: 'Marketing',
    items: [{ href: '/admin/avis', label: 'Avis clients', icon: MessageSquare }],
  },
  {
    title: 'Communication',
    items: [
      { href: '/admin/messagerie', label: 'Messagerie', icon: MessageSquare },
      { href: '/admin/contact', label: 'Contact', icon: Mail },
    ],
  },
  {
    title: 'Analyse',
    items: [
      { href: '/admin/bi', label: 'Business Intelligence', icon: LineChart },
      { href: '/admin/trafic', label: 'Rapports trafic', icon: BarChart3 },
    ],
  },
  {
    title: 'Système',
    items: [
      { href: '/admin/apropos', label: 'Page À propos', icon: FileText },
      { href: '/admin/parametres', label: 'Paramètres', icon: Settings },
    ],
  },
];

export type AdminSessionUser = {
  id: string;
  email: string;
  name: string;
  role: 'admin';
};

export function isAdminNavActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact || href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function resolveAdminNavLabel(pathname: string): string {
  const items = ADMIN_NAV_GROUPS.flatMap((g) => g.items);
  const match = items.find((item) => isAdminNavActive(pathname, item.href, item.exact));
  return match?.label ?? 'Administration';
}

export const ADMIN_TOPBAR_QUICK = 'admin-topbar-quick';
export const ADMIN_TOPBAR_QUICK_ACTIVE = 'admin-topbar-quick is-active';
export const ADMIN_TOPBAR_BELL = 'admin-topbar-quick admin-topbar-bell';
export const ADMIN_TOPBAR_BADGE = 'admin-topbar-badge';
export const ADMIN_TOPBAR_LIVE = 'admin-topbar-live';

export function adminTopbarQuick(active?: boolean) {
  return active ? ADMIN_TOPBAR_QUICK_ACTIVE : ADMIN_TOPBAR_QUICK;
}
