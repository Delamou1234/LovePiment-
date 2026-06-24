'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Store, X } from 'lucide-react';
import {
  ADMIN_NAV_GROUPS,
  ADMIN_SIDEBAR_WIDTH,
  isAdminNavActive,
  resolveAdminNavLabel,
  type AdminNavItem,
} from '../admin-ui';
import { BrandLogo } from '@/shared/ui/BrandLogo';
import { useAdminStats } from './AdminStatsProvider';

type Props = {
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  messagerieUnread?: number;
};

function SidebarContent({
  onLogout,
  onMobileClose,
  messagerieUnread = 0,
}: Omit<Props, 'mobileOpen'>) {
  const pathname = usePathname();
  const { stats } = useAdminStats();
  const commandesEnAttente = stats?.commandesEnAttente ?? 0;
  const stockFaible = stats?.stockFaible ?? 0;

  const renderItem = (item: AdminNavItem) => {
    const Icon = item.icon;
    const active = isAdminNavActive(pathname, item.href, item.exact);

    const badge =
      item.href === '/admin/commandes' && commandesEnAttente > 0
        ? String(commandesEnAttente > 99 ? '99+' : commandesEnAttente)
        : item.href === '/admin/stocks' && stockFaible > 0
          ? String(stockFaible > 99 ? '99+' : stockFaible)
        : item.href === '/admin/messagerie' && messagerieUnread > 0
          ? String(messagerieUnread > 99 ? '99+' : messagerieUnread)
          : undefined;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onMobileClose}
        className={`admin-sidebar-link ${active ? 'is-active' : ''}`}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        <span className="truncate flex-1">{item.label}</span>
        {badge && <span className="admin-sidebar-badge">{badge}</span>}
      </Link>
    );
  };

  const flatItems = ADMIN_NAV_GROUPS.flatMap((g) => g.items);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="admin-sidebar-brand">
        <BrandLogo
          href="/admin"
          size="lg"
          onClick={onMobileClose}
          className="admin-sidebar-logo !h-14 lg:!h-16 w-auto max-w-full"
        />
      </div>

      <nav className="admin-sidebar-nav">
        {flatItems.map(renderItem)}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-footer-actions">
          <Link href="/" onClick={onMobileClose} className="admin-sidebar-footer-link">
            <Store className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span className="truncate">Voir la boutique</span>
          </Link>
          <button type="button" onClick={onLogout} className="admin-sidebar-footer-link">
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            <span className="truncate">Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar({
  onLogout,
  mobileOpen,
  onMobileClose,
  messagerieUnread,
}: Props) {
  return (
    <>
      <aside
        className={`admin-sidebar hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex ${ADMIN_SIDEBAR_WIDTH} shrink-0 flex-col h-dvh overflow-hidden`}
      >
        <SidebarContent onLogout={onLogout} messagerieUnread={messagerieUnread} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} aria-hidden />
          <aside className="admin-sidebar absolute inset-y-0 left-0 flex w-[260px] max-w-[85vw] flex-col shadow-2xl animate-slideInLeft h-full overflow-hidden">
            <button
              type="button"
              onClick={onMobileClose}
              className="absolute top-3 right-3 z-10 rounded-lg p-2 text-white/70 hover:bg-white/10"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              onLogout={onLogout}
              onMobileClose={onMobileClose}
              messagerieUnread={messagerieUnread}
            />
          </aside>
        </div>
      )}
    </>
  );
}

export function AdminMobileNav({
  onMenuOpen,
  messagerieUnread = 0,
}: {
  onMenuOpen: () => void;
  messagerieUnread?: number;
}) {
  const pathname = usePathname();

  return (
    <div className="lg:hidden shrink-0 border-b border-zinc-200 bg-white px-3 py-2 flex items-center gap-2">
      <button
        type="button"
        onClick={onMenuOpen}
        className="shrink-0 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-[#e91e8c]"
      >
        Menu
      </button>
      <p className="text-sm font-semibold text-zinc-800 truncate flex-1">
        {resolveAdminNavLabel(pathname)}
      </p>
      {messagerieUnread > 0 && (
        <span className="shrink-0 rounded-full bg-[#e91e8c] px-1.5 py-0.5 text-[10px] font-bold text-white">
          {messagerieUnread > 99 ? '99+' : messagerieUnread}
        </span>
      )}
    </div>
  );
}
