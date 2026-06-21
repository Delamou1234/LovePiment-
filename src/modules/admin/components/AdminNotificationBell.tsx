'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { formaterDate } from '@/shared/lib/delivery-tracking';

type SatisfactionNotification = {
  id: string;
  message: string;
  date: string;
  orderId: string;
  clientNom: string;
  clientVille: string;
  satisfaction: 'SATISFAIT' | 'NON_SATISFAIT' | null;
  commentaire: string | null;
  suiviToken: string;
};

export function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<SatisfactionNotification[]>([]);
  const [toasts, setToasts] = useState<SatisfactionNotification[]>([]);
  const seenIds = useRef(new Set<string>());
  const readyRef = useRef(false);

  const pushToast = useCallback((notif: SatisfactionNotification) => {
    if (seenIds.current.has(notif.id)) return;
    seenIds.current.add(notif.id);
    if (!readyRef.current) return;
    setToasts((prev) => [notif, ...prev].slice(0, 3));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== notif.id));
    }, 8000);
  }, []);

  const handleIncoming = useCallback(
    (items: SatisfactionNotification[]) => {
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
          for (const n of data.notifications as SatisfactionNotification[]) {
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
        if (payload.type === 'satisfaction' && payload.notifications) {
          handleIncoming(payload.notifications);
        }
      } catch {
        /* ignore */
      }
    };
    es.onerror = () => setConnected(false);

    return () => es.close();
  }, [handleIncoming]);

  const unreadCount = notifications.filter((n) => !seenIds.current.has(n.id)).length;

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#ebe4d8] bg-white text-zinc-600 hover:text-zinc-900 hover:bg-[#faf7f2] transition"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {connected && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500" />
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-[#ebe4d8] bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-[#ebe4d8] px-4 py-3">
              <p className="text-sm font-semibold text-zinc-900">Avis clients</p>
              <span className="text-[11px] text-zinc-400">
                {connected ? 'Temps réel' : 'Hors ligne'}
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm text-zinc-500 text-center">
                  Aucun avis pour le moment.
                </p>
              ) : (
                <ul className="divide-y divide-[#ebe4d8]">
                  {notifications.map((n) => {
                    const positif = n.satisfaction === 'SATISFAIT';
                    return (
                      <li key={n.id} className="px-4 py-3 hover:bg-[#faf7f2]">
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
                              className="text-[11px] text-[#4a5240] hover:underline mt-1 inline-block"
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
          const positif = n.satisfaction === 'SATISFAIT';
          return (
            <div
              key={n.id}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-[#ebe4d8] bg-white px-4 py-3 shadow-lg max-w-sm animate-in slide-in-from-right"
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
