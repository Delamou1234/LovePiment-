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
import { ProductSearchBar } from '@/shared/components/ProductSearchBar';
import { AdminNotificationBell } from './AdminNotificationBell';
import { AdminMessagesMenu } from './AdminMessagesMenu';
import type { ConversationResume } from '@/modules/messagerie/types';
import {
  isAdminNavActive,
  resolveAdminNavLabel,
  type AdminSessionUser,
} from '../admin-ui';

type Props = {
  admin: AdminSessionUser;
  onLogout: () => void;
  conversations: ConversationResume[];
  messagerieUnread: number;
};

const QUICK_ACTION =
  'relative flex h-9 w-9 items-center justify-center rounded-xl border border-beige-border bg-white text-zinc-500 shadow-sm transition hover:border-olive/30 hover:text-olive hover:shadow-md';

const QUICK_ACTION_ACTIVE =
  'border-olive/40 bg-olive/5 text-olive shadow-sm';

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

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-olive/10 text-xs font-bold text-olive">
      {initials || 'A'}
    </div>
  );
}

export function AdminTopBar({ admin, onLogout, conversations, messagerieUnread }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pageTitle = resolveAdminNavLabel(pathname);

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

  return (
    <header className="relative z-30 shrink-0 border-b border-beige-border/80 bg-white/80 px-4 py-2.5 backdrop-blur-md md:px-6 lg:px-8">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="hidden min-w-0 shrink-0 md:block md:max-w-[140px] lg:max-w-[180px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Administration
          </p>
          <h1 className="font-serif text-base font-bold text-zinc-900 truncate lg:text-lg">
            {pageTitle}
          </h1>
        </div>

        <div className="hidden h-8 w-px shrink-0 bg-beige-border/80 md:block" aria-hidden />

        <ProductSearchBar
          compact
          placeholder="Rechercher un produit…"
          className="w-[148px] shrink-0 sm:w-[180px] md:w-[200px] lg:w-[220px]"
          inputClassName="border-beige-border bg-cream/50 text-xs shadow-none focus:border-olive/40 focus:bg-white focus:ring-2 focus:ring-olive/10"
        />

        <div className="flex-1 min-w-2" aria-hidden />

        <nav className="flex items-center gap-1 sm:gap-1.5" aria-label="Raccourcis admin">
          <Link href="/" className={QUICK_ACTION} title="Boutique">
            <Store className="h-4 w-4" strokeWidth={1.75} />
          </Link>

          <Link
            href="/admin/commandes"
            className={`${QUICK_ACTION} ${isCommandesActive ? QUICK_ACTION_ACTIVE : ''}`}
            title="Commandes"
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
          </Link>

          <AdminMessagesMenu conversations={conversations} totalUnread={messagerieUnread} />

          <Link
            href="/admin/parametres"
            className={`hidden sm:flex ${QUICK_ACTION} ${isParametresActive ? QUICK_ACTION_ACTIVE : ''}`}
            title="Paramètres"
          >
            <Settings className="h-4 w-4" strokeWidth={1.75} />
          </Link>

          <AdminNotificationBell />
        </nav>

        <div className="hidden h-8 w-px shrink-0 bg-beige-border/80 sm:block" aria-hidden />

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ring-2 transition focus-visible:outline-none focus-visible:ring-olive/40 ${
              menuOpen ? 'ring-olive/50' : 'ring-beige-border hover:ring-olive/30'
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
              className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 overflow-hidden rounded-xl border border-beige-border bg-white py-1 shadow-[0_12px_40px_rgba(0,0,0,0.1)] animate-fadeIn"
            >
              <div className="border-b border-beige-border/80 px-4 py-3">
                <p className="truncate text-sm font-semibold text-zinc-900">{admin.name}</p>
                <p className="truncate text-xs text-zinc-500">{admin.email}</p>
                <span className="mt-2 inline-flex rounded-full bg-olive/10 px-2 py-0.5 text-[10px] font-semibold text-olive">
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
                          ? 'bg-cream text-olive font-medium'
                          : 'text-zinc-600 hover:bg-cream hover:text-zinc-900'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-80" />
                      {label}
                    </Link>
                  );
                })}
              </div>

              <div className="border-t border-beige-border/80 py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    router.push('/');
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-zinc-600 transition hover:bg-cream hover:text-zinc-900"
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
