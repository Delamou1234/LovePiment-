'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Package, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { ADMIN_TOPBAR_BELL, ADMIN_TOPBAR_LIVE } from '../admin-ui';
import type { AdminNotification } from '@/modules/admin/types/notifications';
import { formaterDate } from '@/shared/lib/delivery-tracking';

export function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [toasts, setToasts] = useState<AdminNotification[]>([]);
  const seenIds = useRef(new Set<string>());
  const readyRef = useRef(false);

  const pushToast = useCallback((notif: AdminNotification) => {
    if (seenIds.current.has(notif.id)) return;
    seenIds.current.add(notif.id);
    if (!readyRef.current) return;
    setToasts((prev) => [notif, ...prev].slice(0, 3));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== notif.id));
    }, 8000);
  }, []);

  const handleIncoming = useCallback(
    (items: AdminNotification[]) => {
      setNotifications((prev) => {
        const merged = [...items];
        for (const n of prev) {
          if (!merged.some((m) => m.id === n.id)) merged.push(n);
        }
        return merged
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 20);
      });
      for (const n of items) pushToast(n);
    },
    [pushToast],
  );

  useEffect(() => {
    fetch('/api/admin/notifications')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.notifications) {
          for (const n of data.notifications as AdminNotification[]) {
            seenIds.current.add(n.id);
          }
          setNotifications(data.notifications);
        }
        readyRef.current = true;
      })
      .catch(() => {
        readyRef.current = true;
      });
  }, []);

  useEffect(() => {
    const es = new EventSource('/api/admin/notifications/stream');

    es.onopen = () => setConnected(true);
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'notifications' && payload.notifications) {
          handleIncoming(payload.notifications as AdminNotification[]);
        }
        if (payload.type === 'satisfaction' && payload.notifications) {
          handleIncoming(payload.notifications as AdminNotification[]);
        }
      } catch {
        /* ignore */
      }
    };
    es.onerror = () => setConnected(false);

    return () => es.close();
  }, [handleIncoming]);

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={ADMIN_TOPBAR_BELL}
          aria-label="Notifications administration"
          aria-expanded={open}
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          {connected && <span className={ADMIN_TOPBAR_LIVE} aria-hidden />}
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-[#F2D4DC] bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-[#F2D4DC] px-4 py-3">
              <p className="text-sm font-semibold text-zinc-900">Notifications</p>
              <span className="text-[11px] text-zinc-400">
                {connected ? 'Temps réel' : 'Hors ligne'}
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm text-zinc-500 text-center">
                  Aucune notification pour le moment.
                </p>
              ) : (
                <ul className="divide-y divide-[#F2D4DC]">
                  {notifications.map((n) => {
                    if (n.kind === 'livreur') {
                      return (
                        <li key={n.id} className="px-4 py-3 hover:bg-[#FFF8F6]">
                          <div className="flex items-start gap-2">
                            <Package className="h-4 w-4 text-sky-700 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-900">
                                Prise en charge colis
                              </p>
                              <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">
                                <span className="font-semibold text-zinc-800">{n.livreurNom}</span>
                                {' · colis de '}
                                <span className="font-semibold text-zinc-800">{n.clientNom}</span>
                              </p>
                              <p className="text-xs text-zinc-500 mt-0.5">{n.clientVille}</p>
                              <p className="text-[10px] text-zinc-400 mt-1">
                                {formaterDate(new Date(n.date))}
                              </p>
                              <Link
                                href="/admin/commandes"
                                className="text-[11px] text-[#9B1B2E] hover:underline mt-1 inline-block"
                                onClick={() => setOpen(false)}
                              >
                                Voir commandes →
                              </Link>
                            </div>
                          </div>
                        </li>
                      );
                    }

                    const positif = n.satisfaction === 'SATISFAIT';
                    return (
                      <li key={n.id} className="px-4 py-3 hover:bg-[#FFF8F6]">
                        <div className="flex items-start gap-2">
                          {positif ? (
                            <ThumbsUp className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <ThumbsDown className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-900">{n.clientNom}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {positif ? 'Satisfait' : 'Insatisfait'} · {n.clientVille}
                            </p>
                            {n.commentaire && (
                              <p className="text-xs text-zinc-600 mt-1">« {n.commentaire} »</p>
                            )}
                            <p className="text-[10px] text-zinc-400 mt-1">
                              {formaterDate(new Date(n.date))}
                            </p>
                            <Link
                              href="/admin/commandes"
                              className="text-[11px] text-[#9B1B2E] hover:underline mt-1 inline-block"
                              onClick={() => setOpen(false)}
                            >
                              Voir commandes →
                            </Link>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((n) => {
          if (n.kind === 'livreur') {
            return (
              <div
                key={n.id}
                className="pointer-events-auto flex items-start gap-3 rounded-xl border border-sky-200 bg-white px-4 py-3 shadow-lg max-w-sm animate-in slide-in-from-right"
              >
                <Package className="h-5 w-5 text-sky-700 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-900">Colis pris en charge</p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {n.livreurNom} — {n.clientNom}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-zinc-400 hover:text-zinc-700"
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== n.id))}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          }

          const positif = n.satisfaction === 'SATISFAIT';
          return (
            <div
              key={n.id}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-[#F2D4DC] bg-white px-4 py-3 shadow-lg max-w-sm animate-in slide-in-from-right"
            >
              {positif ? (
                <ThumbsUp className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <ThumbsDown className="h-5 w-5 text-amber-600 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900">
                  {positif ? 'Client satisfait' : 'Client insatisfait'}
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">
                  {n.clientNom} — commande #{n.orderId.slice(0, 8)}
                </p>
              </div>
              <button
                type="button"
                className="text-zinc-400 hover:text-zinc-700"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== n.id))}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
