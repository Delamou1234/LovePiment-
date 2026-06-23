'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import type { ConversationResume } from '@/modules/messagerie/types';
import { isAdminNavActive } from '../admin-ui';

const QUICK_ACTION =
  'relative flex h-9 w-9 items-center justify-center rounded-xl border border-beige-border bg-white text-zinc-500 shadow-sm transition hover:border-olive/30 hover:text-olive hover:shadow-md';

const QUICK_ACTION_ACTIVE =
  'border-olive/40 bg-olive/5 text-olive shadow-sm';

type Props = {
  conversations: ConversationResume[];
  totalUnread: number;
};

function formatRelative(date: Date | string | null) {
  if (!date) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function AdminMessagesMenu({ conversations, totalUnread }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = isAdminNavActive(pathname, '/admin/messagerie');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const preview = conversations.slice(0, 8);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${QUICK_ACTION} ${isActive ? QUICK_ACTION_ACTIVE : ''}`}
        title="Messages clients"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Messages clients${totalUnread > 0 ? ` (${totalUnread} non lus)` : ''}`}
      >
        <MessageSquare className="h-4 w-4" strokeWidth={1.75} />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-80 overflow-hidden rounded-xl border border-beige-border bg-white shadow-[0_12px_40px_rgba(0,0,0,0.1)] animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-beige-border/80 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Messages clients</p>
              <p className="text-[11px] text-zinc-500">
                {totalUnread > 0
                  ? `${totalUnread} message${totalUnread > 1 ? 's' : ''} non lu${totalUnread > 1 ? 's' : ''}`
                  : 'Aucun message non lu'}
              </p>
            </div>
            <Link
              href="/admin/messagerie"
              onClick={() => setOpen(false)}
              className="text-[11px] font-semibold text-olive hover:text-olive-dark"
            >
              Tout voir
            </Link>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {preview.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-500">
                Aucun message pour le moment.
              </p>
            ) : (
              <ul className="divide-y divide-beige-border/60">
                {preview.map((conv) => (
                  <li key={conv.id}>
                    <Link
                      href={`/admin/messagerie?c=${conv.id}`}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 hover:bg-cream transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium text-zinc-900">{conv.clientNom}</p>
                        {conv.nonLuVendeur > 0 && (
                          <span className="shrink-0 rounded-full bg-olive px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {conv.nonLuVendeur}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {conv.dernierMessage ?? 'Nouvelle conversation'}
                      </p>
                      <p className="mt-1 text-[10px] text-zinc-400">
                        {formatRelative(conv.dernierMessageAt)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
