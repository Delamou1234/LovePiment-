'use client';

import { useCallback, useEffect, useState } from 'react';
import { CreditCard, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Trace = {
  id: string;
  action: string;
  telephoneContact: string | null;
  telephonePaiement: string;
  paymentOrderId: string | null;
  statut: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
};

const ACTION_LABELS: Record<string, string> = {
  INITIATION: 'Initiation paiement',
  RETRY: 'Nouvelle tentative',
  WEBHOOK_SUCCESS: 'Webhook — succès',
  WEBHOOK_FAILED: 'Webhook — échec',
  SYNC_SUCCESS: 'Sync — succès',
  SYNC_FAILED: 'Sync — échec',
};

function formaterDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminPaymentTracesPanel({
  orderId,
  clientTelephone,
  paymentTelephone,
}: {
  orderId: string;
  clientTelephone: string;
  paymentTelephone?: string | null;
}) {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/commandes/${orderId}/paiement-traces`);
      if (!res.ok) return;
      const data = (await res.json()) as { traces: Trace[] };
      setTraces(data.traces);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void charger();
  }, [charger]);

  const numeroPaiement = paymentTelephone?.trim() || clientTelephone;
  const paiementDifferent = numeroPaiement !== clientTelephone;

  return (
    <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-3 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5 text-orange-700" />
          Paiement Orange Money
        </p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={() => {
            setOpen((v) => !v);
            if (!open) void charger();
          }}
        >
          {open ? 'Masquer les traces' : 'Voir les traces'}
        </Button>
      </div>

      <div className="text-xs text-zinc-600 space-y-1">
        <p>
          Contact / livraison : <strong>{clientTelephone}</strong>
        </p>
        {paiementDifferent ? (
          <p className="text-orange-800 font-medium">
            Numéro de paiement : <strong>{numeroPaiement}</strong>
          </p>
        ) : (
          <p className="text-zinc-500">Même numéro pour le paiement</p>
        )}
      </div>

      {open && (
        <div className="space-y-2 pt-1 border-t border-orange-100">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              Historique ({traces.length})
            </p>
            <button
              type="button"
              onClick={() => void charger()}
              className="text-zinc-400 hover:text-zinc-600"
              aria-label="Actualiser"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading && traces.length === 0 ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          ) : traces.length === 0 ? (
            <p className="text-xs text-zinc-500">Aucune trace enregistrée.</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {traces.map((t) => (
                <li
                  key={t.id}
                  className="rounded-lg bg-white border border-zinc-100 px-2.5 py-2 text-[11px]"
                >
                  <div className="flex justify-between gap-2 font-semibold text-zinc-800">
                    <span>{ACTION_LABELS[t.action] ?? t.action}</span>
                    <span className="text-zinc-400 font-normal shrink-0">
                      {formaterDate(t.createdAt)}
                    </span>
                  </div>
                  <p className="text-zinc-500 mt-0.5">
                    Paiement : {t.telephonePaiement}
                    {t.telephoneContact && t.telephoneContact !== t.telephonePaiement && (
                      <> · Contact : {t.telephoneContact}</>
                    )}
                  </p>
                  {(t.statut || t.paymentOrderId) && (
                    <p className="text-zinc-400 mt-0.5">
                      {t.statut && <span>{t.statut}</span>}
                      {t.paymentOrderId && (
                        <span className="ml-1 font-mono">#{t.paymentOrderId.slice(0, 12)}…</span>
                      )}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
