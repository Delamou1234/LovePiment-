'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BellRing, Package, Truck } from 'lucide-react';
import type { SuiviCommandeDto } from '@/modules/livraison/services/tracking.service';
import { formaterDate } from '@/shared/lib/delivery-tracking';
import { OrderSatisfactionForm } from '@/shared/components/OrderSatisfactionForm';

interface OrderTrackingViewProps {
  token: string;
  initialData?: SuiviCommandeDto | null;
}

export function OrderTrackingView({ token, initialData }: OrderTrackingViewProps) {
  const [suivi, setSuivi] = useState<SuiviCommandeDto | null>(initialData ?? null);
  const [connected, setConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const lastNotifRef = useRef<string>('');

  const showBrowserNotification = useCallback(
    (title: string, body: string) => {
      if (!notificationsEnabled || typeof window === 'undefined' || !('Notification' in window)) {
        return;
      }
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
    },
    [notificationsEnabled],
  );

  useEffect(() => {
    if (!suivi) return;
    const latest = suivi.notifications[0];
    if (!latest || latest.id === lastNotifRef.current) return;
    lastNotifRef.current = latest.id;
    showBrowserNotification('Love Piment& — Livraison', latest.message);
  }, [suivi, showBrowserNotification]);

  useEffect(() => {
    const es = new EventSource(`/api/suivi/${token}/stream`);

    es.onopen = () => setConnected(true);
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'update' && payload.suivi) {
          setSuivi(payload.suivi);
        }
      } catch {
        /* ignore */
      }
    };
    es.onerror = () => setConnected(false);

    return () => es.close();
  }, [token]);

  const activerNotifications = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
  };

  if (!suivi) {
    return (
      <p className="text-center text-sm text-zinc-500 py-12">
        Impossible de charger le suivi de cette commande.
      </p>
    );
  }

  const enCours = suivi.statut !== 'LIVREE' && suivi.statut !== 'ANNULEE';

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[#F2D4DC] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9B1B2E] mb-1">
              Commande #{suivi.id.slice(0, 8)}
            </p>
            <h1 className="font-serif text-2xl font-bold text-zinc-900">{suivi.statutLibelle}</h1>
            <p className="text-sm text-zinc-500 mt-1">{suivi.clientNom} · {suivi.clientVille}</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
                connected ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
              {connected ? 'Suivi en direct' : 'Reconnexion…'}
            </span>
          </div>
        </div>

        {enCours && (
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-[#FFF8F6] border border-[#F2D4DC] p-4">
            <Truck className="h-5 w-5 text-[#9B1B2E] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-zinc-900">Estimation de livraison</p>
              <p className="text-sm text-zinc-600 mt-0.5">{suivi.livraisonLibelle}</p>
              {suivi.transporteur && (
                <p className="text-xs text-zinc-500 mt-2">
                  Transporteur : <strong>{suivi.transporteur.nom}</strong>
                  {suivi.transporteur.telephone ? ` · ${suivi.transporteur.telephone}` : ''}
                </p>
              )}
              {suivi.numeroSuivi && (
                <p className="text-xs text-zinc-500 mt-1">
                  N° de suivi colis : <strong>{suivi.numeroSuivi}</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {suivi.statut === 'LIVREE' && suivi.livreeLe && (
          <p className="mt-4 text-sm text-emerald-700 font-medium">
            Livrée le {formaterDate(new Date(suivi.livreeLe))}
          </p>
        )}
      </div>

      {suivi.statut === 'LIVREE' && (
        <OrderSatisfactionForm
          token={token}
          satisfaction={suivi.satisfaction}
          onSubmitted={setSuivi}
        />
      )}

      <div className="rounded-2xl border border-[#F2D4DC] bg-white p-6 shadow-sm">
        <h2 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
          <Package className="h-5 w-5 text-[#9B1B2E]" />
          Progression
        </h2>
        <ol className="space-y-0">
          {suivi.timeline.map((step, index) => (
            <li key={step.statut} className="relative flex gap-4 pb-8 last:pb-0">
              {index < suivi.timeline.length - 1 && (
                <span
                  className={`absolute left-[11px] top-6 h-full w-0.5 ${
                    step.atteint ? 'bg-[#9B1B2E]' : 'bg-zinc-200'
                  }`}
                />
              )}
              <span
                className={`relative z-[1] mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  step.actif
                    ? 'border-[#9B1B2E] bg-[#9B1B2E] text-white'
                    : step.atteint
                      ? 'border-[#9B1B2E] bg-white text-[#9B1B2E]'
                      : 'border-zinc-200 bg-white text-zinc-300'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className={`text-sm font-semibold ${step.atteint ? 'text-zinc-900' : 'text-zinc-400'}`}>
                  {step.libelle}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">{step.description}</p>
                {step.date && (
                  <p className="text-[11px] text-zinc-400 mt-1">{step.date}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-[#F2D4DC] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-bold text-zinc-900 flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#9B1B2E]" />
            Notifications
          </h2>
          {!notificationsEnabled && (
            <button
              type="button"
              onClick={activerNotifications}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#F2D4DC] px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-[#FFF8F6]"
            >
              <BellRing className="h-3.5 w-3.5" />
              Activer les alertes
            </button>
          )}
        </div>
        {suivi.notifications.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucune notification pour le moment.</p>
        ) : (
          <ul className="space-y-3">
            {suivi.notifications.map((n) => (
              <li
                key={n.id}
                className="rounded-lg border border-[#F2D4DC] bg-[#FFF8F6]/50 px-4 py-3 text-sm text-zinc-700"
              >
                <p>{n.message}</p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {formaterDate(new Date(n.date))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
