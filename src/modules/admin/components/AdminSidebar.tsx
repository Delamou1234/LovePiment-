'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Shield, Store, X } from 'lucide-react';
import {
  ADMIN_NAV_GROUPS,
  ADMIN_SIDEBAR_WIDTH,
  isAdminNavActive,
  resolveAdminNavLabel,
  type AdminNavItem,
  type AdminSessionUser,
} from './admin-ui';

const NAV_BTN =
  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs leading-none transition';

const NAV_BTN_ACTIVE = 'bg-white/15 text-white font-semibold';
const NAV_BTN_IDLE = 'text-white/75 hover:bg-white/10 hover:text-white';

type Props = {
  admin: AdminSessionUser;
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  messagerieUnread?: number;
};

function AdminInitials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white ring-2 ring-white/20">
      {initials || 'A'}
    </div>
  );
}

function SidebarContent({
  admin,
  onLogout,
  onMobileClose,
  messagerieUnread = 0,
}: Omit<Props, 'mobileOpen'>) {
  const pathname = usePathname();

  const renderItem = (item: AdminNavItem) => {
    const Icon = item.icon;
    const active = isAdminNavActive(pathname, item.href, item.exact);

    const badge =
      item.href === '/admin/messagerie' && messagerieUnread > 0
        ? String(messagerieUnread > 99 ? '99+' : messagerieUnread)
        : undefined;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onMobileClose}
        className={`${NAV_BTN} ${active ? NAV_BTN_ACTIVE : NAV_BTN_IDLE}`}
      >
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" />
        <span className="truncate flex-1">{item.label}</span>
        {badge && (
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-bold shrink-0">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-white/10 px-4 py-4">
        <Link href="/admin" className="block" onClick={onMobileClose}>
          <p className="font-serif text-lg font-bold text-white">KabiShop</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45 mt-0.5">
            Back-office
          </p>
        </Link>
      </div>

      <div className="shrink-0 border-b border-white/10 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <AdminInitials name={admin.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{admin.name}</p>
            <p className="truncate text-[10px] text-white/50">{admin.email}</p>
          </div>
        </div>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/80">
          <Shield className="h-3 w-3" />
          Administrateur
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-4">
          {ADMIN_NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-1 px-2 text-[9px] font-bold uppercase tracking-widest text-white/35">
                {group.title}
              </p>
              <div className="space-y-px">{group.items.map(renderItem)}</div>
            </div>
          ))}
        </div>
      </nav>

      <div className="shrink-0 border-t border-white/10 px-2 py-2 space-y-1">
        <Link
          href="/"
          onClick={onMobileClose}
          className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium text-white/55 hover:bg-white/10 hover:text-white transition"
        >
          <Store className="h-3.5 w-3.5" />
          Voir la boutique
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium text-white/55 hover:bg-white/10 hover:text-white transition"
        >
          <LogOut className="h-3.5 w-3.5" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

export function AdminSidebar({
  admin,
  onLogout,
  mobileOpen,
  onMobileClose,
  messagerieUnread,
}: Props) {
  return (
    <>
      <aside
        className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex ${ADMIN_SIDEBAR_WIDTH} shrink-0 flex-col bg-olive h-screen overflow-hidden`}
      >
        <SidebarContent admin={admin} onLogout={onLogout} messagerieUnread={messagerieUnread} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-[220px] max-w-[85vw] flex-col bg-olive shadow-2xl animate-slideInLeft h-full overflow-hidden">
            <button
              type="button"
              onClick={onMobileClose}
              className="absolute top-3 right-3 z-10 rounded-lg p-2 text-white/70 hover:bg-white/10"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              admin={admin}
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
    <div className="lg:hidden shrink-0 border-b border-beige-border bg-white px-3 py-2 flex items-center gap-2">
      <button
        type="button"
        onClick={onMenuOpen}
        className="shrink-0 rounded-lg border border-beige-border px-3 py-2 text-xs font-semibold text-olive"
      >
        Menu
      </button>
      <p className="text-sm font-semibold text-zinc-800 truncate flex-1">
        {resolveAdminNavLabel(pathname)}
      </p>
      {messagerieUnread > 0 && (
        <span className="shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {messagerieUnread > 99 ? '99+' : messagerieUnread}
        </span>
      )}
    </div>
  );
}
