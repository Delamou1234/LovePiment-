'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  ShoppingBag,
  Store,
} from 'lucide-react';
import { AdminSearchBar } from './AdminSearchBar';
import { DashboardHomeButton } from '@/shared/ui/DashboardHomeButton';
import { AdminNotificationBell } from './AdminNotificationBell';
import { AdminMessagesMenu } from './AdminMessagesMenu';
import { AdminStockAlertsMenu } from './AdminStockAlertsMenu';
import { useAdminStats } from './AdminStatsProvider';
import type { ConversationResume } from '@/modules/messagerie/types';
import {
  adminTopbarQuick,
  isAdminNavActive,
  resolveAdminNavLabel,
  type AdminSessionUser,
} from '../admin-ui';

type Props = {
  admin: AdminSessionUser;
  onLogout: () => void;
  conversations: ConversationResume[];
  messagerieUnread: number;
  stockFaible?: number;
};

const MENU_ITEMS = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/admin/commandes', label: 'Commandes', icon: ShoppingBag },
  { href: '/admin/messagerie', label: 'Messagerie', icon: MessageSquare },
  { href: '/admin/parametres', label: 'Paramètres', icon: Settings },
] as const;

function AdminInitials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return <div className="admin-topbar-avatar">{initials || 'A'}</div>;
}

export function AdminTopBar({
  admin,
  onLogout,
  conversations,
  messagerieUnread,
  stockFaible = 0,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { stats } = useAdminStats();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pageTitle = resolveAdminNavLabel(pathname);
  const isDashboard = pathname === '/admin';

  const commandesEnAttente = stats?.commandesEnAttente ?? 0;

  const isCommandesActive = isAdminNavActive(pathname, '/admin/commandes');
  const isParametresActive = isAdminNavActive(pathname, '/admin/parametres');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    onLogout();
  };

  const commandesBadge =
    commandesEnAttente > 0
      ? String(commandesEnAttente > 99 ? '99+' : commandesEnAttente)
      : null;

  return (
    <header className="relative z-30 shrink-0 border-b border-zinc-200/80 bg-white px-4 py-2.5 md:px-6 lg:px-8">
      <div className="flex items-center gap-3 md:gap-4">
        {!isDashboard && (
          <>
            <div className="hidden min-w-0 shrink-0 md:block md:max-w-[140px] lg:max-w-[180px]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Administration
              </p>
              <h1 className="font-serif text-base font-bold text-zinc-900 truncate lg:text-lg">
                {pageTitle}
              </h1>
            </div>
            <div className="admin-topbar-divider hidden md:block" aria-hidden />
          </>
        )}

        <DashboardHomeButton variant="admin" className="shrink-0" />

        <AdminSearchBar className="min-w-0 flex-1 sm:flex-none sm:w-[180px] md:w-[240px] lg:w-[320px]" />

        <div className="hidden min-w-2 flex-1 sm:block" aria-hidden />

        <nav className="flex shrink-0 items-center gap-1 sm:gap-1.5" aria-label="Raccourcis essentiels">
          <Link
            href="/admin/commandes"
            className={adminTopbarQuick(isCommandesActive)}
            title="Commandes"
            aria-label={
              commandesBadge ? `Commandes (${commandesBadge} en attente)` : 'Commandes'
            }
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
            {commandesBadge && <span className="admin-topbar-badge">{commandesBadge}</span>}
          </Link>

          <AdminMessagesMenu conversations={conversations} totalUnread={messagerieUnread} />

          <AdminStockAlertsMenu count={stockFaible} />

          <Link
            href="/admin/parametres"
            className={`${adminTopbarQuick(isParametresActive)} hidden md:inline-flex`}
            title="Paramètres"
          >
            <Settings className="h-4 w-4" strokeWidth={1.75} />
          </Link>

          <AdminNotificationBell />
        </nav>

        <div className="admin-topbar-divider" aria-hidden />

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={`rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e91e8c]/30 ${
              menuOpen ? 'ring-2 ring-[#e91e8c]/40' : 'hover:ring-2 hover:ring-zinc-300'
            }`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={`Menu admin — ${admin.name}`}
            title={admin.name}
          >
            <AdminInitials name={admin.name} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-[0_12px_40px_rgba(0,0,0,0.1)] animate-fadeIn"
            >
              <div className="border-b border-zinc-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-zinc-900">{admin.name}</p>
                <p className="truncate text-xs text-zinc-500">{admin.email}</p>
                <span className="mt-2 inline-flex rounded-full bg-[#fce7f3] px-2 py-0.5 text-[10px] font-semibold text-[#e91e8c]">
                  Administrateur
                </span>
              </div>

              <div className="py-1">
                {MENU_ITEMS.map((item) => {
                  const { href, label, icon: Icon } = item;
                  const exact = 'exact' in item ? item.exact : undefined;
                  const active = isAdminNavActive(pathname, href, exact);
                  return (
                    <Link
                      key={href}
                      href={href}
                      role="menuitem"
                      onClick={closeMenu}
                      className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition ${
                        active
                          ? 'bg-[#fce7f3]/60 text-[#e91e8c] font-medium'
                          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-80" />
                      {label}
                    </Link>
                  );
                })}
              </div>

              <div className="border-t border-zinc-100 py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    router.push('/');
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900"
                >
                  <Store className="h-4 w-4 shrink-0 opacity-80" />
                  Voir la boutique
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
